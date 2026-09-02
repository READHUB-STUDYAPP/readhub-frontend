import { useCallback, useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCopy,
  FiEyeOff,
  FiLogOut,
  FiMessageSquare,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { groupsApi, targetStatus } from '../../services/groups';
import { apiEndpoints } from '../../Util/apiEndpoints';
import axiosConfig from '../../Util/axiosConfig';

/**
 * One group: its books, and how far each member has got in them.
 *
 * The invite code is shown to every member rather than the owner alone. A
 * group exists to be joined, and making everyone ask the founder to pass the
 * code on is friction with nothing behind it.
 *
 * Two columns from the large breakpoint: the books beside the group's own
 * details, because on a desktop there is width for both and stacking them
 * pushes the conversation off the bottom of the screen.
 */
export default function Group() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const myId = localStorage.getItem('userId');

  const load = useCallback(async () => {
    try {
      setGroup(await groupsApi.get(groupId));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'That group is no longer available.');
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  // The reader's own library, for the "add a book" list. Only fetched when
  // that panel is opened -- most visits never need it.
  useEffect(() => {
    if (!adding || books.length > 0) return;

    axiosConfig
      .get(apiEndpoints.BOOKS)
      .then(({ data }) => setBooks(Array.isArray(data) ? data : (data?.books ?? [])))
      .catch(() => setBooks([]));
  }, [adding, books.length]);

  const act = async (work, failure) => {
    try {
      await work();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || failure);
    }
  };

  const onCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      toast.success('Invite code copied.');
    } catch {
      // Clipboard access is refused in some browsers without a user gesture
      // they recognise. The code is on screen either way.
      toast.info(`Invite code: ${group.inviteCode}`);
    }
  };

  const me = group?.members?.find((member) => member.user?._id === myId);

  const onLeave = async () => {
    const owners = group.members.filter((member) => member.role === 'owner');
    const lastOwner = me?.role === 'owner' && owners.length === 1;

    const question = lastOwner
      ? 'You are the only owner, so leaving deletes the group for everyone. Continue?'
      : 'Leave this group? Your reading in it is removed with you.';

    if (!window.confirm(question)) return;

    await act(() => groupsApi.leave(groupId), 'Could not leave the group.');
    navigate('/groups');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded-md bg-surface-variant" />
        <div className="h-32 animate-pulse rounded-lg bg-surface-variant" />
        <div className="h-48 animate-pulse rounded-lg bg-surface-variant" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-body_Medium text-ink-soft">That group is no longer available.</p>
        <button type="button" onClick={() => navigate('/groups')} className="font-bold text-brand">
          Back to groups
        </button>
      </div>
    );
  }

  const positions = new Map(
    (group.progress ?? []).map((row) => [`${row.book}:${row.user}`, row.lastPageRead]),
  );
  const alreadyIn = new Set(group.books.map((entry) => entry.book));
  const addable = books.filter((book) => !alreadyIn.has(book._id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/groups')}
          aria-label="Back to groups"
          className="text-ink-soft transition-colors hover:text-ink"
        >
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-headline_Small font-extrabold text-ink">{group.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Books, each with the whole group's position in it. */}
        <div className="flex flex-col gap-4">
          {group.books.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line p-8 text-center">
              <FiBookOpen size={24} className="text-ink-faint" />
              <p className="text-tittle_Medium font-bold text-ink">No book yet</p>
              <p className="text-label_Medium text-ink-soft">
                Add one from your library and the group can read it together.
              </p>
            </div>
          ) : (
            group.books.map((entry) => {
              const target = group.schedule?.find((item) => item.book === entry.book);
              const pages = entry.detail?.pages ?? 0;

              return (
                <section
                  key={entry.book}
                  className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4"
                >
                  <header className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-tittle_Medium font-bold text-ink">
                        {entry.detail?.title ?? 'Book no longer available'}
                      </h2>
                      <p className="text-label_Medium text-ink-faint">
                        {target
                          ? `Target: page ${target.targetPage} by ${new Date(target.dueAt).toLocaleDateString()}`
                          : 'No target set'}
                      </p>
                    </div>

                    {(me?.role === 'owner' || entry.addedBy === myId) && (
                      <button
                        type="button"
                        aria-label="Remove this book from the group"
                        onClick={() => {
                          if (!window.confirm('Remove this book? The group loses access to it.'))
                            return;
                          act(
                            () => groupsApi.removeBook(groupId, entry.book),
                            'Could not remove the book.',
                          );
                        }}
                        className="text-ink-faint transition-colors hover:text-danger"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    )}
                  </header>

                  <ul className="flex flex-col gap-2">
                    {group.members.map((member) => {
                      const hidden = member.visible === false;
                      const read = positions.get(`${entry.book}:${member.user?._id}`) ?? 0;
                      const percent = pages > 0 && !hidden ? Math.min(100, (read / pages) * 100) : 0;
                      const status = target && !hidden ? targetStatus(target, read) : null;

                      return (
                        <li key={member.user?._id} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-label_Medium text-ink">
                              {member.user?._id === myId ? 'You' : (member.user?.username ?? 'Reader')}
                            </span>
                            {/* A member who has gone private still appears: the
                                group can see they are taking part, without
                                figures. Removing them would read as leaving. */}
                            {hidden ? (
                              <span className="flex items-center gap-1 text-label_Medium text-ink-faint">
                                <FiEyeOff size={12} /> Private
                              </span>
                            ) : (
                              <span
                                className={`text-label_Medium ${status?.onTrack ? 'text-success' : 'text-ink-faint'}`}
                              >
                                {status?.label ?? `Page ${read}`}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant">
                            <div
                              className="h-full rounded-full bg-brand transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {entry.detail && (
                    <button
                      type="button"
                      onClick={() => navigate(`/viewpdf/${entry.book}`)}
                      className="flex items-center justify-center gap-2 rounded-md bg-brand-wash py-2 text-label_Large font-semibold text-brand transition-colors hover:bg-brand/15"
                    >
                      <FiBookOpen size={14} /> Read
                    </button>
                  )}
                </section>
              );
            })
          )}
        </div>

        {/* The group itself: how to join it, the conversation, and the way out. */}
        <aside className="flex flex-col gap-4">
          <button
            type="button"
            onClick={onCopyCode}
            className="flex items-center justify-between gap-2 rounded-lg bg-brand-wash p-4 text-left transition-colors hover:bg-brand/15"
          >
            <span>
              <span className="block text-label_Medium text-brand">Invite code</span>
              <span className="block text-tittle_Medium font-bold tracking-[0.2em] text-brand">
                {group.inviteCode}
              </span>
            </span>
            <FiCopy className="text-brand" size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}/comments`)}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-4 text-body_Medium font-semibold text-ink transition-colors hover:bg-surface-variant"
          >
            <FiMessageSquare className="text-brand" size={16} /> Comments
          </button>

          <button
            type="button"
            onClick={() => setAdding((open) => !open)}
            aria-expanded={adding}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface p-4 text-body_Medium text-ink transition-colors hover:bg-surface-variant"
          >
            <FiPlus size={16} /> Add a book from your library
          </button>

          {adding && (
            <div className="flex flex-col gap-2">
              {addable.length === 0 ? (
                <p className="text-label_Medium text-ink-soft">
                  Every book in your library is already in this group.
                </p>
              ) : (
                addable.map((book) => (
                  <button
                    key={book._id}
                    type="button"
                    onClick={() =>
                      act(() => groupsApi.addBook(groupId, book._id), 'Could not add the book.').then(
                        () => setAdding(false),
                      )
                    }
                    className="rounded-md border border-line bg-surface p-2 text-left text-label_Large text-ink transition-colors hover:border-brand/40"
                  >
                    {book.title}
                  </button>
                ))
              )}
            </div>
          )}

          {/* The way back from joining-as-consent. */}
          <label className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4">
            <span>
              <span className="block text-label_Large font-semibold text-ink">Show my reading</span>
              <span className="block text-label_Medium text-ink-soft">
                {me?.visible === false
                  ? 'The group sees you as a member, without your pages.'
                  : 'The group can see how far you have read.'}
              </span>
            </span>
            <input
              type="checkbox"
              checked={me?.visible !== false}
              onChange={(event) =>
                act(
                  () => groupsApi.setVisibility(groupId, event.target.checked),
                  'Could not change this.',
                )
              }
              className="h-5 w-5 accent-[var(--brand)]"
            />
          </label>

          <button
            type="button"
            onClick={onLeave}
            className="flex items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-body_Medium font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            <FiLogOut size={16} />
            {me?.role === 'owner' ? 'Leave or delete group' : 'Leave group'}
          </button>
        </aside>
      </div>
    </div>
  );
}
