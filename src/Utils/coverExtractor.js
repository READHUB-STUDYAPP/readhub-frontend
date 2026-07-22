import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extract Cover Image from PDF (first page as cover)
 */

export const extractPdfCover = async (pdf) => {
  try {
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return canvas.toDataURL("image/jpeg", 0.7);
  } catch (error) {
    console.error("Error extracting PDF cover:", error);
    return null;
  }
};
/**
 * Extract cover for Epub
 */
export const extractEpubCover = async (epubDataUrl) => {
  try {
    console.log("📚 Extracting EPUB cover...");

    const ePub = (await import("epubjs")).default;

    // Convert to blob
    const base64String = epubDataUrl.split(",")[1];
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/epub+zip" });

    // Load book
    const book = ePub(blob);
    await book.ready;

    let coverUrl = null;

    // ✅ Method 1: Try book.coverUrl() - most reliable
    try {
      console.log("Trying book.coverUrl()...");
      coverUrl = await book.coverUrl();
      console.log("Cover URL from coverUrl():", coverUrl);
    } catch (err) {
      console.warn("coverUrl() failed:", err.message);
    }

    // ✅ Method 2: Search in resources (manifest is an object, not array)
    if (!coverUrl) {
      try {
        console.log("Searching in book resources...");
        const resources = await book.loaded.resources;
        console.log("Resources:", resources);

        // Check if resources exists and has properties
        if (resources && typeof resources === "object") {
          // Look for cover image in resources
          const coverKey = Object.keys(resources).find((key) => {
            const resource = resources[key];
            return (
              resource.href?.toLowerCase().includes("cover") ||
              resource.properties?.includes("cover-image") ||
              key.toLowerCase().includes("cover")
            );
          });

          if (coverKey) {
            const coverItem = resources[coverKey];
            console.log("Found cover item:", coverItem);
            coverUrl = await book.archive.createUrl(coverItem.href);
            console.log("Cover URL from resources:", coverUrl);
          }
        }
      } catch (err) {
        console.warn("Resources search failed:", err.message);
      }
    }

    // ✅ Method 3: Look in spine (first image)
    if (!coverUrl) {
      try {
        console.log("Looking for first image in spine...");
        const spine = await book.loaded.spine;

        if (spine && spine.items && spine.items.length > 0) {
          // Load first spine item
          const firstItem = spine.items[0];
          const section = book.spine.get(firstItem.href);

          if (section) {
            await section.load(book.load.bind(book));

            // Look for img tag in the section
            const doc = section.document || section.contents?.document;
            if (doc) {
              const img = doc.querySelector("img");
              if (img && img.src) {
                console.log("Found image in first section:", img.src);

                // If it's a relative path, create URL from archive
                if (
                  !img.src.startsWith("http") &&
                  !img.src.startsWith("blob:")
                ) {
                  const imgPath = img.getAttribute("src");
                  coverUrl = await book.archive.createUrl(imgPath);
                } else {
                  coverUrl = img.src;
                }

                console.log("Cover URL from spine:", coverUrl);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Spine search failed:", err.message);
      }
    }

    // ✅ Convert blob URL to data URL
    if (coverUrl) {
      if (coverUrl.startsWith("blob:")) {
        console.log("Converting blob URL to data URL...");
        try {
          const response = await fetch(coverUrl);
          const coverBlob = await response.blob();

          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(coverBlob);
          });

          await book.destroy();
          console.log("✅ EPUB cover extracted successfully (blob → data URL)");
          return dataUrl;
        } catch (err) {
          console.error("Failed to convert blob to data URL:", err);
        }
      } else if (coverUrl.startsWith("http")) {
        // External URL - try to fetch and convert
        console.log("Fetching external cover URL...");
        try {
          const response = await fetch(coverUrl);
          const coverBlob = await response.blob();

          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(coverBlob);
          });

          await book.destroy();
          console.log("✅ EPUB cover extracted successfully (http → data URL)");
          return dataUrl;
        } catch (err) {
          console.error("Failed to fetch external cover:", err);
        }
      } else {
        // Already a data URL
        await book.destroy();
        console.log("✅ EPUB cover extracted successfully (data URL)");
        return coverUrl;
      }
    }

    await book.destroy();
    console.warn("⚠️ No cover found in EPUB");
    return null;
  } catch (error) {
    console.error("❌ Error extracting EPUB cover:", error);
    return null;
  }
};
