import { useCallback, useEffect, useState } from 'react';
import {
  FiBookOpen,
  FiCheck,
  FiChevronRight,
  FiShare2,
  FiUserPlus,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  DISCOVER_FILTERS,
  PACE_LABELS,
  PURPOSE_LABELS,
  TIME_LABELS,
  buddiesApi,
  labelFor,
  timeAgo,
} from '../../services/buddies';
import BuddyProfileForm from './BuddyProfileForm';

/**
 * The Reading Buddy home.
 *
 * One screen with three jobs, because they are three states of the same
 * relationship rather than three features: who you read with, who you could
 * read with, and who is waiting on an answer. Splitting them across routes
 * would mean a reader with one pending request has to go looking for it.
 *
 * A reader without a profile sees none of that. They see what the feature is
 * and one way in -- section 6's rule that the profile comes before discovery,
 * since there is nothing to match on until it exists.
 */
export default function Buddies() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [state, setState] = useState({ loading: true, profile: null, limits: null });
  const [buddies, setBuddies] = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [filter, setFilter] = useState('recommended');
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const tab = params.get('tab') ?? 'buddies';
  const setTab = (next) => setParams({ tab: next }, { replace: true });

  const loadProfile = useCallback(async () => {
    try {
      const data = await buddiesApi.myProfile();
      setState({ loading: false, profile: data.profile, limits: data.limits, usage: data.usage });
      return data.profile;
    } catch {
      setState({ loading: false, profile: null, limits: null });
      return null;
    }
  }, []);

  const loadBuddies = useCallback(async () => {
    try {
      setBuddies((await buddiesApi.mine()).buddies);
    } catch {
      setBuddies([]);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setRequests(await buddiesApi.requests());
    } catch {
      setRequests({ incoming: [], outgoing: [] });
    }
  }, []);

  const loadDiscover = useCallback(async () => {
    try {
      setDiscovered((await buddiesApi.discover({ filter })).results ?? []);
    } catch {
      // A reader with no profile gets a 409 here, which the gate above already
      // handles -- there is nothing useful to say twice.
      setDiscovered([]);
    }
  }, [filter]);

  useEffect(() => {
    (async () => {
      const profile = await loadProfile();
      if (profile) await Promise.all([loadBuddies(), loadRequests(), loadDiscover()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.profile && tab === 'discover') void loadDiscover();
  }, [filter, tab, state.profile, loadDiscover]);

  const onSaved = async () => {
    setEditing(false);
    const profile = await loadProfile();
    if (profile) await Promise.all([loadBuddies(), loadRequests(), loadDiscover()]);
  };

  const onRespond = async (request, accept) => {
    setBusyId(request._id);
    try {
      await buddiesApi.respond(request._id, accept);
      toast.success(accept ? 'You have a new reading buddy.' : 'Request declined.');
      await Promise.all([loadRequests(), loadBuddies(), loadProfile()]);
      if (accept) setTab('buddies');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not answer that request.');
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = async (request) => {
    setBusyId(request._id);
    try {
      await buddiesApi.cancelRequest(request._id);
      await loadRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not withdraw that request.');
    } finally {
      setBusyId(null);
    }
  };

  /* ------------------------------------------------------------ loading */

  if (state.loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-variant" />
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-24 animate-pulse rounded-xl bg-surface-variant" />
        ))}
      </div>
    );
  }

  /* ------------------------------------------- no profile: the way in */

  if (!state.profile || editing) {
    return (
      <BuddyProfileForm
        profile={state.profile}
        onSaved={onSaved}
        onCancel={state.profile ? () => setEditing(false) : null}
      />
    );
  }

  const pending = requests.incoming.length;

  const TABS = [
    { value: 'buddies', label: 'My Buddies', count: buddies.length },
    { value: 'discover', label: 'Find a Buddy' },
    { value: 'requests', label: 'Requests', count: pending },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline_Small font-extrabold text-ink">Reading Buddy</h1>
          <p className="text-body_Small text-ink-soft">
            Read with someone. Keep each other going.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <InviteAFriend userId={state.profile?.user} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-line px-4 py-2 text-body_Small font-semibold text-ink transition-colors hover:bg-surface-variant"
          >
            Edit my buddy profile
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Reading Buddy" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-body_Small font-semibold transition-colors ${
              tab === item.value
                ? 'bg-brand text-white'
                : 'border border-line text-ink-soft hover:bg-surface-variant'
            }`}
          >
            {item.label}
            {item.count > 0 && (
              <span
                className={`rounded-full px-2 text-label_Small ${
                  tab === item.value ? 'bg-white/25' : 'bg-brand-wash text-brand-strong'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------ my buddies */}
      {tab === 'buddies' && (
        <section className="flex flex-col gap-3">
          {buddies.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line p-8 text-center">
              <FiUsers size={24} className="text-ink-faint" />
              <p className="text-body_Medium text-ink-soft">
                You do not have a reading buddy yet.
              </p>
              <button
                type="button"
                onClick={() => setTab('discover')}
                className="rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong"
              >
                Find a buddy
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {buddies.map((row) => (
                <li key={row._id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/buddies/${row._id}`)}
                    className="flex w-full items-center gap-4 rounded-xl border border-line p-4 text-left transition-colors hover:bg-surface-variant"
                  >
                    <Avatar user={row.buddy} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-body_Large font-semibold text-ink">
                        {row.buddy?.username ?? 'A reader'}
                      </span>
                      <span className="truncate text-body_Small text-ink-soft">
                        {row.currentRead
                          ? `Reading ${row.currentRead.bookTitle}`
                          : 'No shared book yet — pick one together'}
                      </span>
                      {row.completedReads > 0 && (
                        <span className="text-label_Small text-ink-faint">
                          {row.completedReads} finished together
                        </span>
                      )}
                    </span>
                    <FiChevronRight className="shrink-0 text-ink-faint" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {state.limits && buddies.length >= state.limits.activeBuddies && (
            <p className="rounded-xl bg-surface-variant p-4 text-body_Small text-ink-soft">
              You have {buddies.length === 1 ? 'a reading buddy' : `${buddies.length} reading buddies`},
              which is the most you can have at once. End one to start another.
            </p>
          )}
        </section>
      )}

      {/* --------------------------------------------------------- discover */}
      {tab === 'discover' && (
        <section className="flex flex-col gap-4">
          <div role="group" aria-label="Filter recommendations" className="flex gap-2 overflow-x-auto pb-1">
            {DISCOVER_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-body_Small font-medium transition-colors ${
                  filter === item.value
                    ? 'bg-brand-wash text-brand-strong'
                    : 'border border-line text-ink-soft hover:bg-surface-variant'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {discovered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line p-8 text-center">
              <FiUserPlus size={24} className="text-ink-faint" />
              <p className="text-body_Medium text-ink-soft">
                No one to suggest here yet. Try another filter, or come back once more readers
                have joined.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {discovered.map((person) => (
                <li key={person.user._id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/buddies/u/${person.user._id}`)}
                    className="flex h-full w-full flex-col gap-3 rounded-xl border border-line p-4 text-left transition-colors hover:bg-surface-variant"
                  >
                    <span className="flex items-center gap-3">
                      <Avatar user={person.user} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-body_Large font-semibold text-ink">
                          {person.user.username}
                        </span>
                        <span className="text-label_Small text-ink-faint">
                          Active {timeAgo(person.lastActiveAt)}
                        </span>
                      </span>
                      <MatchBadge score={person.match?.score} />
                    </span>

                    {person.match?.explanation && (
                      <span className="text-body_Small text-ink-soft">{person.match.explanation}</span>
                    )}

                    <span className="flex flex-wrap gap-1.5">
                      <Chip>{labelFor(PURPOSE_LABELS, person.purpose)}</Chip>
                      <Chip>{labelFor(TIME_LABELS, person.preferredTime)}</Chip>
                      <Chip>{labelFor(PACE_LABELS, person.pace)} pace</Chip>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* --------------------------------------------------------- requests */}
      {tab === 'requests' && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-tittle_Large font-bold text-ink">Waiting for your answer</h2>
            {requests.incoming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-6 text-center text-body_Small text-ink-soft">
                No one is waiting on you.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {requests.incoming.map((request) => (
                  <li
                    key={request._id}
                    className="flex flex-col gap-3 rounded-xl border border-line p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar user={request.from} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <button
                          type="button"
                          onClick={() => navigate(`/buddies/u/${request.from?._id}`)}
                          className="truncate text-left text-body_Large font-semibold text-ink hover:underline"
                        >
                          {request.from?.username ?? 'A reader'}
                        </button>
                        <span className="text-label_Small text-ink-faint">
                          {timeAgo(request.createdAt)}
                          {typeof request.matchScore === 'number' && ` · ${request.matchScore}% match`}
                        </span>
                      </div>
                    </div>

                    {request.message && (
                      <p className="rounded-lg bg-surface-variant p-3 text-body_Small text-ink-soft">
                        {request.message}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === request._id}
                        onClick={() => onRespond(request, true)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-body_Small font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
                      >
                        <FiCheck /> Accept
                      </button>
                      <button
                        type="button"
                        disabled={busyId === request._id}
                        onClick={() => onRespond(request, false)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-body_Small font-semibold text-ink-soft transition-colors hover:bg-surface-variant disabled:opacity-60"
                      >
                        <FiX /> Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-tittle_Large font-bold text-ink">Sent</h2>
            {requests.outgoing.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-6 text-center text-body_Small text-ink-soft">
                You have not asked anyone yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {requests.outgoing.map((request) => (
                  <li
                    key={request._id}
                    className="flex items-center gap-3 rounded-xl border border-line p-4"
                  >
                    <Avatar user={request.to} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-body_Medium font-semibold text-ink">
                        {request.to?.username ?? 'A reader'}
                      </span>
                      <span className="text-label_Small text-ink-faint">
                        Waiting · {timeAgo(request.createdAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === request._id}
                      onClick={() => onCancel(request)}
                      className="shrink-0 rounded-full border border-line px-3 py-1.5 text-body_Small text-ink-soft transition-colors hover:bg-surface-variant disabled:opacity-60"
                    >
                      Withdraw
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- pieces */

function Avatar({ user }) {
  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-wash text-body_Large font-bold text-brand-strong">
      {(user?.username ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full bg-surface-variant px-2.5 py-1 text-label_Small text-ink-soft">
      {children}
    </span>
  );
}

/**
 * The percentage, as a badge.
 *
 * Shown only above a threshold. A "12% match" is not information a reader can
 * act on -- it just makes the person it is attached to look like a bad idea,
 * which is unkind to someone who has done nothing except fill in a form.
 */
function MatchBadge({ score }) {
  if (typeof score !== 'number' || score < 30) return null;
  return (
    <span className="shrink-0 rounded-full bg-brand-wash px-2.5 py-1 text-label_Small font-bold text-brand-strong">
      {score}%
    </span>
  );
}

/**
 * Share a link that brings someone into Reading Buddy.
 *
 * The link is the sharer's own public buddy profile. That is deliberate: a
 * referral link to a sign-up page gets you an account, whereas a link to a
 * person gets you the pair — whoever follows it arrives at a real reader with
 * a reason to connect, and the Send request button is already there. More
 * people to match with is the point, and a match needs two named people.
 *
 * Uses the platform share sheet where there is one, because that is how a
 * phone sends a link to WhatsApp. Falls back to the clipboard, and then to
 * showing the link so it can be copied by hand — a share button that silently
 * does nothing is worse than no button.
 */
function InviteAFriend({ userId }) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState('');

  if (!userId) return null;

  const link = `${window.location.origin}/buddies/u/${userId}`;
  const text = 'Read with me on ReadHub — we can set a book and keep each other going.';

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Be my reading buddy', text, url: link });
        return;
      } catch (error) {
        // A cancelled share is not a failure; anything else falls through.
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Invite link copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShown(link);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onShare}
        className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-body_Small font-semibold text-white transition-colors hover:bg-brand-strong"
      >
        <FiShare2 size={14} />
        {copied ? 'Link copied' : 'Invite a friend'}
      </button>

      {shown && (
        <label className="flex w-full items-center gap-2">
          <span className="sr-only">Invite link</span>
          <input
            readOnly
            value={shown}
            onFocus={(event) => event.target.select()}
            className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2 text-body_Small text-ink-soft"
          />
        </label>
      )}
    </>
  );
}
