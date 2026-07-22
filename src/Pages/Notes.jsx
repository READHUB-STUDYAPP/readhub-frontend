import React, { useState, useEffect } from "react";
import axiosConfig from "../Util/axiosConfig";
import { apiEndpoints } from "../Util/apiEndpoints";
import { useFiles } from "../Context/FileContext";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { files, highlights: highlightMap } = useFiles();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get(apiEndpoints.NOTES);
      setNotes(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to load notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const fileIndex = new Map();
  (files || []).forEach((f) => {
    const book = f?.book ?? f;
    const id = book?._id ?? book?.id ?? book?.bookId;
    if (id) fileIndex.set(String(id), book);
  });
  const validBookIds = new Set(fileIndex.keys());

  const highlightEntries = Object.entries(highlightMap || {});
  const allLocalHighlights = highlightEntries.flatMap(([bookId, items]) =>
    Array.isArray(items) && validBookIds.has(String(bookId))
      ? items.map((h) => ({ ...h, bookId }))
      : [],
  );

  // Saved local highlights should appear as notes (and be grouped below)
  const apiNoteKeys = new Set(
    (notes || []).map((n) => {
      const id = n?.book?._id ? String(n.book._id) : "unknown";
      const page = typeof n?.page === "number" ? n.page : "";
      const content = (n?.content || "").trim();
      return `${id}|${page}|${content}`;
    }),
  );

  const localHighlights = allLocalHighlights
    .filter((h) => h.saved)
    .filter((h) => {
      const id = String(h.bookId || "unknown");
      const page = typeof h.page === "number" ? h.page : "";
      const content = (h.text || "").trim();
      return !apiNoteKeys.has(`${id}|${page}|${content}`);
    })
    .map((h) => {
      const book = fileIndex.get(String(h.bookId));
      const title =
        book?.title ?? book?.name ?? book?.filename ?? "Unknown Book";
      return {
        ...h,
        bookTitle: title,
      };
    });

  // Group combined notes by book: both local and API
  const groupedNotes = {};
  
  // Add local saved highlights to grouped notes
  localHighlights.forEach((h) => {
    const bookId = h.bookId;
    const bookTitle = h.bookTitle;
    if (!groupedNotes[bookId]) {
      groupedNotes[bookId] = {
        title: bookTitle,
        notes: [],
      };
    }
    groupedNotes[bookId].notes.push({
      _id: h.id,
      content: h.text,
      page: h.page,
      isLocal: true,
    });
  });
  
  // Add API notes to grouped notes
  notes.forEach((note) => {
    const bookId = note.book?._id || "unknown";
    const bookTitle = note.book?.title || "Unknown Book";
    if (!groupedNotes[bookId]) {
      groupedNotes[bookId] = {
        title: bookTitle,
        notes: [],
      };
    }
    groupedNotes[bookId].notes.push({
      ...note,
      isLocal: false,
    });
  });

  // Total highlights = all local highlights made in the reader (pdf/text)
  const totalHighlights = allLocalHighlights.length;
  // Total books = unique books that have notes
  const totalBooks = Object.keys(groupedNotes).length;
  return (
    <div>
      <div className="px-[16px] pt-[40px] overflow-hidden mb-15">
        <div className="flex justify-between mb-8 items-center">
          <p className="text-black text-tittle_Large">Highlights & Notes</p>
          <button
            onClick={() => {
              fetchNotes();
            }}
            className="flex w-[40px] h-[40px] rounded-[8.04] bg-white justify-center items-center hover:bg-gray-100 transition-colors"
            title="Refresh notes"
          >
            {" "}
            <svg
              className={`w-[24px] h-[24px] ${loading ? "animate-spin" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M13 10H18L12 16L6 10H11V3H13V10ZM4 19H20V12H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V12H4V19Z"></path>
            </svg>
          </button>
        </div>

        <div className="bg-white h-[46px] w-full flex rounded-[11px] mb-4">
          <img src="/Variant3.svg" alt="search" className="w-[24px] mx-4" />
          <input
            type="text"
            placeholder="Search highlights..."
            className="outline-0 w-full"
            style={{ backgroundColor: "white", border: "0px" }}
          />
        </div>

        <div className="flex justify-between text-body_Small font-medium mb-4">
          <div className="h-[38px] w-[171px] xsm:w-[160px] border-1 rounded-[33px] border-[#4b6481] flex justify-center items-center">
            <img src="/Variant3c.svg" alt="icon" className="w-[24px]" />
            <p>AI Summary</p>
          </div>
          <div className="h-[38px] w-[171px] xsm:w-[160px] border-1 rounded-[33px] border-[#4b6481] flex justify-center items-center">
            <img src="/Variant3b.svg" alt="icon" className="w-[24px]" />
            <p>Create Blog Post</p>
          </div>
        </div>

        {/* Stats cards - always show */}
        <div className="flex justify-between mb-8">
          <div className="w-[171px] h-[72px] bg-white px-4 justify-center flex flex-col rounded-[13.96px]">
            <p className="text-primary text-headline_Small leading-7">{totalHighlights}</p>
            <p className="text-tertiary text-body_Small">
              Total highlights
            </p>
          </div>

          <div className="w-[171px] h-[72px] bg-white px-4 justify-center flex flex-col rounded-[13.96px]">
            <p className="text-primary text-headline_Small leading-7">{totalBooks}</p>
            <p className="text-tertiary text-body_Small">Books</p>
          </div>
        </div>

        {Object.keys(groupedNotes).length > 0 ? (
          <div>
            <div>
              {Object.keys(groupedNotes).map((bookId) => {
                const bookNotes = groupedNotes[bookId]?.notes || [];
                const bookTitle = groupedNotes[bookId]?.title || "Unknown Book";

                if (bookNotes.length === 0) return null;

                return (
                  <div key={bookId}>
                    <span className="text-black text-tittle_Medium font-semibold flex mb-3">
                      <img src="/import_contacts.svg" alt="" />
                      <p className="ml-1">{bookTitle}</p>
                    </span>

                    {bookNotes.map((note, index) => (
                      <div key={note._id || index}>
                        <div className="w-full bg-primary rounded-[10px] p-[2px] mb-6">
                          <div className="bg-white rounded-[9px] p-3">
                            <p className="text-body_Medium font-medium break-words">
                              "{note.content}"
                            </p>
                            <p className="text-[#5f5f61] text-body_Small mt-1">
                              Page {note.page}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center h-100 items-center">
            Loading notes...
          </div>
        ) : error ? (
          <div className="flex justify-center h-100 items-center text-red-600">
            {error}
          </div>
        ) : (
          <div className="flex justify-center h-100 items-center">
            Cultivate a habit of taking notes
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
