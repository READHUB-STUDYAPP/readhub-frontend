import React, { useState, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { extractTextWithLayout } from "../Utils/pdfUtils";
import { useFiles } from "../Context/FileContext";

import { useParams } from "react-router-dom";
import { renderTextWithHighlights } from "./HighlightRenderer";

const CustomTextViewer = ({ fileData, file, theme, scale, onTextSelect }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const [minChars] = useState(200);

  const { fileId } = useParams();

  const { currentPage, updateCurrentPage } = useFiles();
  const pageNumber = currentPage[fileId] ?? file?.lastPageRead ?? 1;

  /* ---------------- Load PDF Text ---------------- */

  useEffect(() => {
    if (!fileData) return;

    const loadText = async () => {
      setLoading(true);
      setError(null);

      try {
        const extractedPages = await extractTextWithLayout(fileData);

        if (!Array.isArray(extractedPages) || extractedPages.length === 0) {
          throw new Error("No text could be extracted from this PDF.");
        }

        setPages(extractedPages);
      } catch (err) {
        setError(err.message || "Failed to extract text from PDF.");
      } finally {
        setLoading(false);
      }
    };

    loadText();
  }, [fileData]);

  /* ---------------- Navigation ---------------- */

  const goToNextPage = () => {
    const newPage = Math.min(pages.length, (currentPage[fileId] || 1) + 1);
    updateCurrentPage(fileId, newPage);
  };

  const goToPreviousPage = () => {
    const newPage = Math.max(1, (currentPage[fileId] || 1) - 1);
    updateCurrentPage(fileId, newPage);
  };

  /* ---------------- Paragraph Formatting ---------------- */

  const formatIntoParagraphs = (textItems = []) => {
    if (!Array.isArray(textItems) || textItems.length === 0) return [];

    const allText = textItems.map((item) => item.text).join(" ");

    const paragraphs = [];
    let currentParagraph = "";
    let charCount = 0;

    const words = allText.split(" ");

    for (let word of words) {
      currentParagraph += word + " ";
      charCount += word.length + 1;

      if (
        (word.endsWith(".") || word.endsWith("!") || word.endsWith("?")) &&
        charCount >= minChars
      ) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = "";
        charCount = 0;
      }
    }

    if (currentParagraph.trim()) paragraphs.push(currentParagraph.trim());

    return paragraphs;
  };

  /* ---------------- Swipe ---------------- */
  const handleTextSelectionWithFallback = (event) => {
    // Handle both mouse and touch selection
    if (onTextSelect) {
      onTextSelect(event);
    }
  };

  const [scrollDirection, setScrollDirection] = useState(
    () => localStorage.getItem("pdfScrollDirection") || "horizontal",
  );

  // Swipe-------------------------------------//

  /* ---------------- UI States ---------------- */
  // Track highlights to ensure re-render when they change
  const { highlights: allHighlights } = useFiles();
  const [highlights, setHighlights] = useState([]);
  const fileKey = file?._id ?? file?.id ?? file?.bookId ?? null;

  useEffect(() => {
    if (fileKey && allHighlights) {
      const fileHighlights = allHighlights[fileKey] || [];
      setHighlights(fileHighlights);
      console.log(
        "CustomTextViewer: Highlights updated for file",
        fileKey,
        "- Page",
        pageNumber,
        "has",
        fileHighlights.filter((h) => h.page === pageNumber).length,
        "highlights",
      );
    }
  }, [fileKey, allHighlights, pageNumber]);

  // Get highlights for current file
  const currentHighlights = highlights;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Extracting text from PDF...
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline min-h-fit">
        <p className="text-red-600 inline">Error:</p>
        {error}
      </div>
    );
  }

  if (!pages.length) {
    return (
      <div className="flex justify-center items-center min-h-10">
        No text available.
      </div>
    );
  }

  const page = pages[pageNumber - 1];

  if (!page || !page.textItems) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Page content unavailable.
      </div>
    );
  }

  const paragraphs = formatIntoParagraphs(page.textItems);

  /* ---------------- Render ---------------- */
  {
  }
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div
          onMouseUpCapture={handleTextSelectionWithFallback}
          onTouchEndCapture={handleTextSelectionWithFallback}
        >
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              data-rh-paragraph-index={index}
              style={{ fontSize: `${scale}px` }}
              className={`font-medium leading-[185%] tracking-[-0.4px] mb-4 ${
                theme ? "text-[#ECF0F8]" : "text-[#1A1A1A]"
              }`}
            >
              {renderTextWithHighlights(
                paragraph,
                currentHighlights,
                pageNumber,
                index,
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomTextViewer;
