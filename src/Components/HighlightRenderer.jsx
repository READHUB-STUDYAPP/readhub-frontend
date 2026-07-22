import React from "react";

/**
 * Renders text with highlighted portions
 * Handles highlights that may span multiple lines/elements
 * Returns proper JSX that React can render
 */
export const renderTextWithHighlights = (
  text,
  highlights = [],
  pageNumber,
  paragraphIndex,
) => {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  // Filter highlights for current page
  const currentPageHighlights = highlights.filter((h) => h.page === pageNumber);
  
  if (currentPageHighlights.length === 0) {
    return text;
  }

  let result = [];
  let lastIndex = 0;
  
  // Find all highlight matches and their positions
  const highlightMatches = [];
  
  currentPageHighlights.forEach((highlight) => {
    // Text-mode range highlights (exact block selection)
    if (
      typeof paragraphIndex === "number" &&
      highlight?.textRange &&
      typeof highlight.textRange.startParagraphIndex === "number" &&
      typeof highlight.textRange.endParagraphIndex === "number"
    ) {
      const startP = highlight.textRange.startParagraphIndex;
      const endP = highlight.textRange.endParagraphIndex;
      if (paragraphIndex < startP || paragraphIndex > endP) return;

      let startIndex = 0;
      let endIndex = text.length;

      if (paragraphIndex === startP) {
        const s = Number(highlight.textRange.startOffsetInParagraph);
        if (Number.isFinite(s)) startIndex = Math.max(0, Math.min(text.length, s));
      }
      if (paragraphIndex === endP) {
        const e = Number(highlight.textRange.endOffsetInParagraph);
        if (Number.isFinite(e)) endIndex = Math.max(0, Math.min(text.length, e));
      }

      if (endIndex > startIndex) {
        highlightMatches.push({
          startIndex,
          endIndex,
          text: text.substring(startIndex, endIndex),
          highlightId: highlight.id,
        });
      }
      return;
    }

    if (!highlight.text) return;
    
    // Find all occurrences of this highlight in the text
    let searchIndex = 0;
    while (searchIndex < text.length) {
      const foundIndex = text.indexOf(highlight.text, searchIndex);
      if (foundIndex === -1) break;
      
      highlightMatches.push({
        startIndex: foundIndex,
        endIndex: foundIndex + highlight.text.length,
        text: highlight.text,
        highlightId: highlight.id,
      });
      
      searchIndex = foundIndex + 1;
    }
  });

  // Sort by start index
  highlightMatches.sort((a, b) => a.startIndex - b.startIndex);

  // Remove overlapping highlights (keep the first one)
  const nonOverlapping = [];
  highlightMatches.forEach((match) => {
    const overlaps = nonOverlapping.some(
      (existing) =>
        (match.startIndex >= existing.startIndex && match.startIndex < existing.endIndex) ||
        (match.endIndex > existing.startIndex && match.endIndex <= existing.endIndex)
    );
    if (!overlaps) {
      nonOverlapping.push(match);
    }
  });

  // Build the result
  nonOverlapping.forEach((match, idx) => {
    // Add text before highlight
    if (match.startIndex > lastIndex) {
      result.push(text.substring(lastIndex, match.startIndex));
    }
    
    // Add highlighted text
    result.push(
      <mark 
        key={`highlight-${match.highlightId}-${idx}`} 
        className="bg-yellow-300 rounded px-0.5"
        style={{ backgroundColor: '#ffff00', padding: '0 2px', margin: '0 -2px' }}
      >
        {match.text}
      </mark>
    );
    
    lastIndex = match.endIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  // Return wrapped in fragment to ensure proper rendering
  return result.length > 0 ? <>{result}</> : text;
};

/**
 * Highlights text segments within a PDF text layer
 * More robust approach using mutation observer and direct element styling
 */
export const highlightTextInPDF = (containerSelector, highlights = [], pageNumber) => {
  if (!highlights || highlights.length === 0) return;

  const currentPageHighlights = highlights.filter(h => h.page === pageNumber);
  if (currentPageHighlights.length === 0) return;

  try {
    // Try multiple possible selectors for PDF text layer
    let textLayer = document.querySelector(containerSelector);
    
    // If the provided selector doesn't work, try common alternatives
    if (!textLayer) {
      const selectors = [
        ".textLayer", 
        ".react-pdf__Page__textLayer",
        ".pdfViewer .page .textLayer",
        "[role='presentation'] .textLayer"
      ];
      
      for (const selector of selectors) {
        textLayer = document.querySelector(selector);
        if (textLayer) {
          console.log(`Found text layer with selector: ${selector}`);
          break;
        }
      }
    }
    
    if (!textLayer) {
      console.warn(`No text layer found. Tried selectors: ${containerSelector}, .textLayer, .react-pdf__Page__textLayer, .pdfViewer .page .textLayer, [role='presentation'] .textLayer`);
      return;
    }

    // Clear existing highlights
    const existingMarks = textLayer.querySelectorAll("mark");
    existingMarks.forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    });

    const existingStyled = textLayer.querySelectorAll("[data-rh-highlight='1']");
    existingStyled.forEach((el) => {
      el.style.backgroundColor = "";
      el.style.borderRadius = "";
      el.style.boxShadow = "";
      el.removeAttribute("data-rh-highlight");
    });

    // Find text nodes (in DOM order)
    const walker = document.createTreeWalker(
      textLayer,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    // Map nodes to global offsets
    const nodeOffsets = [];
    let running = 0;
    textNodes.forEach((textNode) => {
      const len = textNode.textContent?.length ?? 0;
      nodeOffsets.push({
        node: textNode,
        start: running,
        end: running + len,
      });
      running += len;
    });

    const getHighlightColor = (color) => {
      const c = (color || "yellow").toString().toLowerCase();
      if (c === "blue") {
        return {
          bg: "rgba(59, 130, 246, 0.35)",
          shadow: "rgba(59, 130, 246, 0.22)",
        };
      }
      if (c === "green") {
        return {
          bg: "rgba(34, 197, 94, 0.28)",
          shadow: "rgba(34, 197, 94, 0.18)",
        };
      }
      return {
        bg: "rgba(255, 235, 59, 0.55)",
        shadow: "rgba(255, 235, 59, 0.35)",
      };
    };

    const applySpanStyle = (el, color) => {
      if (!el || el.nodeType !== 1) return;
      const { bg, shadow } = getHighlightColor(color);
      el.setAttribute("data-rh-highlight", "1");
      // Use background/boxShadow only (avoid padding which can shift PDF layout)
      el.style.backgroundColor = bg;
      el.style.borderRadius = "2px";
      el.style.boxShadow = `inset 0 -0.6em 0 ${shadow}`;
    };

    // Apply offset-based highlights (exact range, 1 highlight = 1 range)
    currentPageHighlights.forEach((h) => {
      if (typeof h?.startOffset !== "number" || typeof h?.endOffset !== "number") {
        return;
      }

      nodeOffsets.forEach(({ node: textNode, start, end }) => {
        if (start >= h.endOffset || end <= h.startOffset) return;
        const el = textNode.parentElement;
        applySpanStyle(el, h.color);
      });
    });

    // Fallback: apply a single match per highlight (avoid highlighting every occurrence)
    currentPageHighlights.forEach((h) => {
      if (!h?.text || typeof h.text !== "string") return;
      if (typeof h?.startOffset === "number" && typeof h?.endOffset === "number") return;

      let applied = false;
      for (const { node: textNode } of nodeOffsets) {
        if (applied) break;
        const content = textNode.textContent || "";
        if (!content.includes(h.text)) continue;
        applySpanStyle(textNode.parentElement, h.color);
        applied = true;
      }
    });
  } catch (error) {
    console.warn("Error highlighting text in PDF:", error);
  }
};

export default { renderTextWithHighlights, highlightTextInPDF };
