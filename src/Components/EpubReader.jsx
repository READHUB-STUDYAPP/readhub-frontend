import Epub from "epubjs";
import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { useSwipeable } from "react-swipeable";

const EpubReader = forwardRef(
  ({ file, fontSize, theme, onLocationChange }, ref) => {
    const viewerRef = useRef(null);
    const bookRef = useRef(null);
    const renditionRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    //Expose methods to parent
    useImperativeHandle(ref, () => ({
      next() {
        renditionRef.current?.next();
      },
      prev() {
        renditionRef.current?.prev();
      },
      goToLocation(index) {
        if (!bookRef.current?.locations) return;
        const cfi = bookRef.current.locations.cfiFromLocation(index);
        renditionRef.current?.display(cfi);
      },
    }));

    //Font size
    useEffect(() => {
      if (!renditionRef.current) return;
      renditionRef.current.themes.fontSize(`${fontSize}px`);
      renditionRef.current.resize();
    }, [fontSize]);

    //Theme changes
    useEffect(() => {
      if (!renditionRef.current) return;

      if (theme === "dark") {
        renditionRef.current.themes.override("background", "#0B111E");
        renditionRef.current.themes.override("color", "#ECF0F8");
      } else {
        renditionRef.current.themes.override("background", "#ffffff");
        renditionRef.current.themes.override("color", "#000000");
      }
    }, [theme]);

    useEffect(() => {
      if (!file?.fileData || !viewerRef.current) return;

      let mounted = true;

      const loadBook = async () => {
        try {
          setIsLoading(true);

          console.log("Starting EPUB load...");

          // Convert base64 to blob
          const base64String = file.fileData.split(",")[1];
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);

          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const bookData = new Blob([bytes], { type: "application/epub+zip" });

          //Book Instance
          const book = Epub(bookData);
          bookRef.current = book;

          console.log(book);

          //book load
          await book.ready;
          await book.locations.generate(1024);

          const rendition = book.renderTo(viewerRef.current, {
            width: "100%",
            height: "100%",
            spread: "none",
            flow: "paginated",
          });
          renditionRef.current = rendition;

          //Listen for location changes
          rendition.on("relocated", (location) => {
            if (!book.locations.total) return;

            const locay = book.locations;
            console.log("Relocated to:", locay);
            console.log("Relocated to:", locay.total);
            const current = book.locations.locationFromCfi(location.start.cfi);
            const total = book.locations.total;

            onLocationChange?.({ current: current + 1, total });
          });

          await rendition.display();

          rendition?.hooks.content.register((contents) => {
            const doc = contents.document;
            let touchStartX = 0;
            let touchStartY = 0;

            doc.addEventListener(
              "touchstart",
              (e) => {
                touchStartX = e.changedTouches[0].clientX;
                touchStartY = e.changedTouches[0].clientY;
              },
              { passive: true },
            );

            doc.addEventListener(
              "touchend",
              (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;

                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;

                // Only trigger if horizontal swipe is dominant
                if (
                  Math.abs(deltaX) > Math.abs(deltaY) * 2 &&
                  Math.abs(deltaX) > 50
                ) {
                  if (deltaX > 0) {
                    console.log("Swipe right - previous page");
                    renditionRef.current.prev();
                  } else {
                    console.log("Swipe left - next page");
                    renditionRef.current.next();
                  }
                }
              },
              { passive: true },
            );
          });

          rendition.on("rendered", () => {
            const iframe = viewerRef.current.querySelector("iframe");
            if (iframe) {
              iframe.style.touchAction = "pan-y";
              iframe.style.pointerEvents = "auto";
            }
          });

          if (mounted) setIsLoading(false);
        } catch (err) {
          console.error("Error loading EPUB :", err);
          if (mounted) {
            setError("Failed to load EPUB file");
            setIsLoading(false);
          }
        }
      };

      loadBook();

      return () => {
        mounted = false;
        try {
          renditionRef.current?.destroy();
        } catch (e) {
          console.warn("Error destroying rendition");
        }
        try {
          bookRef.current?.destroy();
        } catch (e) {
          console.warn("Error destroying book");
        }
      };
    }, [file]);

    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your book...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <div
          ref={viewerRef}
          className="epub-viewer w-full h-full"
          style={{
            height: "calc(100vh - 200px)",
            position: "relative",
            width: "100%",
            overflow: "hidden",
            touchAction: "pan-y",
          }}
        />
      </>
    );
  },
);
EpubReader.displayName = "EpubReader";
export default EpubReader;
