import Epub, { EpubCFI } from "epubjs";
import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { baseURL, apiEndpoints } from "../Util/apiEndpoints";

const EpubReader = forwardRef(
  ({ file, fontSize, theme, onLocationChange, resumeCfi = null }, ref) => {
    const viewerRef = useRef(null);
    const resizeCleanupRef = useRef(null);
    const resumedRef = useRef(false);
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
      resumedRef.current = false;
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

          /*
            Nothing is drawn for a reader who has already left.

            Opening a book is a chain of awaits, and React runs this effect
            twice on mount in development and again whenever the book changes.
            Without this check the run that has already been cleaned up comes
            back from its await and renders anyway -- into the same element the
            newer run has just cleared. The result is two or three views
            stacked in the viewer, the newest one wired to the controls and an
            older one on top of the pile.

            That is what "the page number changes but the page does not" was:
            `next()` advanced the live rendition while the reader looked at an
            orphan that nothing could move.
          */
          if (!mounted) {
            book.destroy();
            return;
          }

          const rendition = book.renderTo(viewerRef.current, {
            width: "100%",
            height: "100%",
            spread: "none",
            flow: "paginated",
            /*
              The default manager, deliberately.

              `continuous` looks like the answer to stuttering page turns, and
              it is not: it moves between pages by scrolling its container, and
              this viewer hides its overflow so that it can crop a page to the
              column. Driving one with the other, the view never moves --
              turning the page raised the location and stacked another iframe
              on the pile while the reader sat looking at the cover.

              The default manager swaps the single view in place, which is what
              works here.
            */
            // Do not let the book run its own scripts in our page.
            allowScriptedContent: false,
          });
          renditionRef.current = rendition;

          /*
            Page-fitting rules, applied before the first page is laid out.

            In paginated flow each page is a column the height of the viewer,
            and the viewer hides its overflow, so anything the book sizes
            larger than that column is cut off -- scanned plates and covers
            especially, which carry their original pixel dimensions. `image` is
            the SVG element, not a typo: a cover is usually an <svg> wrapping
            an <image>, and an `img` rule never touches it.

            Registered as a theme rather than injected once the section has
            loaded. Injecting afterwards reflows a page that has already been
            laid out, and reopening a book relies on that layout holding still:
            the position is set from a CFI during the first display, and a
            reflow after it silently threw the reader back to page one.
          */
          rendition.themes.register("readhub", {
            "img, image, svg, video": {
              "max-width": "100%",
              "max-height": "100%",
              width: "auto",
              height: "auto",
              "object-fit": "contain",
            },
            "body, html": { margin: "0", padding: "0" },
          });
          rendition.themes.select("readhub");


          //Listen for location changes
          rendition.on("relocated", (location) => {
            if (!book.locations.total) return;

            const locay = book.locations;
            console.log("Relocated to:", locay);
            console.log("Relocated to:", locay.total);
            const current = book.locations.locationFromCfi(location.start.cfi);
            const total = book.locations.total;

            // The CFI is the exact place; the number is for progress and
            // stats, which have to be comparable with a PDF's pages.
            onLocationChange?.({ current: current + 1, total, cfi: location.start.cfi });
          });

          /*
            Open where the reader stopped.

            The saved place is a CFI, and it is given to the *first* display on
            purpose. epub.js positions within a section while it is laying that
            section out; asked to move to a point in a section already on
            screen it measures the finished layout instead, and for a book of
            full-page images that measurement comes back as zero -- the reader
            stays on page one and nothing reports a failure. Resuming by
            location number could never work for that reason, whatever it was
            given.
          */
          await withTimeout(
            rendition.display(resumeCfi ?? undefined),
            "The first EPUB page could not be rendered.",
          );

          // Same again: the reader may have left while the first page was
          // being laid out.
          if (!mounted) {
            rendition.destroy();
            book.destroy();
            return;
          }

          setIsLoading(false);

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
            .then(async () => {
              if (!mounted) return;

              /*
                Reopen where the reader stopped.

                A saved position is a location number, and location numbers do
                not exist until generation finishes -- so this is the earliest
                moment it can be honoured. Only on the first load of a book,
                and only forwards: someone who has already turned a page while
                this was generating should not be yanked back.

                Awaited, because `display` is asynchronous: reading the current
                location straight after asking to move reports the page being
                left, and that stale number then overwrote the real one in the
                header.
              */
                resumedRef.current = true;
                /*
                  A location's CFI is a *range* -- it marks the span of text
                  that location covers, and looks like
                  epubcfi(/6/4!/4/40/2,/104/2/1:235,/120/2/1:138).

                  `display` will not position on a range: it opens the section
                  the range lives in and leaves the reader at the top of it,
                  which is why reopening a book at location 10 kept landing on
                  page 1 with no error to show for it. Collapsed to its start,
                  it is an ordinary point CFI and lands where it should.

                  `cfiFromLocation` answers -1 when it cannot map the number,
                  and -1 is truthy -- so the type is checked rather than the
                  value.
                */
              /*
                If the CFI did not land, walk to the place instead.

                Restoring by CFI is the right mechanism and works in most
                books. It does not in one shape: a book that is a single
                enormous section -- a Project Gutenberg file is typically one
                XHTML document of thirty-odd columns -- where epub.js opens the
                section and measures the position within it, and the
                measurement comes back as the top of the section.

                Turning pages, on the other hand, always works: it is a column
                scroll within the document already on screen. So when the CFI
                misses, the place is reached by turning pages, which is what a
                reader would otherwise be doing by hand. Bounded, because a
                resume should never become an unbounded loop, and abandoned if
                a turn stops making progress.
              */
              if (resumeCfi) {
                const locations = bookRef.current?.locations;
                const at = () => {
                  const here = rendition.currentLocation()?.start?.cfi;
                  return here ? locations?.locationFromCfi(here) ?? 0 : 0;
                };

                const goal = locations?.locationFromCfi(resumeCfi) ?? 0;
                let previous = -1;

                for (let step = 0; step < 400 && mounted; step += 1) {
                  const here = at();
                  if (here >= goal || here === previous) break;
                  previous = here;
                  await rendition.next();
                }
                if (!mounted) return;
              }

              const cfi = rendition.currentLocation()?.start?.cfi;
              const total = bookRef.current?.locations?.total;
              if (!cfi || !total) return;

              onLocationChange?.({
                current: bookRef.current.locations.locationFromCfi(cfi) + 1,
                total,
                cfi,
              });
            })
            .catch((locationError) => {
              console.warn("Unable to generate EPUB locations", locationError);
            });

          /*
            Re-lay-out when the window changes size.

            The column geometry is measured once at render. Without this, a
            resized or rotated window leaves the pages measured for the old
            size -- text clipped at the fold, and page turns that appear to do
            nothing because the column being scrolled to is no longer where the
            layout thinks it is.
          */
          let resizeTimer = null;
          const onResize = () => {
            // Settled, not per event. A resize fires in a stream while a
            // window is dragged, and a scrollbar appearing or disappearing
            // emits one too -- re-laying-out the book on each of them means a
            // full re-layout in the middle of a page turn, which is felt.
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              try {
                rendition.resize();
              } catch {
                // A resize during teardown is not worth reporting.
              }
            }, 150);
          };

          window.addEventListener("resize", onResize);
          resizeCleanupRef.current = () => {
            clearTimeout(resizeTimer);
            window.removeEventListener("resize", onResize);
          };

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
        resizeCleanupRef.current?.();
        resizeCleanupRef.current = null;
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

        {/*
          The viewer takes the space left over, and no more.

          It was `calc(100vh - 200px)` -- a guess at the height of the title
          and page line above it. The guess was low, so the box ran past the
          bottom of the window and the last inch of every page sat below the
          fold, which is why pages looked cut off. `flex-1` inside a column
          that is exactly the viewport tall measures it instead of guessing.
        */}
        <div
          ref={viewerRef}
          className="epub-viewer w-full flex-1 min-h-0"
          style={{
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
