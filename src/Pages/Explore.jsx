import React, { useState } from "react";
import { ReadHubImages } from "../assets/asset";
import { useNavigate } from "react-router-dom";
import { LuSearch } from "react-icons/lu";
import { IoClose, IoDownloadOutline } from "react-icons/io5";

const Explore = () => {
  const navigate = useNavigate();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const getBestCoverUrl = (formats = {}) => {
    const imageFormat = Object.entries(formats).find(([mimeType]) =>
      mimeType.toLowerCase().includes("image/")
    );

    return imageFormat ? imageFormat[1] : null;
  };

  const getBestDownloadUrl = (formats = {}) => {
    const preferredMimeTypes = [
      "application/pdf",
      "application/epub+zip",
      "text/plain",
      "text/html",
      "application/xhtml+xml",
    ];

    for (const mimeType of preferredMimeTypes) {
      if (formats[mimeType]) {
        return formats[mimeType];
      }
    }

    const fallbackFormat = Object.values(formats)[0];
    return fallbackFormat || null;
  };

  const getDownloadFileName = (book, downloadUrl) => {
    if (!downloadUrl) return `${book.title || "book"}.pdf`;

    const ext = downloadUrl.toLowerCase().endsWith(".pdf")
      ? ".pdf"
      : downloadUrl.toLowerCase().endsWith(".epub")
        ? ".epub"
        : downloadUrl.toLowerCase().endsWith(".txt")
          ? ".txt"
          : ".html";

    return `${(book.title || "book").replace(/[^a-z0-9]+/gi, "_").toLowerCase()}${ext}`;
  };

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    setIsLoading(true);
    setSearchError("");

    try {
      const response = await fetch(
        `https://gutendex.com/books?search=${encodeURIComponent(trimmedQuery)}&languages=en`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to fetch books.");
      }

      setSearchResults(data.results || []);
    } catch (error) {
      setSearchError(error.message || "Unable to fetch books right now.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Search books</h3>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close search modal"
              >
                <IoClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="mt-4 space-y-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search new books..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Search books
              </button>

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {isLoading && <p className="text-sm text-gray-500">Searching books...</p>}
                {searchError && <p className="text-sm text-red-500">{searchError}</p>}

                {!isLoading && !searchError && searchResults.length === 0 && searchQuery.trim() && (
                  <p className="text-sm text-gray-500">No books found for this search.</p>
                )}

                {searchResults.map((book) => {
                  const coverUrl = getBestCoverUrl(book.formats || {});
                  const downloadUrl = getBestDownloadUrl(book.formats || {});
                  const downloadFileName = getDownloadFileName(book, downloadUrl);

                  return (
                    <div
                      key={book.id}
                      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 text-center text-[10px] font-semibold text-blue-700">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={book.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{book.title}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {book.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {book.authors?.[0]?.name || "Unknown author"}
                        </p>
                      </div>

                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={downloadFileName}
                          className="rounded-full bg-white p-2 text-blue-600 shadow-sm transition hover:text-blue-700"
                          aria-label={`Download ${book.title}`}
                        >
                          <IoDownloadOutline size={18} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-5 lg:py-5 lg:px-10 min-h-screen bg-gray-100">
        <div className="flex flex-col gap-1 justify-start items-start mt-10">
          <span className="text-3xl font-semibold">Explore</span>
          <span className="text-sm font-normal text-gray-600">
            Discover new reads and tips
          </span>
        </div>

        <div className="card flex flex-col gap-4 bg-blue-500 rounded-3xl p-5 mt-7.5">
          <div className="flex justify-start items-start">
            <img src={ReadHubImages.sparkleIcon} alt="icon" />
          </div>
          <div className="px-4">
            <span className="text-white text-lg">
              “The more that you read, the more things you will know. The more
              that you learn, the more places you’ll go.”
            </span>
          </div>
          <div>
            <span className="text-gray-100 text-sm">_Dr Seuss</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mt-7.5">
          <div className="flex flex-col gap-1.5 items-center justify-center bg-blue-200 rounded-2xl p-6">
            <span>
              <img src={ReadHubImages.timerIcon} alt="books" />
            </span>
            <span className="text-blue-600 text-sm">Start Focus</span>
          </div>
          <div
            className="flex flex-col gap-1.5 items-center justify-center bg-blue-200 rounded-2xl p-6 active:bg-blue-200/80"
            onClick={() => {
              navigate("/library");
            }}
          >
            <span>
              <img src={ReadHubImages.libraryIcon} alt="icon" />
            </span>
            <span className="text-blue-600">My Library</span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3.5 mt-12 w-full">
          <div className="flex flex-row justify-between items-center px-2">
            <span className="text-xl font-medium">Trending Books</span>
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="text-2xl text-blue-600"
              aria-label="Open search"
            >
              <LuSearch />
            </button>
          </div>
          <div className="cards grid grid-cols-3 justify-center gap-8 items-center w-full">
            <div>
              <img src={ReadHubImages.trendingbook1} alt="books" />
            </div>
            <div>
              <img src={ReadHubImages.trendingbook2} alt="books" />
            </div>
            <div>
              <img src={ReadHubImages.trendingbook3} alt="books" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 justify-start items-start mt-9.5 lg:mt-14">
          <div>
            <span></span>
            <span className="text-lg font-medium">Reading Tips</span>
          </div>
          <div className="cards flex flex-col gap-5 items-start justify-start w-full">
            <div className="card bg-white w-full p-4 rounded-xl flex justify-start items-start flex-row gap-4 border-gray-200 border">
              <div className="p-3 rounded-lg flex justify-center items-center bg-blue-100">
                <span>
                  <img src={ReadHubImages.timerIcon} alt="icon" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5 justify-start items-start">
                <span className="text-lg font-medium text-gray-800">
                  Set a Reading Schedule
                </span>
                <span className="text-sm font-normal text-gray-500">
                  Read at the same time everyday to a build a habit
                </span>
              </div>
            </div>
            <div className="card bg-white w-full p-4 rounded-xl flex justify-start items-start flex-row gap-4 border-gray-200 border">
              <div className="p-3 rounded-lg flex justify-center items-center bg-blue-100">
                <span>
                  <img src={ReadHubImages.blueCirclesIcon} alt="icon" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5 justify-start items-start">
                <span className="text-lg font-medium text-gray-800">Set Daily Goals</span>
                <span className="text-sm font-normal text-gray-500">
                  Start with 20minutes and gradually increase
                </span>
              </div>
            </div>
            <div className="card bg-white w-full p-4 rounded-xl flex justify-start items-start flex-row gap-4 border-gray-200 border mb-20">
              <div className="p-3 rounded-lg flex justify-center items-center bg-blue-200">
                <span>
                  <img src={ReadHubImages.blueFlashIcon} alt="icon" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5 justify-start items-start">
                <span className="text-lg font-medium text-gray-800">Use Focus Mode</span>
                <span className="text-sm font-normal text-gray-500">
                  Eliminate distraction with our readlock feature
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col mt-7.5">
          <div></div>
          <div className="cards"></div>
        </div>
      </div>
    </>
  );
};

export default Explore;
