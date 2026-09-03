import Epub from "epubjs";
import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { baseURL, apiEndpoints } from "../Util/apiEndpoints";

const EpubReader = forwardRef(
  ({ file, fontSize, theme, onLocationChange }, ref) => {
    const viewerRef = useRef(null);
    const bookRef = useRef(null);
    const renditionRef = useRef(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const withTimeout = (promise, message, timeout = 30000) =>
      Promise.race([
        promise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(message)), timeout);
        }),
      ]);

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
      const source = file?.fileData || file?.fileUrl;
      if (!viewerRef.current) return;

      let mounted = true;
      setError(null);
      viewerRef.current.replaceChildren();

      if (!source) {
        setIsLoading(false);
        setError("The EPUB book could not be found.");
        return;
      }

      const loadBook = async () => {
        try {
          setIsLoading(true);

          console.log("Starting EPUB load...");

          let bookSource = source;
          if (file?._id) {
            const token = localStorage.getItem("token");
            const contentUrl = `${baseURL}${apiEndpoints.BOOK_CONTENT.replace(":bookId", file._id)}`;
            const controller = new AbortController();
            const response = await withTimeout(
              fetch(contentUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal }),
              "The EPUB download timed out. Check the API and storage service.",
            ).catch((downloadError) => {
              controller.abort();
              throw downloadError;
            });
            if (!response.ok) throw new Error(`Unable to download EPUB (${response.status})`);
            bookSource = await withTimeout(response.arrayBuffer(), "The EPUB file could not be read.");
          } else if (typeof source === "string" && /^https?:\/\//i.test(source)) {
            const controller = new AbortController();
            const response = await withTimeout(
              fetch(source, { credentials: "omit", signal: controller.signal }),
              "The EPUB download timed out. Check the file URL and storage service.",
            ).catch((downloadError) => {
              controller.abort();
              throw downloadError;
            });
            if (!response.ok) {
              throw new Error(`Unable to download EPUB (${response.status})`);
            }
            bookSource = await withTimeout(
              response.arrayBuffer(),
              "The EPUB file could not be read.",
            );
          }

          /*
            The bytes go in as bytes, and only a URL is opened as a URL.

            This passed a Blob with `openAs: "epub"`, and in epub.js that type
            means "this is the address of an EPUB": it calls `request(input)` on
            what it is given. A Blob stringifies to "[object Blob]", so the
            reader spent its whole timeout fetching a URL of that name and then
            reported the book as invalid -- which is why a perfectly good file
            downloaded from Project Gutenberg would not open.

            `binary` is the type that means "these are the bytes", and it hands
            them straight to the unarchiver.
          */
          const book =
            bookSource instanceof ArrayBuffer
              ? Epub(bookSource, { openAs: "binary" })
              : Epub(bookSource);
          bookRef.current = book;

          console.log(book);

          //book load
          await withTimeout(
            book.ready,
            "The EPUB could not be parsed. The uploaded file may be invalid.",
          );
          const rendition = book.renderTo(viewerRef.current, {
            width: "100%",
            height: "100%",
            spread: "none",
            flow: "paginated",
          });
          renditionRef.current = rendition;

          /*
            Keep a page inside its column.

            In paginated flow epub.js gives each page a fixed column the height
            of the viewer, and the viewer hides its overflow -- so anything the
            book itself sizes larger than that column is simply cut off. Scanned
            title pages and full-page plates are routinely sized in absolute
            pixels or at 100% of a much taller original, which is why some pages
            arrived with their bottom sliced away.

            Bounding media to the column makes them fit it instead. The `!` is
            needed because these compete with the book's own stylesheet, which
            is more specific.
          */
          rendition.themes.default({
            "img, image, svg, video": {
              "max-width": "100% !important",
              "max-height": "100% !important",
              height: "auto !important",
              "object-fit": "contain",
            },
            // A long unbroken word or URL would otherwise push the column wider
            // than the page and take the text with it.
            p: { "overflow-wrap": "break-word" },
          });

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

          await withTimeout(
            rendition.display(),
            "The first EPUB page could not be rendered.",
          );

          if (mounted) setIsLoading(false);

          /*
            Locations are what give an EPUB a page count, and generating them
            is expensive on a large book -- so it stays off the path that gets
            the first page on screen.

            The result has to be announced when it arrives, though. `relocated`
            fires while this is still running, finds no total, and returns
            early; nothing emitted afterwards, so the header sat on "Page 1 of
            ?" for the whole session however many pages the book had. Emitting
            once here, from wherever the reader currently is, fills it in the
            moment the count exists.
          */
          book.locations
            .generate(1024)
            .then(() => {
              if (!mounted) return;

              const cfi = rendition.currentLocation()?.start?.cfi;
              const total = book.locations.total;
              if (!cfi || !total) return;

              onLocationChange?.({
                current: book.locations.locationFromCfi(cfi) + 1,
                total,
              });
            })
            .catch((locationError) => {
              console.warn("Unable to generate EPUB locations", locationError);
            });

          rendition?.hooks.content.register((contents) => {
            const doc = contents.document;
            let touchStartX = 0;
            let touchStartY = 0;

            // The book renders in an iframe, so once a reader clicks into the
            // text the arrow keys go to that document and never reach the page.
            // Each rendered section gets the same handler, so the keys work
            // wherever the focus happens to be.
            doc.addEventListener("keydown", (event) => {
              if (event.key === "ArrowRight" || event.key === "PageDown") {
                event.preventDefault();
                renditionRef.current?.next();
              } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
                event.preventDefault();
                renditionRef.current?.prev();
              }
            });

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

        } catch (err) {
          console.error("Error loading EPUB :", err);
          if (mounted) {
            setError(err.message || "Failed to load EPUB file");
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
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-surface">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-ink-faint">Loading your book...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-surface">
            <p className="text-danger">{error}</p>
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
