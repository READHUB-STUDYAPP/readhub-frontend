import React, { useEffect, useMemo, useRef } from "react";
import { createContext, useState, useContext, useCallback } from "react";
import { backendApi } from "../services/api";
import { extractEpubCover, extractPdfCover } from "../Utils/coverExtractor";
import {
  uploadCoverToCloudinary,
  uploadToCloudinary,
} from "../Utils/CloudinaryUpload";

const FileContext = createContext();

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export function FileProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [selectedFile2, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState({});
  const [highlights, setHighlights] = useState(() => {
    const saved = localStorage.getItem("appHighlights");
    return saved ? JSON.parse(saved) : {};
  });
  const [readingGoal, setReadingGoalState] = useState(() => {
    const saved = localStorage.getItem("readingGoal");
    const parsed = saved ? Number(saved) : 30;
    return Number.isFinite(parsed) ? parsed : 30;
  });

  const [activeReading, setActiveReading] = useState(() => {
    try {
      // sessionStorage prevents "offline time" being counted after tab/app is closed.
      const saved = sessionStorage.getItem("activeReading");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const tickTimerRef = useRef(null);

  const setReadingGoal = useCallback((value) => {
    const num = Number(value);
    const next = Number.isFinite(num) ? Math.round(num) : 30;
    setReadingGoalState(next);
    localStorage.setItem("readingGoal", String(next));
  }, []);

  const startLocalReadingTimer = useCallback((bookId) => {
    if (!bookId) return;
    const now = Date.now();
    const next = {
      bookId,
      startedAt: now,
      accumulatedMs: 0,
      lastTickAt: now,
      paused: typeof document !== "undefined" ? document.hidden : false,
    };
    setActiveReading(next);
    try {
      sessionStorage.setItem("activeReading", JSON.stringify(next));
    } catch {}
  }, []);

  const stopLocalReadingTimer = useCallback(() => {
    setActiveReading(null);
    try {
      sessionStorage.removeItem("activeReading");
    } catch {}
  }, []);

  // Normalize any restored timer state so we never count "offline time" between app/tab closes.
  useEffect(() => {
    setActiveReading((prev) => {
      if (!prev?.startedAt) return prev;
      const now = Date.now();
      return {
        ...prev,
        lastTickAt: now,
        paused: typeof document !== "undefined" ? document.hidden : false,
      };
    });
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist timer state only for the current tab/session.
  useEffect(() => {
    try {
      if (!activeReading) sessionStorage.removeItem("activeReading");
      else
        sessionStorage.setItem("activeReading", JSON.stringify(activeReading));
    } catch {}
  }, [activeReading]);

  // Pause/resume based on tab visibility to prevent background counting.
  useEffect(() => {
    const onVisibilityChange = () => {
      const hidden = typeof document !== "undefined" ? document.hidden : false;
      setActiveReading((prev) => {
        if (!prev?.startedAt) return prev;
        const now = Date.now();
        return { ...prev, paused: hidden, lastTickAt: now };
      });
    };

    const onPageHide = () => {
      setActiveReading((prev) => {
        if (!prev?.startedAt) return prev;
        const now = Date.now();
        return { ...prev, paused: true, lastTickAt: now };
      });
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    window.addEventListener("pagehide", onPageHide);

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // Tick only while visible + unpaused; increment using small deltas to avoid huge jumps.
  useEffect(() => {
    const shouldRun =
      Boolean(activeReading?.startedAt) &&
      !activeReading?.paused &&
      (typeof document === "undefined" || !document.hidden);

    if (!shouldRun) {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
      return;
    }

    if (tickTimerRef.current) return;

    tickTimerRef.current = setInterval(() => {
      setActiveReading((prev) => {
        if (!prev?.startedAt || prev.paused) return prev;

        const now = Date.now();
        const last = Number(prev.lastTickAt || now);
        const delta = now - last;
        if (!Number.isFinite(delta) || delta <= 0) {
          return { ...prev, lastTickAt: now };
        }

        // Clamp per-tick increment so background/throttled timers can't "catch up" with a huge delta.
        const clampedDelta = Math.min(delta, 1100);
        return {
          ...prev,
          accumulatedMs: Number(prev.accumulatedMs || 0) + clampedDelta,
          lastTickAt: now,
        };
      });
    }, 1000);

    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    };
  }, [activeReading?.startedAt, activeReading?.paused]);

  const liveReadingMinutes = useMemo(() => {
    const ms = Number(activeReading?.accumulatedMs || 0);
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return ms / 1000 / 60;
  }, [activeReading?.accumulatedMs]);

  const debouncedSave = useCallback(
    debounce(async (fileId, page) => {
      await backendApi.updateProgress(fileId, page);
    }, 1000),
    [],
  );

  const getBookKey = (book) => book?._id ?? book?.id ?? book?.bookId ?? null;

  const updateCurrentPage = (fileId, page) => {
    setCurrentPage((prev) => ({
      ...prev,
      [fileId]: page,
    }));
    debouncedSave(fileId, page);
  };

  //fetch books from backend
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await backendApi.getBooks();
      const books = Array.isArray(response)
        ? response
        : Array.isArray(response?.books)
          ? response.books
          : [];

      const savedPages = {};
      books.forEach((book) => {
        if (book.currentPage) {
          savedPages[book._id] = book.currentPage;
        }
      });
      setFiles(books);
      setCurrentPage((prev) => ({ ...prev, ...savedPages }));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  //Upload book to cloudinary and save book details to backend
  const uploadBook = useCallback(async (file, metadata = {}, onProgress = null) => {
    try {
      //Extract cover

      const fileURL = URL.createObjectURL(file);
      const fileType = file.name.endsWith(".epub") ? "epub" : "pdf";

      const coverImage = metadata.coverImage || null;
      //Upload book file to Cloudinary

      const bookUpload = await uploadToCloudinary(file, "books", "raw", onProgress);

      //Upload cover to Cloudinary(if exists)
      let coverUpload = null;
      if (coverImage) {
        coverUpload = await uploadCoverToCloudinary(coverImage, "covers");
      }

      //Save metadata to backend

      const bookData = {
        title: metadata.title || file.name,
        coverImageUrl: coverUpload?.url || null,
        fileUrl: bookUpload.url,
        pages: metadata.totalPages || 0,
      };

      const savedBook = await backendApi.saveBook(bookData);

      //Update local state
      setFiles((prev) => [...prev, savedBook]);

      return savedBook;
    } catch (error) {
      console.error("UploadBook error:", error);
      throw error;
    }
  }, []);

  //Delete book
  const deleteBook = useCallback(
    async (bookId) => {
      try {
        await backendApi.deleteBook(bookId);
        setFiles((prev) => prev.filter((book) => book._id !== bookId));
        setCurrentPage((prev) => {
          const updated = { ...prev };
          delete updated[bookId];
          return updated;
        });
        setHighlights((prev) => {
          const next = { ...prev };
          delete next[bookId];
          return next;
        });
      } catch (error) {
        throw error;
      }
    },
    [selectedFile2],
  );

  //Update reading progress
  const updateProgress = useCallback(async (bookId, currentPage) => {
    try {
      await backendApi.updateProgress(bookId, { currentPage });

      setFiles((prev) =>
        prev.map((book) =>
          book._id === bookId ? { ...book, currentPage } : book,
        ),
      );
    } catch (error) {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("appHighlights", JSON.stringify(highlights));
    } catch (error) {
      console.error("Failed to save highlights to localStorage:", error);
    }
  }, [highlights]);

  // Prune local highlights for books that no longer exist (e.g. deleted from Library)
  useEffect(() => {
    const validIds = new Set(
      (files || [])
        .map((f) => getBookKey(f?.book ?? f))
        .filter(Boolean)
        .map(String),
    );

    setHighlights((prev) => {
      const keys = Object.keys(prev || {});
      if (keys.length === 0) return prev;

      let changed = false;
      const next = { ...prev };
      keys.forEach((key) => {
        if (!validIds.has(String(key))) {
          delete next[key];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [files]);

  const selectFile = (file) => {
    setSelectedFile(file);
  };

  const addHighlight = useCallback((fileId, highlight) => {
    setHighlights((prev) => {
      const fileHighlights = prev[fileId] || [];
      // If this highlight already exists, merge updates (e.g. saved: false -> true)
      const existingIndex = fileHighlights.findIndex(
        (h) => h.text === highlight.text && h.page === highlight.page,
      );

      if (existingIndex !== -1) {
        const updated = [...fileHighlights];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...highlight,
          saved: Boolean(updated[existingIndex].saved || highlight.saved),
        };
        return {
          ...prev,
          [fileId]: updated,
        };
      }

      return {
        ...prev,
        [fileId]: [...fileHighlights, { ...highlight, id: Date.now() }],
      };
    });
  }, []);

  const getHighlights = useCallback(
    (fileId) => {
      return highlights[fileId] || [];
    },
    [highlights],
  );

  const removeHighlight = useCallback((fileId, highlightId) => {
    setHighlights((prev) => ({
      ...prev,
      [fileId]: (prev[fileId] || []).filter((h) => h.id !== highlightId),
    }));
  }, []);

  const getProgress = (currentPage, totalPages) => {
    if (!totalPages || !currentPage) return 0;
    return Math.round((currentPage / totalPages) * 100);
  };

  return (
    <FileContext.Provider
      value={{
        files,
        selectedFile2,
        selectFile,
        updateCurrentPage,
        getProgress,

        setSelectedFile,

        loading,

        currentPage,
        setCurrentPage,

        debouncedSave,

        uploadBook,
        fetchBooks,
        deleteBook,
        updateProgress,
        addHighlight,
        getHighlights,
        removeHighlight,
        highlights,
        readingGoal,
        setReadingGoal,
        activeReading,
        liveReadingMinutes,
        startLocalReadingTimer,
        stopLocalReadingTimer,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  return useContext(FileContext);
}
