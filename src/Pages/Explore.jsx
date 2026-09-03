import { useCallback, useEffect, useState } from 'react';
import { FiBookOpen, FiCheck, FiClock, FiPlus, FiTarget, FiUsers, FiZap } from 'react-icons/fi';
import { IoClose, IoDownloadOutline } from 'react-icons/io5';
import { LuSearch } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { discoverApi, quoteForToday, readerLabel } from '../services/discover';

/**
 * Explore.
 *
 * The same five sections as the phone app, in the same order: the quote, the
 * two shortcuts, what is trending, the reading tips, and what is recommended.
 * Trending was three fixed images of book covers before this -- decoration,
 * where the phone app was showing what people are actually reading -- and
 * recommended did not exist at all.
 *
 * The layout is the part that differs, and should: one column on a phone
 * browser, wider rows on a desktop, rather than a phone screen stretched.
 */
const TIPS = [
  {
    key: 'schedule',
    Icon: FiClock,
    title: 'Set a Reading Schedule',
    body: 'Read at the same time every day to build a habit.',
  },
  {
    key: 'goals',
    Icon: FiTarget,
    title: 'Set Daily Goals',
    body: 'Start with 20 minutes and gradually increase.',
  },
  {
    key: 'focus',
    Icon: FiZap,
    title: 'Use Focus Mode',
    body: 'Eliminate distractions while you read.',
  },
];

/**
 * Project Gutenberg's search, as it arrived on dev.
 *
 * Public-domain books, searched live and downloaded straight from Gutendex.
 * Kept as it worked, restyled to the palette so it belongs to the page it
 * sits on.
 */
const getBestCoverUrl = (formats = {}) => {
  const imageFormat = Object.entries(formats).find(([mimeType]) =>
    mimeType.toLowerCase().includes('image/'),
  );
  return imageFormat ? imageFormat[1] : null;
};

const getBestDownloadUrl = (formats = {}) => {
  const preferred = [
    'application/pdf',
    'application/epub+zip',
    'text/plain',
    'text/html',
    'application/xhtml+xml',
  ];

  for (const mimeType of preferred) {
    if (formats[mimeType]) return formats[mimeType];
  }
  return Object.values(formats)[0] || null;
};

const getDownloadFileName = (book, downloadUrl) => {
  if (!downloadUrl) return (book.title || 'book') + '.pdf';

  const lower = downloadUrl.toLowerCase();
  const ext = lower.endsWith('.pdf')
    ? '.pdf'
    : lower.endsWith('.epub')
      ? '.epub'
      : lower.endsWith('.txt')
        ? '.txt'
        : '.html';

  const stem = (book.title || 'book').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  return stem + ext;
};

export default function Explore() {
  const navigate = useNavigate();
  const quote = quoteForToday();

  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const load = useCallback(async () => {
    try {
      // Together: two independent lists, and waiting for one before asking for
      // the other would show half a page for no reason.
      const [trendingBooks, recommendedBooks] = await Promise.all([
        discoverApi.trending(),
        discoverApi.recommended(),
      ]);
      setTrending(trendingBooks);
      setRecommended(recommendedBooks);
    } catch {
      // The empty states below say it plainly. Explore is a browse surface --
      // a toast on arrival would be shouting about something nobody asked for.
      setTrending([]);
      setRecommended([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onAdd = async (book) => {
    setAddingId(book._id);
    try {
      await discoverApi.add(book._id);
      toast.success(`${book.title} is in your library.`);

      // Marked in place rather than refetched: the ranking should not
      // rearrange itself under the reader's cursor because they added a book.
      setTrending((list) =>
        list.map((entry) => (entry._id === book._id ? { ...entry, inLibrary: true } : entry)),
      );
      setRecommended((list) => list.filter((entry) => entry._id !== book._id));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not add that book.');
    } finally {
      setAddingId(null);
    }
  };

  const handleSearch = async (event) => {
    if (event) event.preventDefault();

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const url =
        'https://gutendex.com/books?search=' +
        encodeURIComponent(trimmed) +
        '&languages=en';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || 'Unable to fetch books.');

      setSearchResults(data.results || []);
    } catch (error) {
      setSearchError(error.message || 'Unable to fetch books right now.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline_Small font-extrabold text-ink">Explore</h1>
        <p className="text-body_Medium text-ink-soft">Discover new reads and tips</p>
      </header>

      {/* Today's quote. */}
      <section className="relative overflow-hidden rounded-2xl bg-brand p-6">
        {/* The soft orbs the phone app draws behind this card. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-8 h-40 w-40 rounded-full bg-white/10"
        />
        <div className="relative flex flex-col gap-3">
          <FiZap className="text-white/90" size={22} aria-hidden="true" />
          <p className="max-w-2xl text-body_Large text-white">{`“${quote.text}”`}</p>
          <p className="text-label_Medium text-white/80">{`— ${quote.author}`}</p>
        </div>
      </section>

      {/* The two shortcuts. */}
      <section className="grid grid-cols-2 gap-4">
        <Shortcut
          label="Start Focus"
          glyph={<FiClock size={20} aria-hidden="true" />}
          onClick={() => navigate('/focus')}
        />
        <Shortcut
          label="My Library"
          glyph={<FiBookOpen size={20} aria-hidden="true" />}
          onClick={() => navigate('/library')}
        />
      </section>

      {/* Public-domain books, searched on Project Gutenberg. */}
      <section className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-tittle_Large font-bold text-ink">Search for a book</h2>
          <p className="text-label_Medium text-ink-soft">
            Thousands of free, out-of-copyright books from Project Gutenberg.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          aria-label="Search for books"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand transition-colors hover:bg-brand/15"
        >
          <LuSearch size={20} />
        </button>
      </section>

      {/* Trending. */}
      <section className="flex flex-col gap-4">
        <h2 className="text-tittle_Large font-bold text-ink">Trending Books</h2>

        {loading ? (
          <div className="flex gap-6">
            {[0, 1, 2, 3].map((key) => (
              <div
                key={key}
                className="aspect-[2/3] w-[130px] shrink-0 animate-pulse rounded-lg bg-surface-variant sm:w-[150px]"
              />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="text-body_Medium text-ink-soft">
            Nothing is trending yet. Books appear here once readers share them.
          </p>
        ) : (
          /* Scrolls in its own box, so a long row never makes the page scroll
             sideways. */
          <ul className="no-scrollbar flex snap-x gap-6 overflow-x-auto px-1 pt-1 pb-4">
            {trending.map((book) => (
              <li
                key={book._id}
                className="flex w-[130px] shrink-0 snap-start flex-col gap-2 sm:w-[150px] animate-[fadeIn_200ms_ease-out]"
              >
                <div className="relative">
                  <Cover book={book} className="aspect-[2/3] w-full" />
                  <AddButton
                    book={book}
                    adding={addingId === book._id}
                    onAdd={onAdd}
                    className="absolute -bottom-2 -right-2 h-9 w-9 border-2 border-surface shadow-card"
                  />
                </div>
                {/*
                  A fixed two-line box for the title.

                  Titles here run from three words to a whole filename, and
                  letting each one take the height it needs left the reader
                  counts on a ragged line across the row. Two lines is what the
                  longest of them needs.
                */}
                <p className="line-clamp-2 min-h-[2.5em] text-label_Medium leading-tight text-ink">
                  {book.title}
                </p>
                {readerLabel(book.readers) && (
                  <p className="flex items-center gap-1.5 text-label_Small text-ink-faint">
                    <FiUsers size={12} aria-hidden="true" /> {readerLabel(book.readers)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reading tips. */}
      <section className="flex flex-col gap-4">
        <h2 className="text-tittle_Large font-bold text-ink">Reading Tips</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TIPS.map((tip) => (
            <div
              key={tip.key}
              className="flex items-start gap-4 rounded-xl border border-line bg-surface p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-wash text-brand">
                <tip.Icon size={20} aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-label_Large font-semibold text-ink">{tip.title}</p>
                <p className="text-body_Small text-ink-soft">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended. */}
      <section className="flex flex-col gap-4">
        <h2 className="text-tittle_Large font-bold text-ink">Recommended for you</h2>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1].map((key) => (
              <div key={key} className="h-[120px] animate-pulse rounded-xl bg-surface-variant" />
            ))}
          </div>
        ) : recommended.length === 0 ? (
          <p className="text-body_Medium text-ink-soft">
            Nothing to suggest yet. Recommendations appear as readers share their books.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {recommended.map((book) => (
              <li
                key={book._id}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 animate-[fadeIn_200ms_ease-out]"
              >
                <Cover book={book} className="h-[104px] w-[72px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-label_Large font-semibold text-ink">{book.title}</p>
                  {book.pages > 0 && (
                    <p className="text-label_Medium text-ink-faint">{`${book.pages} pages`}</p>
                  )}
                  {readerLabel(book.readers) && (
                    <p className="flex items-center gap-1 text-label_Medium text-ink-faint">
                      <FiUsers size={11} aria-hidden="true" /> {readerLabel(book.readers)}
                    </p>
                  )}
                </div>
                <AddButton
                  book={book}
                  adding={addingId === book._id}
                  onAdd={onAdd}
                  className="h-10 w-10"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-overlay animate-[fadeIn_160ms_ease-out]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-tittle_Large font-bold text-ink">Search books</h3>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                aria-label="Close search"
                className="rounded-full p-2 text-ink-faint transition-colors hover:bg-surface-variant hover:text-ink"
              >
                <IoClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title or author"
                className="w-full rounded-2xl border border-line bg-surface-variant px-4 py-3 text-body_Medium text-ink outline-none placeholder:text-ink-faint focus:border-brand focus:bg-surface"
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-brand px-4 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong"
              >
                Search books
              </button>

              <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
                {isSearching && (
                  <p className="text-label_Medium text-ink-soft">Searching books...</p>
                )}
                {searchError && <p className="text-label_Medium text-danger">{searchError}</p>}

                {!isSearching &&
                  !searchError &&
                  searchResults.length === 0 &&
                  searchQuery.trim() && (
                    <p className="text-label_Medium text-ink-soft">
                      No books found for this search.
                    </p>
                  )}

                {searchResults.map((book) => {
                  const coverUrl = getBestCoverUrl(book.formats || {});
                  const downloadUrl = getBestDownloadUrl(book.formats || {});

                  return (
                    <div
                      key={book.id}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-surface-variant p-3"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-wash text-center text-label_Small font-semibold text-brand">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={'Cover of ' + book.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="line-clamp-3 px-1">{book.title}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-label_Large font-semibold text-ink">
                          {book.title}
                        </p>
                        <p className="mt-1 text-label_Medium text-ink-faint">
                          {book.authors?.[0]?.name || 'Unknown author'}
                        </p>
                      </div>

                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={getDownloadFileName(book, downloadUrl)}
                          aria-label={'Download ' + book.title}
                          className="rounded-full bg-surface p-2 text-brand shadow-card transition-colors hover:text-brand-strong"
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
    </div>
  );
}

function Shortcut({ label, glyph, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-brand-wash p-6 text-brand transition-transform hover:bg-brand/15 active:scale-[0.98]"
    >
      {glyph}
      <span className="text-label_Medium font-semibold">{label}</span>
    </button>
  );
}

function Cover({ book, className }) {
  return (
    <img
      src={book.coverImageUrl || '/note_stack.svg'}
      alt={`Cover of ${book.title}`}
      loading="lazy"
      className={`shrink-0 rounded-lg bg-surface-variant object-cover ${className}`}
    />
  );
}

/**
 * Adds somebody else's shared book.
 *
 * A book already held keeps its button in place, ticked and disabled, rather
 * than losing it -- a control that vanishes leaves the reader unsure whether
 * they pressed it.
 */
function AddButton({ book, adding, onAdd, className = '' }) {
  const held = Boolean(book.inLibrary);

  return (
    <button
      type="button"
      onClick={() => onAdd(book)}
      disabled={held || adding}
      aria-label={held ? `${book.title} is already in your library` : `Add ${book.title}`}
      className={`flex shrink-0 items-center justify-center rounded-full text-white transition-colors ${
        held ? 'bg-success' : 'bg-brand hover:bg-brand-strong'
      } ${className}`}
    >
      {adding ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      ) : held ? (
        <FiCheck size={16} aria-hidden="true" />
      ) : (
        <FiPlus size={16} aria-hidden="true" />
      )}
    </button>
  );
}
