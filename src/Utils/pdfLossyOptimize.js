const MAX_BYTES_DEFAULT = 10 * 1024 * 1024; // 10MB

const blobFromCanvas = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to encode page"))),
        type,
        quality,
      );
    } catch (e) {
      reject(e);
    }
  });

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * Lossy PDF optimization: rasterizes each page and rebuilds a new PDF.
 * Pros: can significantly reduce size for image-heavy PDFs.
 * Cons: loses selectable text/search; may reduce visual quality depending on settings.
 *
 * @param {import('pdfjs-dist').PDFDocumentProxy} pdf
 * @param {object} opts
 * @param {(p:{pass:number,page:number,totalPages:number})=>void} onProgress
 */
export async function optimizePdfLossy(pdf, opts = {}, onProgress = null) {
  const maxBytes = Number(opts.maxBytes ?? MAX_BYTES_DEFAULT);
  const maxPasses = Number(opts.maxPasses ?? 4);

  const startingScale = Number(opts.startingScale ?? 1.0);
  const startingQuality = Number(opts.startingQuality ?? 0.72);

  const minScale = Number(opts.minScale ?? 0.7);
  const minQuality = Number(opts.minQuality ?? 0.55);

  const totalPages = pdf?.numPages || 0;
  if (!totalPages) throw new Error("Invalid PDF document");

  const { PDFDocument } = await import("pdf-lib");

  let scale = startingScale;
  let quality = startingQuality;

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    const out = await PDFDocument.create();

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      onProgress?.({ pass, page: pageNumber, totalPages });

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas not supported");

      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      await page.render({ canvasContext: ctx, viewport }).promise;

      const jpgBlob = await blobFromCanvas(canvas, "image/jpeg", quality);
      const jpgBytes = await jpgBlob.arrayBuffer();
      const jpg = await out.embedJpg(jpgBytes);

      const outPage = out.addPage([canvas.width, canvas.height]);
      outPage.drawImage(jpg, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });

      // Cleanup to reduce memory pressure
      try {
        page.cleanup?.();
      } catch {}
      canvas.width = 0;
      canvas.height = 0;
    }

    const bytes = await out.save({ useObjectStreams: true });
    const blob = new Blob([bytes], { type: "application/pdf" });

    if (blob.size <= maxBytes) return blob;

    // Next pass: step down scale/quality
    scale = clamp(scale - 0.15, minScale, startingScale);
    quality = clamp(quality - 0.08, minQuality, startingQuality);
  }

  throw new Error("Could not compress this PDF under 10MB with current settings.");
}
