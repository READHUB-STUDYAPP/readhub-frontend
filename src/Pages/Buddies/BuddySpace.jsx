import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiBookOpen, FiSend, FiSlash, FiUserX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import axiosConfig from '../../Util/axiosConfig';
import { authInputClass } from '../../Util/authStyles';
import { buddiesApi, percentOf, timeAgo } from '../../services/buddies';

const REACTIONS = ['👏', '📚', '🔥', '💯'];

/**
 * The private space two buddies share.
 *
 * One scroll, not tabs. The pair's book, how far each of them has got, and
 * what they have said about it are one conversation -- splitting progress from
 * discussion would mean updating a number in one place and talking about it in
 * another, which is how a shared read quietly becomes two solo ones.
 */
export default function BuddySpace() {
  const { buddyId } = useParams();
  const navigate = useNavigate();

  const [row, setRow] = useState(null);
  const [reads, setReads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [picking, setPicking] = useState(false);
  const endRef = useRef(null);

  const active = reads.find((read) => read.status === 'active');
  const finished = reads.filter((read) => read.status === 'completed');

  const load = useCallback(async () => {
    try {
      const { buddies } = await buddiesApi.mine();
      const found = buddies.find((item) => item._id === buddyId);
      if (!found) {
        setFailed('That buddy space could not be found.');
        return;
      }
      setRow(found);

      const [readList, thread] = await Promise.all([
        buddiesApi.reads(buddyId),
        buddiesApi.messages(buddyId),
      ]);
      setReads(readList);
      setMessages(thread.messages);
    } catch (error) {
      setFailed(error?.response?.data?.message || 'That buddy space could not be found.');
    } finally {
      setLoading(false);
    }
  }, [buddyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const onSend = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    setSending(true);
    try {
      const message = await buddiesApi.post(buddyId, { body, kind: 'text' });
      setMessages((current) => [...current, message]);
      setDraft('');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not send that.');
    } finally {
      setSending(false);
    }
  };

  const onReact = async (message, emoji) => {
    try {
      const updated = await buddiesApi.react(buddyId, message._id, emoji);
      setMessages((current) => current.map((item) => (item._id === updated._id ? updated : item)));
    } catch {
      toast.error('Could not add that reaction.');
    }
  };

  const onProgress = async (page) => {
    try {
      const updated = await buddiesApi.setProgress(buddyId, active._id, page);
      setReads((current) => current.map((read) => (read._id === updated._id ? updated : read)));
      if (updated.status === 'completed') {
        toast.success(`You both finished ${updated.bookTitle}.`);
        await load();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not save your progress.');
    }
  };

  const onEnd = async () => {
    if (!window.confirm(`End your buddy relationship with ${row.buddy?.username}? Your shared reading history is kept.`)) {
      return;
    }
    try {
      await buddiesApi.end(buddyId);
      toast.success('Buddy removed.');
      navigate('/buddies');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not do that.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-variant" />
        <div className="h-40 animate-pulse rounded-xl bg-surface-variant" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-tittle_Large font-bold text-ink">{failed}</p>
        <button
          type="button"
          onClick={() => navigate('/buddies')}
          className="rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          Back to Reading Buddy
        </button>
      </div>
    );
  }

  const partnerId = row.buddy?._id;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate('/buddies')}
        className="flex w-fit items-center gap-2 text-body_Small font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <FiArrowLeft /> Reading Buddy
      </button>

      <header className="flex flex-wrap items-center gap-4">
        {row.buddy?.profilePicture ? (
          <img src={row.buddy.profilePicture} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-wash text-tittle_Large font-bold text-brand-strong">
            {(row.buddy?.username ?? '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-headline_Small font-extrabold text-ink">
            {row.buddy?.username ?? 'Your buddy'}
          </h1>
          <p className="text-label_Small text-ink-faint">
            Buddies since {new Date(row.startedAt).toLocaleDateString()}
            {row.completedReads > 0 && ` · ${row.completedReads} finished together`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/buddies/u/${partnerId}`)}
          className="rounded-full border border-line px-4 py-2 text-body_Small font-semibold text-ink transition-colors hover:bg-surface-variant"
        >
          View profile
        </button>
      </header>

      {/* ------------------------------------------------- the shared read */}
      <section className="flex flex-col gap-3 rounded-xl border border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-tittle_Large font-bold text-ink">Reading together</h2>
          {!active && (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="rounded-full bg-brand px-4 py-2 text-body_Small font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              Choose a book
            </button>
          )}
        </div>

        {active ? (
          <SharedRead
            read={active}
            meIsNot={partnerId}
            partnerName={row.buddy?.username ?? 'Your buddy'}
            onProgress={onProgress}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <FiBookOpen size={22} className="text-ink-faint" />
            <p className="text-body_Small text-ink-soft">
              No book on the go. Pick one you both want to read and set a target.
            </p>
          </div>
        )}

        {finished.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <h3 className="text-body_Small font-semibold text-ink">Finished together</h3>
            <ul className="flex flex-col gap-1">
              {finished.map((read) => (
                <li key={read._id} className="text-body_Small text-ink-soft">
                  {read.bookTitle}
                  {read.completedAt && (
                    <span className="text-ink-faint"> · {new Date(read.completedAt).toLocaleDateString()}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------ chat */}
      <section className="flex flex-col gap-3">
        <h2 className="text-tittle_Large font-bold text-ink">Conversation</h2>

        <ul className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <li className="rounded-xl border border-dashed border-line p-6 text-center text-body_Small text-ink-soft">
              Nothing said yet. Share what you made of the first chapter.
            </li>
          )}

          {messages.map((message) => {
            const mine = String(message.author) !== String(partnerId);
            return (
              <li
                key={message._id}
                className={`flex max-w-[85%] flex-col gap-1 ${mine ? 'self-end items-end' : 'self-start'}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    mine ? 'bg-brand text-white' : 'bg-surface-variant text-ink'
                  } ${message.deletedAt ? 'italic opacity-70' : ''}`}
                >
                  <p className="whitespace-pre-wrap text-body_Small">{message.body}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-label_Small text-ink-faint">
                    {mine ? 'You' : message.authorName} · {timeAgo(message.createdAt)}
                  </span>
                  {!message.deletedAt && (
                    <span className="flex gap-1">
                      {REACTIONS.map((emoji) => {
                        const count = (message.reactions ?? []).filter((r) => r.emoji === emoji).length;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            aria-label={`React with ${emoji}`}
                            aria-pressed={count > 0}
                            onClick={() => onReact(message, emoji)}
                            className={`rounded-full px-1.5 text-label_Small transition-colors ${
                              count > 0 ? 'bg-brand-wash' : 'hover:bg-surface-variant'
                            }`}
                          >
                            {emoji}
                            {count > 0 && <span className="ml-0.5 text-ink-soft">{count}</span>}
                          </button>
                        );
                      })}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
          <li ref={endRef} />
        </ul>

        <form onSubmit={onSend} className="flex gap-2">
          <label className="sr-only" htmlFor="buddy-message">
            Message your buddy
          </label>
          <input
            id="buddy-message"
            value={draft}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Say something about the book…"
            className={`${authInputClass(false)} flex-1`}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
          >
            <FiSend />
          </button>
        </form>
      </section>

      {/* ---------------------------------------------------------- safety */}
      <section className="flex flex-wrap gap-4 border-t border-line pt-4">
        <button
          type="button"
          onClick={onEnd}
          className="flex items-center gap-2 text-body_Small text-ink-soft transition-colors hover:text-ink"
        >
          <FiUserX /> Remove buddy
        </button>
        <button
          type="button"
          onClick={() => navigate(`/buddies/u/${partnerId}`)}
          className="flex items-center gap-2 text-body_Small text-ink-soft transition-colors hover:text-ink"
        >
          <FiSlash /> Block or report
        </button>
      </section>

      {picking && (
        <ChooseBookDialog
          buddyId={buddyId}
          onClose={() => setPicking(false)}
          onStarted={async () => {
            setPicking(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------- the read */

/**
 * The book, the target, and two progress bars.
 *
 * Both bars are always shown, side by side and the same size. Showing only
 * your own would lose the point of reading together; showing the partner's as
 * a comparison -- ahead/behind -- is what the PRD rules out, so neither bar is
 * ever labelled relative to the other.
 */
function SharedRead({ read, meIsNot, partnerName, onProgress }) {
  const partnerRow = read.progress.find((row) => String(row.user) === String(meIsNot));
  const myRow = read.progress.find((row) => String(row.user) !== String(meIsNot));

  const [page, setPage] = useState(myRow?.page ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    await onProgress(Number(page) || 0);
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-body_Large font-semibold text-ink">{read.bookTitle}</p>
        <p className="text-body_Small text-ink-soft">
          {read.targetPage && `Target: page ${read.targetPage}`}
          {read.targetPage && read.targetDate && ' · '}
          {read.targetDate && `by ${new Date(read.targetDate).toLocaleDateString()}`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Bar label="You" row={myRow} target={read.targetPage} />
        <Bar label={partnerName} row={partnerRow} target={read.targetPage} />
      </div>

      <form onSubmit={save} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-label_Small text-ink-faint">What page are you on?</span>
          <input
            type="number"
            min={0}
            value={page}
            onChange={(event) => setPage(event.target.value)}
            className={`${authInputClass(false)} w-32`}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-5 py-2.5 text-body_Small font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Update'}
        </button>
      </form>
    </div>
  );
}

function Bar({ label, row, target }) {
  const percent = percentOf(row, target);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-body_Small font-medium text-ink">{label}</span>
        <span className="shrink-0 text-label_Small text-ink-faint">
          {percent === null ? `page ${row?.page ?? 0}` : `${percent}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
      {row?.completedAt && (
        <span className="text-label_Small text-brand-strong">Reached the target 🎉</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------- choosing a book */

function ChooseBookDialog({ buddyId, onClose, onStarted }) {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('');
  const [targetPage, setTargetPage] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // The pair pick from what ReadHub has. Trending is the shared catalogue;
      // the reader's own library is the fallback when it is quiet.
      try {
        const { data } = await axiosConfig.get('discover/trending');
        const pool = Array.isArray(data) ? data : (data?.books ?? []);
        if (pool.length > 0) {
          setBooks(pool);
          return;
        }
      } catch {
        // fall through to the library
      }
      try {
        const { data } = await axiosConfig.get('book');
        setBooks(Array.isArray(data) ? data : (data?.books ?? []));
      } catch {
        setBooks([]);
      }
    })();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!bookId) {
      toast.error('Pick a book first.');
      return;
    }

    setSaving(true);
    try {
      await buddiesApi.startRead(buddyId, {
        book: bookId,
        targetPage: targetPage ? Number(targetPage) : undefined,
        targetDate: targetDate || undefined,
      });
      toast.success('Off you go. Your buddy has been told.');
      await onStarted();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not start that read.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-surface p-6"
      >
        <h2 className="text-tittle_Large font-bold text-ink">Read something together</h2>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">Book</span>
          {books.length === 0 ? (
            <p className="rounded-lg bg-surface-variant p-3 text-body_Small text-ink-soft">
              There are no books to choose from yet. Add one to your library first.
            </p>
          ) : (
            <select
              value={bookId}
              onChange={(event) => setBookId(event.target.value)}
              className={authInputClass(false)}
            >
              <option value="">Choose a book…</option>
              {books.map((book) => (
                <option key={book._id} value={book._id}>
                  {book.title}
                </option>
              ))}
            </select>
          )}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-body_Small font-semibold text-ink">
              Target page <span className="font-normal text-ink-faint">(optional)</span>
            </span>
            <input
              type="number"
              min={1}
              value={targetPage}
              onChange={(event) => setTargetPage(event.target.value)}
              placeholder="240"
              className={authInputClass(false)}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-body_Small font-semibold text-ink">
              By when <span className="font-normal text-ink-faint">(optional)</span>
            </span>
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className={authInputClass(false)}
            />
          </label>
        </div>

        <p className="text-label_Small text-ink-faint">
          A target is what the progress bars fill towards, and what the gentle reminders use.
          You can change it later.
        </p>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || books.length === 0}
            className="flex-1 rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {saving ? 'Starting…' : 'Start reading'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-line px-5 py-2.5 text-body_Medium font-semibold text-ink-soft transition-colors hover:bg-surface-variant"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
