import { useCallback, useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiCheck,
  FiCopy,
  FiGlobe,
  FiLock,
  FiPlus,
  FiSearch,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { categoryLabel, communitiesApi, timeAgo } from '../../services/communities';
import { authInputClass } from '../../Util/authStyles';

/**
 * One community: a banner, six tabs, and whatever the reader's role lets them do.
 *
 * The tab lives in the query string rather than component state, so a link to a
 * particular tab works, the browser's back button steps between tabs, and a
 * refresh keeps you where you were.
 *
 * Each tab fetches only when it is first opened. A community has six panels and
 * loading all of them to show one would be five wasted requests on every visit.
 */

const TABS = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'groups', label: 'Groups' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'activities', label: 'Activities' },
  { id: 'members', label: 'Members' },
  { id: 'about', label: 'About' },
];

/** Ranks that may post announcements and create challenges. */
const canAdmin = (role) => role === 'owner' || role === 'admin';
const canModerate = (role) => canAdmin(role) || role === 'moderator';

export default function Community() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'announcements';

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setCommunity(await communitiesApi.get(communityId));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'That community is not available.');
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-44 animate-pulse rounded-xl bg-surface-variant" />
        <div className="h-10 animate-pulse rounded-lg bg-surface-variant" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-variant" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-body_Medium text-ink-soft">That community is not available.</p>
        <button type="button" onClick={() => navigate('/communities')} className="font-bold text-brand">
          Back to communities
        </button>
      </div>
    );
  }

  const role = community.myRole;

  return (
    <div className="flex flex-col gap-5">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-xl">
        <div className="relative flex h-44 items-end bg-brand">
          {community.logoUrl && (
            <img
              src={community.logoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* A dark wash, so white text holds over any cover image. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />

          <button
            type="button"
            onClick={() => navigate('/communities')}
            aria-label="Back to communities"
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          >
            <FiArrowLeft size={18} />
          </button>

          <div className="relative flex flex-col gap-1 p-5">
            <h1 className="flex items-center gap-2 text-headline_Small font-extrabold text-white">
              {community.name}
              {community.visibility === 'public' ? (
                <FiGlobe size={16} className="text-white/80" title="Public" />
              ) : (
                <FiLock size={16} className="text-white/80" title="Private" />
              )}
            </h1>
            <p className="flex items-center gap-3 text-label_Medium text-white/85">
              <span className="flex items-center gap-1">
                <FiUsers size={12} /> {community.memberCount ?? 0}{' '}
                {community.memberCount === 1 ? 'member' : 'members'}
              </span>
              <span>{categoryLabel(community.category)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line"
        role="tablist"
        aria-label="Community sections"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setParams({ tab: item.id }, { replace: true })}
              className={`shrink-0 border-b-2 px-4 py-3 text-label_Large transition-colors ${
                selected
                  ? 'border-brand font-semibold text-brand'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {item.label}
              {item.id === 'groups' && community.groupCount > 0 && ` (${community.groupCount})`}
            </button>
          );
        })}
      </div>

      {tab === 'announcements' && <Announcements communityId={communityId} role={role} />}
      {tab === 'groups' && <Groups communityId={communityId} role={role} />}
      {tab === 'challenges' && <Challenges communityId={communityId} role={role} />}
      {tab === 'activities' && <Activities communityId={communityId} />}
      {tab === 'members' && <Members communityId={communityId} role={role} />}
      {tab === 'about' && <About community={community} onChanged={load} />}
    </div>
  );
}

/* --------------------------------------------------------- announcements */

function Announcements({ communityId, role }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await communitiesApi.announcements(communityId));
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  const react = async (announcement, emoji) => {
    try {
      const { reactions } = await communitiesApi.reactToAnnouncement(
        communityId,
        announcement._id,
        emoji,
      );
      setItems((list) =>
        list.map((item) => (item._id === announcement._id ? { ...item, reactions } : item)),
      );
    } catch {
      toast.error('Could not save that reaction.');
    }
  };

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="flex flex-col gap-4">
      {canAdmin(role) && (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="flex items-center justify-center gap-2 self-start rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          <FiPlus size={16} /> New announcement
        </button>
      )}

      {items.length === 0 ? (
        <Empty
          title="No announcements yet"
          body={
            canAdmin(role)
              ? 'Announcements are how the whole community hears about a new book or a schedule.'
              : 'When the admins post something, it will appear here.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((announcement) => (
            <li
              key={announcement._id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-wash text-label_Large font-bold text-brand">
                  {announcement.authorName?.[0]?.toUpperCase() ?? 'A'}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-label_Large font-semibold text-ink">
                    {announcement.authorName}
                  </span>
                  <span className="text-label_Small text-ink-faint">
                    {timeAgo(announcement.createdAt)}
                  </span>
                </div>
                {announcement.pinned && (
                  <span className="rounded-full bg-brand-wash px-2 py-0.5 text-label_Small font-semibold text-brand">
                    Pinned
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-tittle_Medium font-bold text-brand">{announcement.title}</p>
                <p className="whitespace-pre-wrap text-body_Medium text-ink-soft">
                  {announcement.body}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['👏', '📚', '🔥'].map((emoji) => {
                  const found = announcement.reactions?.find((r) => r.emoji === emoji);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => react(announcement, emoji)}
                      aria-pressed={Boolean(found?.mine)}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-label_Medium transition-colors ${
                        found?.mine
                          ? 'border-brand bg-brand-wash text-brand'
                          : 'border-line text-ink-soft hover:bg-surface-variant'
                      }`}
                    >
                      <span aria-hidden="true">{emoji}</span>
                      {found?.count ? found.count : ''}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}

      {composing && (
        <Compose
          communityId={communityId}
          onClose={() => setComposing(false)}
          onPosted={() => {
            setComposing(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Compose({ communityId, onClose, onPosted }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setBusy(true);
    try {
      await communitiesApi.postAnnouncement(communityId, {
        title: title.trim(),
        body: body.trim(),
        pinned,
      });
      toast.success('Announcement posted. Everyone in the community has been notified.');
      onPosted();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not post that.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-surface p-6 shadow-overlay animate-[fadeIn_160ms_ease-out]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-tittle_Large font-bold text-ink">New announcement</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-ink-faint hover:bg-surface-variant hover:text-ink">
            <FiX size={18} />
          </button>
        </div>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New book for February"
          maxLength={140}
          autoFocus
          className={authInputClass(false)}
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What does the community need to know?"
          rows={5}
          maxLength={4000}
          className={`${authInputClass(false)} resize-none`}
        />

        <label className="flex items-center gap-2 text-label_Large text-ink-soft">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(event) => setPinned(event.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          Pin to the top
        </label>

        <p className="text-label_Medium text-ink-faint">
          Everyone in the community will be notified.
        </p>

        <button
          type="submit"
          disabled={busy || !title.trim() || !body.trim()}
          className="rounded-full bg-brand py-3 text-body_Medium font-bold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
        >
          {busy ? 'Posting…' : 'Post announcement'}
        </button>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------- groups */

function Groups({ communityId, role }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    communitiesApi
      .groups(communityId)
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [communityId]);

  if (loading) return <Skeleton rows={2} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-tittle_Large font-bold text-ink">
          {groups.length} Reading {groups.length === 1 ? 'Group' : 'Groups'}
        </h2>
        {canModerate(role) && (
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-label_Large font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            <FiPlus size={14} /> New Group
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <Empty
          title="No reading groups yet"
          body="A reading group is where a book, a schedule and the conversation about it live."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <li key={group._id}>
              <button
                type="button"
                onClick={() => navigate(`/groups/${group._id}`)}
                className="flex w-full flex-col gap-2 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-brand/40"
              >
                <span className="text-tittle_Medium font-bold text-ink">{group.name}</span>
                {group.description && (
                  <span className="line-clamp-2 text-label_Medium text-ink-soft">
                    {group.description}
                  </span>
                )}
                <span className="flex items-center justify-between gap-2">
                  <span className="text-label_Medium text-ink-faint">
                    {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'} ·{' '}
                    {group.bookCount} {group.bookCount === 1 ? 'book' : 'books'}
                  </span>
                  {group.joined && (
                    <span className="rounded-full bg-brand-wash px-3 py-1 text-label_Small font-semibold text-brand">
                      Joined
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ challenges */

function Challenges({ communityId, role }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setChallenges(await communitiesApi.challenges(communityId));
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async (challenge) => {
    setBusyId(challenge._id);
    try {
      await communitiesApi.joinChallenge(communityId, challenge._id);
      toast.success(`You have joined ${challenge.title}.`);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not join that challenge.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Skeleton rows={2} />;

  const active = challenges.find((challenge) => challenge.active);

  return (
    <div className="flex flex-col gap-4">
      {/* The running challenge leads, as in the designs. */}
      {active && (
        <div className="flex items-center gap-3 rounded-xl bg-warning p-4 text-white">
          <span className="text-2xl" aria-hidden="true">
            🔥
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-label_Medium font-semibold uppercase tracking-wide">
              Active challenge
            </span>
            <span className="truncate text-tittle_Medium font-bold">{active.title}</span>
          </div>
        </div>
      )}

      {challenges.length === 0 ? (
        <Empty
          title="No challenges yet"
          body={
            canModerate(role)
              ? 'A challenge gives the community something to do together for a few weeks.'
              : 'When the admins start one, it will appear here.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {challenges.map((challenge) => (
            <li
              key={challenge._id}
              className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-tittle_Medium font-bold text-ink">{challenge.title}</p>
                {challenge.active && (
                  <span className="shrink-0 rounded-full bg-success/15 px-3 py-1 text-label_Small font-semibold text-success">
                    Active
                  </span>
                )}
              </div>
              {challenge.description && (
                <p className="text-body_Medium text-ink-soft">{challenge.description}</p>
              )}
              <p className="flex flex-wrap items-center gap-3 text-label_Medium text-ink-faint">
                <span className="flex items-center gap-1">
                  <FiUsers size={12} /> {challenge.participantCount ?? 0}
                </span>
                <span>
                  {new Date(challenge.startsAt).toLocaleDateString()} –{' '}
                  {new Date(challenge.endsAt).toLocaleDateString()}
                </span>
              </p>

              {challenge.joined ? (
                <p className="flex items-center gap-1 text-label_Large font-semibold text-success">
                  <FiCheck size={14} /> You are taking part
                  {challenge.myProgress?.daysActive?.length
                    ? ` · ${challenge.myProgress.daysActive.length} days read`
                    : ''}
                </p>
              ) : (
                challenge.active && (
                  <button
                    type="button"
                    onClick={() => join(challenge)}
                    disabled={busyId === challenge._id}
                    className="self-start rounded-full bg-brand px-5 py-2 text-label_Large font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
                  >
                    {busyId === challenge._id ? 'Joining…' : 'Join challenge'}
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ activities */

function Activities({ communityId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    communitiesApi
      .activity(communityId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [communityId]);

  if (loading) return <Skeleton rows={4} />;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-tittle_Large font-bold text-ink">What's happening</h2>

      {items.length === 0 ? (
        <Empty
          title="Nothing yet"
          body="Finishing books, joining groups and starting challenges all show up here."
        />
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li
              key={item._id}
              className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-variant text-label_Medium font-bold text-ink-soft">
                {item.actorName?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body_Medium text-ink">
                  <strong className="font-semibold">{item.actorName}</strong>{' '}
                  {describeActivity(item)}
                </span>
                <span className="text-label_Small text-ink-faint">{timeAgo(item.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Reads as a sentence, rather than exposing the event name. */
function describeActivity(item) {
  switch (item.type) {
    case 'BOOK_COMPLETED':
      return `completed ${item.subject ?? 'a book'}`;
    case 'GROUP_JOINED':
      return `joined ${item.subject ?? 'a reading group'}`;
    case 'GROUP_CREATED':
      return `started ${item.subject ?? 'a reading group'}`;
    case 'CHALLENGE_JOINED':
      return `joined ${item.subject ?? 'a challenge'}`;
    case 'CHALLENGE_COMPLETED':
      return `completed ${item.subject ?? 'a challenge'}`;
    case 'STREAK_MILESTONE':
      return `reached ${item.subject ?? 'a reading streak'}`;
    case 'MEMBER_JOINED':
      return 'joined the community';
    case 'ANNOUNCEMENT_POSTED':
      return `posted ${item.subject ?? 'an announcement'}`;
    default:
      return 'did something';
  }
}

/* --------------------------------------------------------------- members */

function Members({ communityId, role }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    communitiesApi
      .members(communityId, query)
      .then((list) => {
        setMembers(list);
        setError('');
      })
      .catch((err) => setError(err?.response?.data?.message || 'Could not load the members.'))
      .finally(() => setLoading(false));
  }, [communityId, query]);

  if (loading) return <Skeleton rows={4} />;
  if (error) return <Empty title="Member list unavailable" body={error} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-[46px] items-center gap-3 rounded-[11px] border border-line bg-surface px-4 focus-within:border-brand">
        <FiSearch size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search members"
          aria-label="Search members"
          className="min-w-0 flex-1 bg-transparent text-body_Medium text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      <ul className="flex flex-col">
        {members.map((member) => (
          <li
            key={member._id}
            className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-wash text-label_Large font-bold text-brand">
              {member.user?.username?.[0]?.toUpperCase() ?? '?'}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label_Large font-semibold text-ink">
                {member.user?.username ?? 'Reader'}
              </span>
              <span className="text-label_Small text-ink-faint">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </span>
            </span>
            {member.role !== 'member' && (
              <span className="shrink-0 rounded-full bg-warning/15 px-3 py-1 text-label_Small font-semibold capitalize text-warning">
                {member.role}
              </span>
            )}
          </li>
        ))}
      </ul>

      {canAdmin(role) && <JoinRequests communityId={communityId} />}
    </div>
  );
}

function JoinRequests({ communityId }) {
  const [requests, setRequests] = useState([]);

  const load = useCallback(() => {
    communitiesApi
      .joinRequests(communityId)
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [communityId]);

  useEffect(() => {
    load();
  }, [load]);

  if (requests.length === 0) return null;

  const decide = async (request, approve) => {
    try {
      await communitiesApi.decideRequest(communityId, request._id, approve);
      toast.success(approve ? 'Request approved.' : 'Request declined.');
      load();
    } catch {
      toast.error('Could not save that decision.');
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <h3 className="text-tittle_Medium font-bold text-ink">
        {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
      </h3>
      {requests.map((request) => (
        <div key={request._id} className="flex items-center gap-3">
          <span className="flex-1 truncate text-label_Large text-ink">
            {request.user?.username ?? 'A reader'}
          </span>
          <button
            type="button"
            onClick={() => decide(request, true)}
            className="rounded-full bg-brand px-4 py-1.5 text-label_Medium font-semibold text-white hover:bg-brand-strong"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => decide(request, false)}
            className="rounded-full border border-line px-4 py-1.5 text-label_Medium text-ink-soft hover:bg-surface-variant"
          >
            Decline
          </button>
        </div>
      ))}
    </section>
  );
}

/* ----------------------------------------------------------------- about */

function About({ community, onChanged }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = community.inviteCode
    ? `${window.location.origin}/communities/join/${community.inviteCode}`
    : null;

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`${label} copied.`);
    } catch {
      // Clipboard access is refused in some browsers without a gesture they
      // recognise. The value is on screen either way.
      toast.info(value);
    }
  };

  const rotate = async () => {
    if (!window.confirm('Rotate the invite code? The current link and code stop working.')) return;
    try {
      await communitiesApi.rotateInvite(community._id);
      toast.success('A new invite code has been generated.');
      onChanged();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not rotate the code.');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-label_Medium font-semibold uppercase tracking-wide text-ink-faint">
          About
        </h2>
        <p className="text-body_Medium text-ink-soft">
          {community.description || 'This community has not written a description yet.'}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Fact label="Category" value={categoryLabel(community.category)} />
        <Fact label="Visibility" value={community.visibility === 'public' ? 'Public' : 'Private'} />
        <Fact label="Members" value={String(community.memberCount ?? 0)} />
        <Fact label="Groups" value={String(community.groupCount ?? 0)} />
      </div>

      {inviteLink && (
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <h2 className="text-label_Medium font-semibold uppercase tracking-wide text-ink-faint">
            Invite members
          </h2>

          <div className="flex items-center gap-2">
            <input
              readOnly
              value={inviteLink}
              aria-label="Invite link"
              onFocus={(event) => event.target.select()}
              className={`${authInputClass(false)} flex-1 text-label_Medium`}
            />
            <button
              type="button"
              onClick={() => copy(inviteLink, 'Invite link')}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-brand px-5 py-3 text-label_Large font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/*
              The QR is drawn from the invite link by a public chart service at
              render time, so there is no image to store and nothing to
              regenerate when the code is rotated.
            */}
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(inviteLink)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line py-3 text-center text-label_Large font-semibold text-ink transition-colors hover:bg-surface-variant"
            >
              QR Code
            </a>
            <button
              type="button"
              onClick={() => copy(community.inviteCode, 'Invite code')}
              className="rounded-lg border border-line py-3 text-center text-label_Large font-semibold text-ink transition-colors hover:bg-surface-variant"
            >
              Code: {community.inviteCode}
            </button>
          </div>

          {/*
            Rotation is an admin's power, not a member's.

            Any member may invite -- that is the point of the link -- but
            rotating it invalidates everyone else's, so the control is shown
            only to those the server will actually let do it. Rendering a
            button that is certain to come back 403 is worse than not
            rendering it.
          */}
          {canAdmin(community.myRole) && (
            <button
              type="button"
              onClick={rotate}
              className="self-start text-label_Medium text-ink-faint underline transition-colors hover:text-danger"
            >
              Rotate the invite code
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
      <span className="text-tittle_Medium font-bold text-ink">{value}</span>
      <span className="text-label_Medium text-ink-faint">{label}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- shared */

function Skeleton({ rows }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-xl bg-surface-variant" />
      ))}
    </div>
  );
}

function Empty({ title, body }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line p-8 text-center">
      <p className="text-tittle_Medium font-bold text-ink">{title}</p>
      <p className="max-w-md text-body_Medium text-ink-soft">{body}</p>
    </div>
  );
}
