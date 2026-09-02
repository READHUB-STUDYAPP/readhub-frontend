import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import { useFiles } from '../Context/FileContext';
import { useTheme } from '../Context/ThemeContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useSwipeable } from 'react-swipeable';
import axiosConfig from '../Util/axiosConfig';
import { apiEndpoints } from '../Util/apiEndpoints';
import CustomTextViewer from '../Components/CustomTextViewer';
import EpubReader from '../Components/EpubReader';
import { highlightTextInPDF } from '../Components/HighlightRenderer';
import { toast } from 'react-toastify';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ViewPdf = () => {
  const { fileId } = useParams();

  const {
    selectedFile2,
    updateCurrentPage,
    currentPage,
    loading,
    selectFile,
    files,
    addHighlight,
    getHighlights,
    highlights,
    fetchBooks,
    startLocalReadingTimer,
    stopLocalReadingTimer,
    readingGoal,
    liveReadingMinutes,
  } = useFiles();

  const activeFile = selectedFile2?.book ?? selectedFile2;
  const activeFileId = activeFile?._id ?? activeFile?.id ?? activeFile?.bookId ?? null;
  const activeFileTitle =
    activeFile?.title ?? activeFile?.name ?? activeFile?.filename ?? 'Untitled';

  const [numPages, setNumPages] = useState(null);

  const [viewMode, setViewMode] = useState('pdf'); // "pdf" or "text"

  const navigate = useNavigate();
  const location = useLocation();

  const [toggleSettings, setToggleSettings] = useState(true);

  /**
   * Zoom, as a multiple of the width that fits the window.
   *
   * It used to be an absolute pdf.js scale fixed at 0.7, which is why the
   * reader was hard to use on a desktop: 0.7 of a page's natural size is a
   * postage stamp in a 1440px window and far too wide on a phone. 1 now means
   * "fits the reader", whatever the window, and the buttons multiply it.
   */
  const [scale, setScale] = useState(1);

  /**
   * How wide the page may be drawn.
   *
   * Measured from the element the page sits in, and re-measured when the window
   * changes, so the fit holds when a browser is resized or a phone is turned.
   */
  const pageAreaRef = useRef(null);
  const [pageArea, setPageArea] = useState(0);
  const [scaleFont, setScaleFont] = useState(16);

  // Track if we've initiated a fetch
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch on mount if files is empty

  // Highlight and popup states
  const [selectedText, setSelectedText] = useState('');
  const [selectedOffsets, setSelectedOffsets] = useState(null);
  const [selectedTextRange, setSelectedTextRange] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [saving, setSaving] = useState(false);
  const popupRef = useRef(null);
  const textModeContainerRef = useRef(null);

  // Scroll Configuration

  const [scrollDirection, setScrollDirection] = useState(
    () => localStorage.getItem('pdfScrollDirection') || 'horizontal',
  );

  const getSelectionOffsetsWithin = (containerEl) => {
    try {
      if (!containerEl) return null;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      if (
        !containerEl.contains(range.startContainer) ||
        !containerEl.contains(range.endContainer)
      ) {
        return null;
      }

      const startRange = document.createRange();
      startRange.selectNodeContents(containerEl);
      startRange.setEnd(range.startContainer, range.startOffset);
      const start = startRange.toString().length;

      const endRange = document.createRange();
      endRange.selectNodeContents(containerEl);
      endRange.setEnd(range.endContainer, range.endOffset);
      const end = endRange.toString().length;

      if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
      if (end <= start) return null;

      return { startOffset: start, endOffset: end };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (files.length === 0) {
      fetchBooks().then(() => setHasFetched(true));
    } else {
      setHasFetched(true);
    }
  }, []);

  // Only redirect after fetch is confirmed done
  useEffect(() => {
    if (!hasFetched || loading) return; // wait for fetch to finish

    if (fileId) {
      const file = files.find((f) => f._id === fileId);
      if (file) {
        selectFile(file);
      } else {
        navigate('/library'); // now only fires if book genuinely doesn't exist
      }
    }
  }, [fileId, files, loading, hasFetched, selectFile, navigate]);

  const savedPage = activeFile?.lastPageRead || 1;
  const pageNumber = currentPage[fileId] || savedPage;

  // Reading time tracking (start when a book is open, end when leaving ViewPdf)
  const sessionIdRef = useRef(null);
  const sessionBookIdRef = useRef(null);
  const latestPageRef = useRef(pageNumber);

  // Goal celebration: detect when goal is met during this reading session and celebrate on exit.
  const [stats, setStats] = useState(null);
  const goalMetRef = useRef(false);
  const todayKeyRef = useRef(null);

  useEffect(() => {
    latestPageRef.current = pageNumber;
  }, [pageNumber]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosConfig.get(apiEndpoints.BOOK_STATS);
        setStats(res.data);
      } catch (e) {
        // Ignore; goal celebration just won't trigger without stats.
        setStats(null);
      }
    };

    fetchStats();
  }, []);

  const dailyGoal = stats?.dailyGoal ?? readingGoal ?? 30;
  const todayMinutes = (stats?.todayReadingMinutes ?? 0) + (liveReadingMinutes || 0);

  useEffect(() => {
    if (goalMetRef.current) return;
    if (!dailyGoal || dailyGoal <= 0) return;

    const minutes = Number(todayMinutes || 0);
    if (!Number.isFinite(minutes)) return;

    const todayKey = new Date().toDateString();
    todayKeyRef.current = todayKey;

    // Only mark as met if we crossed the threshold today.
    if (minutes >= dailyGoal) {
      goalMetRef.current = true;
    }
  }, [todayMinutes, dailyGoal]);

  useEffect(() => {
    if (!activeFileId) return;

    let isActive = true;

    const startSession = async () => {
      try {
        const payload = {
          bookId: activeFileId,
          startPage: latestPageRef.current,
        };
        const res = await axiosConfig.post(apiEndpoints.BOOK_START_READING, payload);
        const sessionId = res?.data?.session?._id || null;
        if (!isActive) return;
        sessionIdRef.current = sessionId;
        sessionBookIdRef.current = activeFileId;
      } catch (err) {
        // Fail silently; stats will just not include this session.
        console.warn('Failed to start reading session:', err?.message || err);
      }
    };

    startSession();
    startLocalReadingTimer(activeFileId);

    return () => {
      isActive = false;
      stopLocalReadingTimer();
      const sessionId = sessionIdRef.current;
      const sessionBookId = sessionBookIdRef.current;

      sessionIdRef.current = null;
      sessionBookIdRef.current = null;

      // Trigger a 2s celebration on the next screen if the user met today's goal during this session.
      // Show at most once per day.
      try {
        const todayKey = todayKeyRef.current || new Date().toDateString();
        const alreadyShown = localStorage.getItem('rh_goalCelebrationShown');
        if (goalMetRef.current && alreadyShown !== todayKey) {
          sessionStorage.setItem(
            'rh_goalCelebration',
            JSON.stringify({ at: Date.now(), day: todayKey }),
          );
          localStorage.setItem('rh_goalCelebrationShown', todayKey);
        }
      } catch {
        // ignore
      }

      if (!sessionId) return;
      if (sessionBookId && sessionBookId !== activeFileId) return;

      const endPayload = { sessionId, endPage: latestPageRef.current };
      axiosConfig
        .post(apiEndpoints.BOOK_END_READING, endPayload)
        .catch((e) => console.warn('Failed to end reading session:', e?.message || e));
    };
  }, [activeFileId]);

  // Apply highlights to PDF text layer after rendering
  useEffect(() => {
    if (viewMode === 'pdf' && activeFileId) {
      // Retry a few times to ensure the PDF text layer has rendered before applying styles.
      let attempts = 0;
      let timeoutId;

      const apply = () => {
        attempts += 1;
        const pageHighlights = getHighlights(activeFileId);
        highlightTextInPDF('.textLayer', pageHighlights, pageNumber);

        if (attempts < 2) {
          timeoutId = setTimeout(apply, 150);
        }
      };

      timeoutId = setTimeout(apply, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [viewMode, pageNumber, activeFileId, getHighlights, highlights]);

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      setSelectedText(selectedText);

      // Capture offsets at selection-time; clicking the popup buttons often clears the DOM selection.
      try {
        let offsets = null;
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const ancestorEl =
            range.commonAncestorContainer?.nodeType === Node.ELEMENT_NODE
              ? range.commonAncestorContainer
              : range.commonAncestorContainer?.parentElement;

          if (viewMode === 'pdf') {
            const pdfTextLayer =
              ancestorEl?.closest?.('.textLayer') ||
              document.querySelector('.react-pdf__Page__textLayer') ||
              document.querySelector('.textLayer') ||
              document.querySelector('.react-pdf__Page__textContent');
            offsets = getSelectionOffsetsWithin(pdfTextLayer);
            setSelectedTextRange(null);
          } else {
            offsets = getSelectionOffsetsWithin(textModeContainerRef.current);

            const startP = range.startContainer?.parentElement?.closest?.(
              'p[data-rh-paragraph-index]',
            );
            const endP = range.endContainer?.parentElement?.closest?.('p[data-rh-paragraph-index]');

            if (startP && endP) {
              const startParagraphIndex = Number(startP.getAttribute('data-rh-paragraph-index'));
              const endParagraphIndex = Number(endP.getAttribute('data-rh-paragraph-index'));

              const startRange = document.createRange();
              startRange.selectNodeContents(startP);
              startRange.setEnd(range.startContainer, range.startOffset);
              const startOffsetInParagraph = startRange.toString().length;

              const endRange = document.createRange();
              endRange.selectNodeContents(endP);
              endRange.setEnd(range.endContainer, range.endOffset);
              const endOffsetInParagraph = endRange.toString().length;

              if (
                Number.isFinite(startParagraphIndex) &&
                Number.isFinite(endParagraphIndex) &&
                Number.isFinite(startOffsetInParagraph) &&
                Number.isFinite(endOffsetInParagraph)
              ) {
                setSelectedTextRange({
                  startParagraphIndex: Math.min(startParagraphIndex, endParagraphIndex),
                  endParagraphIndex: Math.max(startParagraphIndex, endParagraphIndex),
                  startOffsetInParagraph,
                  endOffsetInParagraph,
                });
              } else {
                setSelectedTextRange(null);
              }
            } else {
              setSelectedTextRange(null);
            }
          }
        }
        setSelectedOffsets(offsets);
      } catch {
        setSelectedOffsets(null);
        setSelectedTextRange(null);
      }
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        /*
          Viewport coordinates, with no scroll offset added.

          The popup is positioned `fixed`, which is already relative to the
          viewport, so the `window.scrollY` this used to add pushed it that many
          pixels down the screen -- far enough into a long book that the buttons
          were off the bottom entirely and a highlight could not be saved.

          `getBoundingClientRect` is viewport-relative, which is exactly what
          `fixed` wants.
        */
        const POPUP_HEIGHT = 56;
        let top = rect.top - POPUP_HEIGHT;
        let left = rect.left + rect.width / 2;

        // Below the selection when there is no room above it.
        if (top < 10) top = rect.bottom + 10;

        // Kept clear of both edges, so a passage selected at the margin does
        // not put half the popup off-screen.
        const MARGIN = 92;
        left = Math.min(Math.max(left, MARGIN), window.innerWidth - MARGIN);

        setPopupPosition({
          x: left,
          y: top,
        });
        console.log('Text selected:', selectedText, 'Position:', {
          x: left,
          y: top,
        });
        setShowPopup(true);
      } catch (err) {
        console.warn('Could not calculate popup position:', err);
        setShowPopup(false);
      }
    } else {
      setShowPopup(false);
      setSelectedOffsets(null);
      setSelectedTextRange(null);
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopup]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    if (!currentPage[fileId]) {
      updateCurrentPage(fileId, savedPage);
    }
  };

  useEffect(() => {
    const element = pageAreaRef.current;
    if (!element) return;

    const measure = () => setPageArea(element.clientWidth);
    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const goToPrevPage = () => {
    const newPage = Math.max(1, (currentPage[fileId] || 1) - 1);
    updateCurrentPage(fileId, newPage);
  };

  const goToNextPage = () => {
    const newPage = Math.min(numPages, (currentPage[fileId] || 1) + 1);
    updateCurrentPage(fileId, newPage);
  };

  const jumpToPage = (page) => {
    updateCurrentPage(fileId, page);
    setToggleSettings(!toggleSettings);
  };

  /**
   * Keyboard navigation.
   *
   * The web app was navigable by swipe alone, which is nothing on a desktop
   * where there is no touchscreen and both hands are already on the keyboard.
   * Arrows and page keys turn pages; Home and End jump to the ends.
   *
   * Refused while typing, and while text is selected -- a reader who has just
   * highlighted a passage is reaching for the popup, not the next page, and
   * arrow keys move a selection.
   */
  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          goToNextPage();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          goToPrevPage();
          break;
        case 'Home':
          event.preventDefault();
          updateCurrentPage(fileId, 1);
          break;
        case 'End':
          if (numPages) {
            event.preventDefault();
            updateCurrentPage(fileId, numPages);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, numPages, currentPage]);

  // Swipe-------------------------------------//
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (
        scrollDirection === 'horizontal' &&
        Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)
      ) {
        goToNextPage();
      }
    },
    onSwipedRight: (eventData) => {
      if (
        scrollDirection === 'horizontal' &&
        Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)
      ) {
        goToPrevPage();
      }
    },
    onSwipedUp: (eventData) => {
      if (
        scrollDirection === 'vertical' &&
        Math.abs(eventData.deltaY) > Math.abs(eventData.deltaX)
      ) {
        goToNextPage();
      }
    },
    onSwipedDown: (eventData) => {
      if (
        scrollDirection === 'vertical' &&
        Math.abs(eventData.deltaY) > Math.abs(eventData.deltaX)
      ) {
        goToPrevPage();
      }
    },

    preventScrollOnSwipe: true,
    /*
      Touch only.

      With `trackMouse` on, dragging across a paragraph to select it was read as
      a swipe, so highlighting with a mouse turned the page instead -- which is
      why highlighting appeared not to work on a desktop at all. A mouse has the
      arrows, the keyboard and the scroll wheel for navigation and needs drag
      for selection.
    */
    trackMouse: false,
    delta: 140,
  });

  /*------Dark toggle, Zoom and font Increase----*/
  /*
    The reader opens in the theme the app is in.

    It used to always open light, so a reader who had chosen dark got a white
    page in the face every time they opened a book. The in-reader switch is
    still an override -- paper colour is a reading decision, and someone may
    want a light page inside a dark app -- it just no longer starts by
    contradicting the setting.
  */
  const { isDark } = useTheme();
  const [darkToggle, setDarkToggle] = useState(isDark);

  const zoomIn = () => {
    setScale((prev) => Math.min(Math.round((prev + 0.2) * 10) / 10, 3));
  };

  const zoomOut = () => {
    // 0.5 rather than 0.7: with 1 meaning "fits the window", a reader on a
    // wide screen may legitimately want the page smaller than the fit.
    setScale((prev) => Math.max(Math.round((prev - 0.2) * 10) / 10, 0.5));
  };

  const increaseFont = () => {
    setScaleFont((prev) => Math.min(prev + 2, 30));
  };

  const reduceFont = () => {
    setScaleFont((prev) => Math.max(prev - 2, 14));
  };

  const handleHighlight = () => {
    // Validate text is not empty or whitespace-only
    if (!selectedText || selectedText.trim().length === 0 || !activeFileId) {
      toast.info('Select some text first.');
      return;
    }

    // Save ONLY to local highlights (FileContext)
    // Do NOT save to backend API
    // Fallback: attempt to recapture offsets (may be null if selection was cleared)
    let offsets = null;
    try {
      if (viewMode === 'pdf') {
        const pdfContainer =
          document.querySelector('.react-pdf__Page__textLayer') ||
          document.querySelector('.textLayer') ||
          document.querySelector('.react-pdf__Page__textContent');
        offsets = getSelectionOffsetsWithin(pdfContainer);
      } else {
        offsets = getSelectionOffsetsWithin(textModeContainerRef.current);
      }
    } catch {
      offsets = null;
    }

    const highlightData = {
      text: selectedText.trim(),
      page: pageNumber,
      timestamp: new Date().toISOString(),
      saved: false,
      color: 'yellow',
      ...(selectedOffsets || offsets || {}),
      ...(viewMode === 'text' && selectedTextRange ? { textRange: selectedTextRange } : {}),
    };

    console.log('=== HIGHLIGHTING ===');
    console.log('File ID:', activeFileId);
    console.log('File Title:', activeFileTitle);
    console.log('Page:', pageNumber);
    console.log('Selected Text:', selectedText.trim());
    console.log('Highlight Data:', highlightData);

    addHighlight(activeFileId, highlightData);

    console.log('Text highlighted locally:', selectedText);
    setShowPopup(false);
    setSelectedText('');
    setSelectedOffsets(null);
    setSelectedTextRange(null);
    // Clear browser selection
    window.getSelection().removeAllRanges();
  };

  const handleSaveNote = async () => {
    // Validate text is not empty or whitespace-only
    if (!selectedText || selectedText.trim().length === 0 || !activeFileId) {
      toast.info('Select some text first.');
      return;
    }

    setSaving(true);
    let synced = false;
    let reason = null;
    try {
      // Fallback: attempt to recapture offsets (may be null if selection was cleared)
      let offsets = null;
      try {
        if (viewMode === 'pdf') {
          const pdfContainer =
            document.querySelector('.react-pdf__Page__textLayer') ||
            document.querySelector('.textLayer') ||
            document.querySelector('.react-pdf__Page__textContent');
          offsets = getSelectionOffsetsWithin(pdfContainer);
        } else {
          offsets = getSelectionOffsetsWithin(textModeContainerRef.current);
        }
      } catch {
        offsets = null;
      }

      // First, add to local highlights with saved flag
      const localHighlight = {
        text: selectedText.trim(),
        page: pageNumber,
        timestamp: new Date().toISOString(),
        saved: true,
        color: 'yellow',
        ...(selectedOffsets || offsets || {}),
        ...(viewMode === 'text' && selectedTextRange ? { textRange: selectedTextRange } : {}),
      };

      addHighlight(activeFileId, localHighlight);

      // Also save to backend API using the current book id
      if (activeFileId) {
        /*
          The highlight travels with the note.

          Without it the server stored the words and forgot they were a
          highlight, so a passage marked on this browser came back as a plain
          note everywhere else -- unpainted in the reader, and impossible to
          find in the page again. The offsets are sent when the selection gave
          us a pair, and `text` is the anchor when it did not.
        */
        const marks = selectedOffsets || offsets;
        const hasOffsets =
          Number.isInteger(marks?.startOffset) && Number.isInteger(marks?.endOffset);

        const payload = {
          bookId: activeFileId,
          content: selectedText.trim(),
          pageNumber: pageNumber,
          highlight: {
            text: selectedText.trim(),
            color: 'yellow',
            ...(hasOffsets
              ? { startOffset: marks.startOffset, endOffset: marks.endOffset }
              : {}),
          },
        };

        try {
          await axiosConfig.post(apiEndpoints.NOTES, payload);
          synced = true;
        } catch (backendError) {
          // Kept, not discarded: the highlight is painted in this browser
          // either way. But it is not on the reader's other devices, and
          // saying "saved" would be a lie they only discover on their phone.
          reason = backendError.response?.data?.message || backendError.message;
        }
      }

      setShowPopup(false);
      setSelectedText('');
      setSelectedOffsets(null);
      setSelectedTextRange(null);

      if (synced) {
        toast.success('Saved to your notes.');
      } else {
        toast.warning(`Highlighted here, but not saved to your notes. ${reason ?? ''}`.trim());
      }

      // Clear browser selection
      window.getSelection().removeAllRanges();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error(`Could not save the note. ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Leaves the book for wherever the reader came from.
   *
   * This was a link to the library, so opening a group's book and closing it
   * again dropped the reader in their own library with the group -- and the
   * conversation they were reading it for -- three taps away.
   *
   * `key` is React Router's marker for the first entry in this session's
   * history: on that entry there is nothing behind us, so going back would
   * leave the app entirely. The library is the right fallback there, since it
   * is where a book opened from a cold link belongs.
   */
  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/library');
  };

  const handleScrollDirection = (direction) => {
    setScrollDirection(direction);
    localStorage.setItem('pdfScrollDirection', direction);
  };

  if (!selectedFile2) {
    return (
      <div className=" w-full h-full">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="flex items-center gap-1 mb-4"
        >
          <img src="/chevron-left.svg" alt="" />
        </button>
        No file selected
      </div>
    );
  }
  return (
    <>
      <div
        className={`h-dvh w-full overflow-y-auto ${darkToggle ? 'bg-[#0B111E] text-[#ECF0F8]' : 'bg-white text-[black]'}`}
      >
        <div
          className={`flex justify-between p-4 w-full fixed z-10 items-center ${darkToggle ? 'bg-[#0B111E] stroke-primary' : 'bg-white stroke-[#1A1A1A]'}`}
        >
          <div className="flex items-center">
            <button type="button" onClick={goBack} aria-label="Close the book">
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M15 18L9 12L15 6"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex gap-6">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M17 3C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V20C18.9999 20.1751 18.9539 20.3472 18.8665 20.4989C18.7791 20.6506 18.6533 20.7767 18.5019 20.8646C18.3504 20.9525 18.1785 20.9991 18.0034 20.9997C17.8283 21.0003 17.6561 20.9549 17.504 20.868L12.992 18.29C12.6899 18.1174 12.3479 18.0266 12 18.0266C11.6521 18.0266 11.3101 18.1174 11.008 18.29L6.496 20.868C6.34394 20.9549 6.17174 21.0003 5.99662 20.9997C5.8215 20.9991 5.64961 20.9525 5.49814 20.8646C5.34667 20.7767 5.22094 20.6506 5.13352 20.4989C5.0461 20.3472 5.00006 20.1751 5 20V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17Z"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>

            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M2.06202 12.3474C1.97868 12.1229 1.97868 11.8759 2.06202 11.6514C2.87372 9.68324 4.25153 8.00042 6.02079 6.81628C7.79004 5.63214 9.87106 5 12 5C14.129 5 16.21 5.63214 17.9792 6.81628C19.7485 8.00042 21.1263 9.68324 21.938 11.6514C22.0214 11.8759 22.0214 12.1229 21.938 12.3474C21.1263 14.3155 19.7485 15.9983 17.9792 17.1825C16.21 18.3666 14.129 18.9988 12 18.9988C9.87106 18.9988 7.79004 18.3666 6.02079 17.1825C4.25153 15.9983 2.87372 14.3155 2.06202 12.3474Z"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 14.9994C13.6569 14.9994 15 13.6562 15 11.9994C15 10.3425 13.6569 8.99938 12 8.99938C10.3432 8.99938 9.00002 10.3425 9.00002 11.9994C9.00002 13.6562 10.3432 14.9994 12 14.9994Z"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            {!darkToggle ? (
              <div
                onClick={() => {
                  setDarkToggle(!darkToggle);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M20.985 12.4864C20.8912 14.2225 20.2966 15.8944 19.273 17.2998C18.2494 18.7052 16.8406 19.7841 15.217 20.4059C13.5933 21.0278 11.8243 21.166 10.1237 20.8039C8.42318 20.4418 6.86392 19.5949 5.63442 18.3656C4.40493 17.1362 3.55785 15.577 3.19558 13.8765C2.83331 12.176 2.97136 10.4069 3.59304 8.78322C4.21472 7.15948 5.29342 5.75059 6.69874 4.72683C8.10406 3.70308 9.77583 3.1083 11.512 3.0144C11.917 2.9924 12.129 3.4744 11.914 3.8174C11.1949 4.96795 10.8869 6.32827 11.0405 7.67635C11.194 9.02443 11.7999 10.2807 12.7593 11.2401C13.7187 12.1995 14.9749 12.8054 16.323 12.9589C17.6711 13.1124 19.0314 12.8045 20.182 12.0854C20.526 11.8704 21.007 12.0814 20.985 12.4864Z"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            ) : (
              <div
                onClick={() => {
                  setDarkToggle(!darkToggle);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                    stroke="#2D7FF9"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            )}
            <div
              onClick={() => {
                setToggleSettings(!toggleSettings);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9.67082 4.13615C9.72591 3.55649 9.99515 3.0182 10.4259 2.62643C10.8567 2.23467 11.418 2.01758 12.0003 2.01758C12.5826 2.01758 13.1439 2.23467 13.5747 2.62643C14.0055 3.0182 14.2747 3.55649 14.3298 4.13615C14.3629 4.51061 14.4858 4.87157 14.688 5.18849C14.8901 5.50541 15.1657 5.76896 15.4913 5.95683C15.8169 6.1447 16.183 6.25135 16.5585 6.26777C16.9341 6.28419 17.3081 6.20989 17.6488 6.05115C18.1779 5.81093 18.7775 5.77617 19.3308 5.95364C19.8841 6.1311 20.3516 6.5081 20.6423 7.01126C20.933 7.51441 21.0261 8.10772 20.9035 8.67572C20.7808 9.24372 20.4512 9.74577 19.9788 10.0842C19.6712 10.3 19.4201 10.5868 19.2467 10.9202C19.0734 11.2536 18.9829 11.6239 18.9829 11.9997C18.9829 12.3754 19.0734 12.7457 19.2467 13.0791C19.4201 13.4125 19.6712 13.6993 19.9788 13.9152C20.4512 14.2535 20.7808 14.7556 20.9035 15.3236C21.0261 15.8916 20.933 16.4849 20.6423 16.988C20.3516 17.4912 19.8841 17.8682 19.3308 18.0457C18.7775 18.2231 18.1779 18.1884 17.6488 17.9482C17.3081 17.7894 16.9341 17.7151 16.5585 17.7315C16.183 17.7479 15.8169 17.8546 15.4913 18.0425C15.1657 18.2303 14.8901 18.4939 14.688 18.8108C14.4858 19.1277 14.3629 19.4887 14.3298 19.8632C14.2747 20.4428 14.0055 20.9811 13.5747 21.3729C13.1439 21.7646 12.5826 21.9817 12.0003 21.9817C11.418 21.9817 10.8567 21.7646 10.4259 21.3729C9.99515 20.9811 9.72591 20.4428 9.67082 19.8632C9.63776 19.4886 9.51491 19.1275 9.31268 18.8104C9.11045 18.4934 8.83479 18.2298 8.50905 18.0419C8.18331 17.854 7.81708 17.7474 7.4414 17.7311C7.06571 17.7147 6.69162 17.7892 6.35082 17.9482C5.82171 18.1884 5.22214 18.2231 4.66882 18.0457C4.11549 17.8682 3.64799 17.4912 3.3573 16.988C3.06661 16.4849 2.97353 15.8916 3.09618 15.3236C3.21882 14.7556 3.54842 14.2535 4.02082 13.9152C4.32844 13.6993 4.57955 13.4125 4.7529 13.0791C4.92626 12.7457 5.01677 12.3754 5.01677 11.9997C5.01677 11.6239 4.92626 11.2536 4.7529 10.9202C4.57955 10.5868 4.32844 10.3 4.02082 10.0842C3.54908 9.7456 3.22007 9.24375 3.09772 8.67613C2.97537 8.10852 3.06842 7.51569 3.3588 7.01286C3.64918 6.51004 4.11613 6.13313 4.66891 5.95539C5.22168 5.77766 5.8208 5.81179 6.34982 6.05115C6.69057 6.20989 7.06456 6.28419 7.44012 6.26777C7.81567 6.25135 8.18175 6.1447 8.50735 5.95683C8.83296 5.76896 9.10851 5.50541 9.31068 5.18849C9.51286 4.87157 9.6357 4.51061 9.66882 4.13615M14.9998 12.0002C14.9998 13.657 13.6567 15.0002 11.9998 15.0002C10.343 15.0002 8.99982 13.657 8.99982 12.0002C8.99982 10.3433 10.343 9.00015 11.9998 9.00015C13.6567 9.00015 14.9998 10.3433 14.9998 12.0002Z"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
        {(selectedFile2 && fileId) || !hasFetched ? (
          <div
            className={`h-dvh w-full overflow-y-auto ${darkToggle ? 'bg-[#0B111E] text-[#ECF0F8]' : 'bg-white text-[black]'}`}
          >
            <div className="top-15 relative">
              <div className="px-4 ">
                <h2 className="text-tittle_Medium font-medium text-[14px] leading-[20px] truncate">
                  {activeFileTitle}
                </h2>
                <h2 className="font-bold text-[20px] leading-[185%] pb-5">
                  Page {pageNumber} of {numPages}
                </h2>
              </div>
              <div>
                {/* Toggle between PDF and Text view */}

                {viewMode === 'pdf' ? (
                  <div
                    ref={pageAreaRef}
                    className="relative flex w-full justify-center py-4"
                    onMouseUpCapture={handleTextSelection}
                    onTouchEndCapture={handleTextSelection}
                    {...swipeHandlers}
                  >
                    {/*
                      Page arrows, for a desktop.
                      Shown only where there is a real pointer -- a phone turns
                      pages by swiping, and two buttons floating over a small
                      screen would cover the words being read. `hover: hover`
                      is the query that asks that question, rather than
                      guessing from width: a touchscreen laptop is wide and
                      still wants the arrows, a large phone is not.

                      Disabled at the ends rather than hidden, so the controls
                      do not move about as a reader works through a book.
                    */}
                    <button
                      type="button"
                      onClick={goToPrevPage}
                      disabled={pageNumber <= 1}
                      aria-label="Previous page"
                      className={`fixed left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-raised transition-opacity [@media(hover:hover)]:flex ${
                        darkToggle
                          ? 'border-white/15 bg-[#131C2E] text-white'
                          : 'border-black/10 bg-white text-[#0F172A]'
                      } ${pageNumber <= 1 ? 'cursor-not-allowed opacity-30' : 'hover:opacity-90'}`}
                    >
                      <FiChevronLeft size={22} />
                    </button>

                    <button
                      type="button"
                      onClick={goToNextPage}
                      disabled={!numPages || pageNumber >= numPages}
                      aria-label="Next page"
                      className={`fixed right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-raised transition-opacity [@media(hover:hover)]:flex ${
                        darkToggle
                          ? 'border-white/15 bg-[#131C2E] text-white'
                          : 'border-black/10 bg-white text-[#0F172A]'
                      } ${
                        !numPages || pageNumber >= numPages
                          ? 'cursor-not-allowed opacity-30'
                          : 'hover:opacity-90'
                      }`}
                    >
                      <FiChevronRight size={22} />
                    </button>
                    <Document
                      file={activeFile?.fileUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div>
                          <div className="relative w-full px-4">
                            <div className="mt-5">
                              <div className="w-7/8 h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                            </div>

                            <div className="mt-5">
                              <div className="w-7/8 h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                            </div>

                            <div className="mt-5">
                              <div className="w-7/8 h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                            </div>

                            <div className="mt-5">
                              <div className="w-7/8 h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                              <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      }
                      error={<div>Failed to load PDF.</div>}
                      className={`flex overflow-auto`}
                    >
                      {/*
                        `width` rather than `scale`, so the page is drawn to fit
                        the reader and zoom multiplies that. The fallback of 640
                        covers the first render, before the element has been
                        measured.

                        The device pixel ratio is capped at 2: the cost of a
                        render is the area of the canvas, and a phone reporting
                        3 asks for 2.25 times the pixels for sharpness nobody
                        can see at reading distance.
                      */}
                      <Page
                        pageNumber={pageNumber}
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                        width={Math.max(280, Math.round(((pageArea || 640) - 24) * scale))}
                        devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)}
                      />
                    </Document>
                  </div>
                ) : (
                  <div ref={textModeContainerRef}>
                    <CustomTextViewer
                      fileData={activeFile?.fileUrl}
                      file={activeFile}
                      theme={darkToggle}
                      scale={scaleFont}
                      onTextSelect={handleTextSelection}
                    />
                  </div>
                )}
              </div>

              {/* Highlight Popup Menu */}
              {showPopup && (
                <div
                  ref={popupRef}
                  className="fixed z-50"
                  style={{
                    left: `${popupPosition.x}px`,
                    top: `${popupPosition.y}px`,
                    transform: 'translate(-50%, 0)',
                    maxWidth: '340px',
                    minWidth: 'fit-content',
                  }}
                >
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-[14px] shadow-xl border border-[#DDE8FF] bg-white/95 backdrop-blur">
                    <button
                      onClick={handleHighlight}
                      className="w-full text-center rounded-[12px] bg-primary text-white px-3 py-2 text-xs font-semibold hover:bg-[#0653C6] transition-colors"
                      title="Highlight selected text permanently"
                    >
                      Highlight
                    </button>
                    <button
                      onClick={handleSaveNote}
                      disabled={saving}
                      className="w-full text-center rounded-[12px] bg-primary text-white px-3 py-2 text-xs font-semibold hover:bg-[#0653C6] transition-colors disabled:opacity-60"
                      title="Save note to your library"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center ">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={viewMode === 'pdf' ? 'text-primary' : ''}
                >
                  PDF View
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={viewMode === 'text' ? 'text-primary' : ''}
                >
                  Text View
                </button>
              </div>
            </div>

            <div
              /*
                A sheet in portrait, a side panel in landscape.

                It was a 65vh sheet at the bottom whatever the screen. Turn a
                phone sideways to read a page at a sensible width and 65% of the
                height is nearly all of it -- the settings covered the book. In
                landscape it comes in from the right instead, over a strip of
                the page rather than the page itself.

                The backdrop closes it, which it did not before: the only way
                out was the small cross in the corner, and on a covered screen
                the natural move is to tap the part you can still see.
              */
              onClick={() => setToggleSettings(true)}
              className={`fixed inset-0 z-11 flex items-end bg-black/20 transition-opacity duration-300 landscape:items-stretch landscape:justify-end ${
                toggleSettings ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
            >
              <div
                // Stops a tap inside the panel from closing it on the way out.
                onClick={(event) => event.stopPropagation()}
                className={`relative flex w-dvw max-h-[65vh] flex-col gap-6 overflow-y-auto rounded-t-[32px] p-[24px] transition-transform duration-300 landscape:h-dvh landscape:max-h-none landscape:w-[380px] landscape:max-w-[85vw] landscape:rounded-t-none landscape:rounded-l-[32px] landscape:translate-y-0 ${
                  toggleSettings
                    ? 'translate-y-full landscape:translate-x-full'
                    : 'translate-y-0 landscape:translate-x-0'
                } ${darkToggle ? 'bg-[#011532]' : 'bg-white'}`}
              >
                <div
                  className={`flex  justify-between ${darkToggle ? 'text-[#F5F9FF] stroke-[#F5F9FF]' : 'text-[#333333] stroke-[#333333]'}`}
                >
                  <p className=" font-medium text-[18px]">Reading Settings</p>
                  <button
                    className="w-5 h-5"
                    onClick={() => {
                      setToggleSettings(!toggleSettings);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="">
                  <div>
                    {viewMode === 'pdf' && (
                      <div>
                        <div
                          className={`flex justify-between text-[#808080] font-medium text-[16px] mb-4 ${darkToggle ? 'text-[#F5F9FF] ' : 'text-[#808080]]'}`}
                        >
                          <span className="flex">
                            <p>T</p>
                            <p className="pl-2">Zoom Size</p>
                          </span>

                          <p>{`${Math.round(scale * 100)}%`}</p>
                        </div>

                        <div
                          className={`flex justify-between items-center ${darkToggle ? 'text-[#0653C6]' : 'text-primary'}`}
                        >
                          <button
                            className={`w-[50px] h-[40px] rounded-[12px] flex justify-center items-center ${darkToggle ? 'bg-[#9CC3FC]' : 'bg-light_primary'}`}
                            onClick={zoomOut}
                            disabled={scale === 0.6}
                          >
                            A-
                          </button>
                          <span className="flex h-[7px] bg-[#e6e6e6] rounded-[12px] relative w-[170px]">
                            <span
                              className={`h-[7px] rounded-full transition-all duration-300 ease-out ${darkToggle ? 'bg-[#0653C6]' : 'bg-primary'}`}
                              style={{ width: `${Math.round((scale / 3) * 100)}%` }}
                            ></span>
                          </span>
                          <button
                            className={`w-[50px] h-[40px] rounded-[12px] flex justify-center items-center ${darkToggle ? 'bg-[#9CC3FC]' : 'bg-light_primary'}`}
                            onClick={zoomIn}
                            disabled={scale === 3.0}
                          >
                            A+
                          </button>
                        </div>
                      </div>
                    )}

                    {viewMode === 'text' && (
                      <div>
                        <div
                          className={`flex justify-between  font-medium text-[16px] mb-4 ${darkToggle ? 'text-[#F5F9FF] ' : 'text-[#808080]]'}`}
                        >
                          <span className="flex">
                            <p>T</p>
                            <p className="pl-2">Font Size</p>
                          </span>

                          <p>{scaleFont}px</p>
                        </div>

                        <div
                          className={`flex justify-between items-center ${darkToggle ? 'text-[#0653C6]' : 'text-primary'}`}
                        >
                          <button
                            className={`w-[50px] h-[40px] rounded-[12px] flex justify-center items-center ${darkToggle ? 'bg-[#9CC3FC]' : 'bg-light_primary'}`}
                            onClick={reduceFont}
                            disabled={scaleFont === 14}
                          >
                            A-
                          </button>
                          <span className="flex h-[7px] bg-[#e6e6e6] rounded-[12px] relative w-[170px]">
                            <span
                              className={`h-[7px] rounded-full transition-all duration-300 ease-out ${darkToggle ? 'bg-[#0653C6]' : 'bg-primary'}`}
                              style={{
                                width: `${Math.round((scaleFont / 30) * 100)}%`,
                              }}
                            ></span>
                          </span>
                          <button
                            className={`w-[50px] h-[40px] rounded-[12px] flex justify-center items-center ${darkToggle ? 'bg-[#9CC3FC]' : 'bg-light_primary'}`}
                            onClick={increaseFont}
                            disabled={scaleFont === 30}
                          >
                            A+
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[#808080]">
                    <p>Reading mode</p>
                    <div className="flex justify-center gap-8 pt-2">
                      <span className="flex flex-col items-center">
                        <button
                          className={`w-[71px] h-[56px] rounded-[12.15px] flex items-center justify-center ${scrollDirection === 'horizontal' ? 'bg-primary fill-white  ' : 'bg-[#E6F0FE] fill-[#4B6481]'}`}
                          onClick={() => {
                            handleScrollDirection('horizontal');
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="23"
                            height="25"
                            viewBox="0 0 23 25"
                          >
                            <path
                              d="M18.6617 14.1095L14.4631 12.2643C14.3194 12.198 14.1537 12.1538 13.9769 12.1538H13.2587V7.18182C13.2587 6.44923 12.9677 5.74664 12.4497 5.22862C11.9317 4.7106 11.2291 4.41958 10.4965 4.41958C9.76391 4.41958 9.06133 4.7106 8.54331 5.22862C8.02529 5.74664 7.73427 6.44923 7.73427 7.18182V16.1867L5.66811 15.7448C5.45818 15.7116 4.54112 15.579 3.75664 16.3635L2.20979 17.9214L7.86685 23.6558C8.27566 24.0757 8.83916 24.3077 9.42476 24.3077H16.6618C17.7446 24.3077 18.6617 23.5343 18.8385 22.4625L19.855 16.4519C19.9331 15.9851 19.8593 15.5056 19.6445 15.084C19.4297 14.6623 19.0852 14.3207 18.6617 14.1095ZM16.6618 22.0979H9.42476L5.33664 17.9214L9.94406 18.9048V7.18182C9.94406 6.87245 10.1871 6.62937 10.4965 6.62937C10.8059 6.62937 11.049 6.87245 11.049 7.18182V14.0101H12.9936L17.6783 16.0873L16.6618 22.0979ZM2.30923 4.97203H5.52448V6.62937H0V1.1049H1.65734V3.33678C4.2207 1.24853 7.49119 0 11.049 0C17.1148 0 21.2913 3.44727 22.0979 6.62937H20.3632C19.5235 4.44168 16.2862 1.65734 11.049 1.65734C7.70112 1.65734 4.65161 2.91692 2.30923 4.97203Z"
                              fill=""
                            />
                          </svg>
                        </button>
                        <p>Swipe</p>
                      </span>
                      <span className="flex flex-col items-center">
                        <button
                          className={`w-[71px] h-[56px] rounded-[12.15px] flex items-center justify-center ${scrollDirection === 'vertical' ? 'bg-primary stroke-white fill-none' : 'bg-[#E6F0FE] stroke-[#4B6481] fill-none'}`}
                          onClick={() => {
                            handleScrollDirection('vertical');
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="27"
                            height="27"
                            viewBox="0 0 27 27"
                          >
                            <path
                              d="M11.6011 8.83836H12.706C13.2921 8.83836 13.8542 9.07117 14.2686 9.48559C14.683 9.9 14.9158 10.4621 14.9158 11.0481M14.9158 11.0481V12.153M14.9158 11.0481C14.9158 10.7551 15.0322 10.4741 15.2394 10.2669C15.4466 10.0597 15.7277 9.94325 16.0207 9.94325C16.6068 9.94325 17.1689 10.1761 17.5833 10.5905C17.9977 11.0049 18.2305 11.567 18.2305 12.153M18.2305 12.153V13.2579M18.2305 12.153C18.2305 11.5741 18.7498 11.1343 19.321 11.2293L19.6989 11.2934C20.2147 11.3795 20.6833 11.6456 21.0213 12.0445C21.3594 12.4435 21.545 12.9494 21.5452 13.4723V15.0998C21.5452 17.5007 21.5452 18.7018 21.1795 19.6575C20.9673 20.2121 20.4071 20.9193 19.9597 21.4297C19.5658 21.867 19.344 22.4324 19.3354 23.0208V24.3069M11.6011 11.0481V3.86633C11.6011 3.42677 11.4265 3.00522 11.1157 2.69441C10.8049 2.3836 10.3833 2.20898 9.94379 2.20898C9.50423 2.20898 9.08268 2.3836 8.77187 2.69441C8.46106 3.00522 8.28645 3.42677 8.28645 3.86633V14.8733L6.49652 13.0778C6.31143 12.8919 6.08909 12.7473 5.84413 12.6534C5.59916 12.5596 5.33711 12.5186 5.07518 12.5332C4.81325 12.5478 4.55738 12.6177 4.32437 12.7382C4.09137 12.8587 3.8865 13.0272 3.72323 13.2325C3.46495 13.5564 3.32129 13.9568 3.31469 14.371C3.30809 14.7852 3.43894 15.1899 3.68677 15.5219L7.66439 20.6022C8.42566 21.5745 8.83889 23.0727 8.83889 24.3069M20.4403 2.20898V8.83836M20.4403 2.20898C19.6669 2.20898 18.2206 4.41215 17.6781 4.97122M20.4403 2.20898C21.2137 2.20898 22.66 4.41215 23.2025 4.97122"
                              stroke-width="1.65734"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </button>
                        <p>Scroll</p>
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`text-[16px] overflow-scroll ${darkToggle ? 'text-[#F5F9FF]' : 'text-[#808080]'}`}
                >
                  <p className="mb-4">Pages</p>
                  <div className="flex flex-col gap-[10px] h-fit overflow-scroll">
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                      <span
                        key={page}
                        onClick={() => {
                          jumpToPage(page);
                        }}
                        className={`w-full rounded-[10px] p-[10px] h-[44px] flex ${page === pageNumber && !darkToggle ? 'bg-light_primary text-primary' : ''} ${page === pageNumber && darkToggle ? 'text-[#0653C6] bg-[#9CC3FC]' : ''}`}
                      >
                        <p>Page {page}</p>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="top-15 relative px-4">
              <div>
                <div className="w-[170px] h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-[300px] h-[30px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-[300px] h-[30px] bg-[#E6E6E6] rounded-[3px] animate-pulse"></div>
              </div>
              <div className="mt-5">
                <div className="w-7/8 h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
              </div>

              <div className="mt-5">
                <div className="w-7/8 h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
              </div>

              <div className="mt-5">
                <div className="w-7/8 h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
              </div>

              <div className="mt-5">
                <div className="w-7/8 h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
                <div className="w-full h-[18px] bg-[#E6E6E6] rounded-[3px] mb-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewPdf;
