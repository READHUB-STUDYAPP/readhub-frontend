import { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiCornerUpLeft, FiSend, FiTrash2, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { groupsApi } from '../../services/groups';

/** Short, relative, and never a date for something said minutes ago. */
function when(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString();
}

/**
 * A group's conversation.
 *
 * Oldest at the top and newest at the bottom, as a conversation is read, with
 * older pages loaded above. On the web there is no keyboard pushing the view
 * about, so a normal column is right here -- the phone app inverts its list for
 * that reason and this does not need to.
 *
 * A withdrawn comment keeps its place as a line saying so, and a comment whose
 * author has left or deleted their account keeps their name. Both are the
 * server's doing; the screen only has to render them honestly.
 */
export default function GroupComments() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [groupName, setGroupName] = useState('');

  const bottom = useRef(null);
  const myId = localStorage.getItem('userId');

  const load = useCallback(
    async (before) => {
      const page = await groupsApi.messages(groupId, { before });

      setHasMore(page.hasMore);
      // The API answers newest first; reversed once here so the column reads
      // in the order a conversation happens.
      setMessages((current) =>
        before ? [...page.messages.slice().reverse(), ...current] : page.messages.slice().reverse(),
      );
    },
    [groupId],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [group] = await Promise.all([groupsApi.get(groupId), load()]);
        if (!cancelled) setGroupName(group?.name ?? 'Comments');
      } catch (error) {
        if (!cancelled) toast.error(error?.response?.data?.message || 'Could not load comments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupId, load]);

  const onSend = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    // Cleared first: a comment left in the box while the request is in flight
    // invites a second click and a duplicate.
    setDraft('');
    const replyTo = replyingTo?._id;
    setReplyingTo(null);
    setSending(true);

    try {
      await groupsApi.postMessage(groupId, { body, replyTo });
      await load();
      bottom.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      // Put it back rather than lose what they wrote.
      setDraft(body);
      toast.error(error?.response?.data?.message || 'Could not post the comment.');
    } finally {
      setSending(false);
    }
  };

  const onRemove = async (message) => {
    if (
      !window.confirm(
        'Remove this comment? It will show as removed, and replies to it stay so the conversation still makes sense.',
      )
    ) {
      return;
    }

    try {
      await groupsApi.deleteMessage(groupId, message._id);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not remove the comment.');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(`/groups/${groupId}`)}
          aria-label="Back to the group"
          className="text-ink-soft transition-colors hover:text-ink"
        >
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-tittle_Large font-extrabold text-ink">{groupName}</h1>
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => load(messages[0]?.createdAt)}
          className="self-center rounded-full border border-line px-4 py-1.5 text-label_Medium text-ink-soft transition-colors hover:bg-surface-variant"
        >
          Load earlier comments
        </button>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-16 animate-pulse rounded-lg bg-surface-variant" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line p-8 text-center">
          <p className="text-tittle_Medium font-bold text-ink">No comments yet</p>
          <p className="text-label_Medium text-ink-soft">
            Say what you made of the book, or ask the group a question.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {messages.map((message) => {
            const mine = Boolean(myId) && message.author === myId;
            const gone = message.authorDeleted;
            const left = !message.authorIsMember && !gone;

            return (
              <li
                key={message._id}
                className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4 animate-[fadeIn_200ms_ease-out]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-label_Large font-semibold text-ink">
                    {mine ? 'You' : message.authorName}
                  </span>

                  {/* Said plainly, because it explains why they are not replying. */}
                  {(gone || left) && (
                    <span className="text-label_Medium text-ink-faint">
                      {gone ? 'account deleted' : 'left the group'}
                    </span>
                  )}

                  <span className="ml-auto text-label_Medium text-ink-faint">
                    {when(message.createdAt)}
                    {message.editedAt ? ' · edited' : ''}
                  </span>
                </div>

                {/* The comment being answered, quoted so a reply reads on its own. */}
                {message.replyTo && (
                  <p className="border-l-2 border-line pl-2 text-label_Medium text-ink-faint">
                    {message.replyTo.deleted
                      ? `${message.replyTo.authorName}: comment removed`
                      : `${message.replyTo.authorName}: ${message.replyTo.body ?? ''}`}
                  </p>
                )}

                {message.deleted ? (
                  <p className="text-body_Medium italic text-ink-faint">Comment removed</p>
                ) : (
                  <p className="whitespace-pre-wrap text-body_Medium text-ink">{message.body}</p>
                )}

                <div className="mt-1 flex items-center gap-4">
                  {!message.deleted && (
                    <button
                      type="button"
                      onClick={() => setReplyingTo(message)}
                      className="flex items-center gap-1 text-label_Medium text-ink-faint transition-colors hover:text-brand"
                    >
                      <FiCornerUpLeft size={13} /> Reply
                    </button>
                  )}

                  {message.replyCount > 0 && (
                    <span className="text-label_Medium text-ink-faint">
                      {`${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}`}
                    </span>
                  )}

                  {mine && !message.deleted && (
                    <button
                      type="button"
                      onClick={() => onRemove(message)}
                      aria-label="Remove this comment"
                      className="ml-auto text-ink-faint transition-colors hover:text-danger"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div ref={bottom} />

      {/* What is being replied to, so the reply is never ambiguous. */}
      {replyingTo && (
        <div className="flex items-center gap-2 rounded-md bg-surface-variant px-4 py-2">
          <span className="flex-1 truncate text-label_Medium text-ink-soft">
            {`Replying to ${replyingTo.authorName}`}
          </span>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
            className="text-ink-faint transition-colors hover:text-ink"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      <form
        onSubmit={onSend}
        className="sticky bottom-0 flex items-end gap-2 border-t border-line bg-page py-4"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={replyingTo ? 'Write a reply' : 'Write a comment'}
          rows={2}
          maxLength={2000}
          className="flex-1 resize-none rounded-md border border-line bg-surface px-4 py-2.5 text-body_Medium text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Post comment"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-ink-on-brand transition-colors hover:bg-brand-strong disabled:opacity-50"
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}
