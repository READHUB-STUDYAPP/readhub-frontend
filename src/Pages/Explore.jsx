import { useCallback, useEffect, useState } from 'react';
import { FiBookOpen, FiCheck, FiClock, FiPlus, FiTarget, FiUsers, FiZap } from 'react-icons/fi';
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

export default function Explore() {
  const navigate = useNavigate();
  const quote = quoteForToday();

  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

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
          <ul className="flex snap-x gap-6 overflow-x-auto px-1 pt-1 pb-4">
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
