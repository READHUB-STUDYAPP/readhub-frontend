import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const base64ToArrayBuffer = (base64) => {
  const base64String = base64.includes(",") ? base64.split(",")[1] : base64;

  const binaryString = window.atob(base64String);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
};

export const extractTextWithLayout = async (fileOrBase64) => {
  try {
    let arrayBuffer;

    // CASE 1: URL (Cloudinary)
    if (typeof fileOrBase64 === "string" && fileOrBase64.startsWith("http")) {
      const response = await fetch(fileOrBase64);

      if (!response.ok) {
        throw new Error("Failed to fetch PDF");
      }

      arrayBuffer = await response.arrayBuffer();
    }

    // CASE 2: Base64 string
    else if (typeof fileOrBase64 === "string") {
      arrayBuffer = base64ToArrayBuffer(fileOrBase64);
    }

    // CASE 3: File object
    else if (fileOrBase64 instanceof File) {
      arrayBuffer = await fileOrBase64.arrayBuffer();
    } else {
      throw new Error("Invalid input: expected URL, base64, or File");
    }

    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const allpages = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const textItems = textContent.items.map((item) => ({
        text: item.str,
      }));

      allpages.push({
        pageNumber: pageNum,
        textItems: textItems,
      });
    }

    return allpages;
  } catch (error) {
    console.error("Error extracting text with layout:", error);
    throw error;
  }
};
