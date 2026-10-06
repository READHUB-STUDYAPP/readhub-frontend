import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiUsers, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  COMMUNITY_CATEGORIES,
  DISCOVER_FILTERS,
  categoryLabel,
  communitiesApi,
} from '../../services/communities';
import { authInputClass } from '../../Util/authStyles';

/**
 * The communities screen: the reader's own above, everything else below.
 *
 * Two lists rather than one, because they answer different questions -- "where
 * do I read" and "where could I read". Mixing them would make the second push
 * the first off the screen as the platform grows.
 */
export default function Communities() {
  const navigate = useNavigate();

  const [mine, setMine] = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const loadMine = useCallback(async () => {
    try {
      setMine(await communitiesApi.mine());
    } catch {
      // The empty state below says it plainly; a toast on arrival is noise.
      setMine([]);
    }
  }, []);

  const loadDiscover = useCallback(async () => {
    try {
      setDiscovered(await communitiesApi.discover({ q: query, category: filter }));
    } catch {
      setDiscovered([]);
    }
  }, [query, filter]);

  useEffect(() => {
    Promise.all([loadMine(), loadDiscover()]).finally(() => setLoading(false));
    // Discover reloads on its own when the filter or query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced, so typing a name is one request rather than one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => void loadDiscover(), 300);
    return () => clearTimeout(timer);
  }, [loadDiscover]);

  const onJoin = async (community) => {
    setJoiningId(community._id);
    try {
      const result = await communitiesApi.join({ communityId: community._id });
      if (result.status === 202) {
        toast.info('Your request has been sent to the admins.');
        setDiscovered((list) => list.filter((item) => item._id !== community._id));
      } else {
        toast.success(`You have joined ${community.name}.`);
        await Promise.all([loadMine(), loadDiscover()]);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not join that community.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-headline_Small font-extrabold text-ink">Communities</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          aria-label="Create a community"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-strong"
        >
          <FiPlus size={20} />
        </button>
      </header>

      {/* My Communities */}
      <section className="flex flex-col gap-4">
        <h2 className="text-tittle_Large font-bold text-ink">My Communities</h2>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((key) => (
              <div key={key} className="h-24 animate-pulse rounded-xl bg-surface-variant" />
            ))}
          </div>
        ) : mine.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line p-8 text-center">
            <FiUsers size={24} className="text-ink-faint" />
            <p className="text-body_Medium text-ink-soft">
              You are not a member of any community yet. Create one, or find one below.
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              Create a community
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.map((community) => (
              <li key={community._id}>
                <button
                  type="button"
                  onClick={() => navigate(`/communities/${community._id}`)}
                  className="flex w-full items-start gap-4 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-brand/40"
                >
                  <Avatar community={community} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-tittle_Medium font-bold text-ink">{community.name}</span>
                      {community.myRole && community.myRole !== 'member' && (
                        <span className="rounded-full bg-brand-wash px-2 py-0.5 text-label_Small font-semibold uppercase tracking-wide text-brand">
                          {community.myRole}
                        </span>
                      )}
                    </span>
                    {community.description && (
                      <span className="line-clamp-2 text-label_Medium text-ink-soft">
                        {community.description}
                      </span>
                    )}
                    <span className="flex flex-wrap items-center gap-3 text-label_Medium text-ink-faint">
                      <span className="flex items-center gap-1">
                        <FiUsers size={12} /> {community.memberCount ?? 0}{' '}
                        {community.memberCount === 1 ? 'member' : 'members'}
                      </span>
                      <span>{categoryLabel(community.category)}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Discover */}
      <section className="flex flex-col gap-4">
        <h2 className="text-tittle_Large font-bold text-ink">Discover Communities</h2>

        <div className="flex h-[46px] items-center gap-3 rounded-[11px] border border-line bg-surface px-4 focus-within:border-brand">
          <FiSearch size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search communities"
            aria-label="Search communities"
            className="min-w-0 flex-1 bg-transparent text-body_Medium text-ink outline-none placeholder:text-ink-faint"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-ink-faint transition-colors hover:bg-surface-variant hover:text-ink"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
          {DISCOVER_FILTERS.map((option) => {
            const selected = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={selected}
                className={`shrink-0 rounded-full px-4 py-2 text-label_Large transition-colors ${
                  selected
                    ? 'bg-brand font-semibold text-white'
                    : 'bg-surface text-ink-soft hover:bg-surface-variant hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {discovered.length === 0 ? (
          <p className="text-body_Medium text-ink-soft">
            {query || filter !== 'all'
              ? 'No communities match that search yet.'
              : 'No public communities to show yet. Create the first one.'}
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {discovered.map((community) => (
              <li
                key={community._id}
                className="flex flex-col gap-3 overflow-hidden rounded-xl border border-line bg-surface"
              >
                <div className="flex items-start gap-3 p-4 pb-0">
                  <Avatar community={community} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-tittle_Medium font-bold text-ink">{community.name}</p>
                    <p className="text-label_Medium text-ink-faint">
                      {categoryLabel(community.category)}
                    </p>
                  </div>
                </div>
                {community.description && (
                  <p className="line-clamp-2 px-4 text-label_Medium text-ink-soft">
                    {community.description}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 p-4 pt-0">
                  <span className="flex items-center gap-1 text-label_Medium text-ink-faint">
                    <FiUsers size={12} /> {community.memberCount ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => onJoin(community)}
                    disabled={joiningId === community._id}
                    className="rounded-full bg-brand px-5 py-2 text-label_Large font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
                  >
                    {joiningId === community._id ? 'Joining…' : 'Join'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {creating && (
        <CreateCommunity
          onClose={() => setCreating(false)}
          onCreated={(community) => {
            setCreating(false);
            navigate(`/communities/${community._id}`);
          }}
        />
      )}
    </div>
  );
}

/** The logo, or the initial when there is none. */
function Avatar({ community }) {
  if (community.logoUrl) {
    return (
      <img
        src={community.logoUrl}
        alt=""
        className="h-14 w-14 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-wash text-tittle_Large font-bold text-brand">
      {community.name?.[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

function CreateCommunity({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('book-club');
  const [visibility, setVisibility] = useState('public');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    setBusy(true);
    try {
      const community = await communitiesApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        visibility,
        // A public community people can find should also be one they can enter;
        // a private one is reached with a code.
        joinPolicy: visibility === 'public' ? 'open' : 'invite',
      });
      toast.success('Community created.');
      onCreated(community);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not create the community.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-surface p-6 shadow-overlay animate-[fadeIn_160ms_ease-out]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-tittle_Large font-bold text-ink">New community</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-ink-faint transition-colors hover:bg-surface-variant hover:text-ink"
          >
            <FiX size={18} />
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-label_Medium text-ink-soft">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="UNILAG Readers"
            maxLength={80}
            autoFocus
            className={authInputClass(false)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-label_Medium text-ink-soft">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Who is this community for?"
            rows={3}
            maxLength={500}
            className={`${authInputClass(false)} resize-none`}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-label_Medium text-ink-soft">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={authInputClass(false)}
          >
            {COMMUNITY_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-label_Medium text-ink-soft">Who can find it</legend>
          <div className="flex gap-2">
            {[
              { value: 'public', label: 'Public', hint: 'Anyone can find and join' },
              { value: 'private', label: 'Private', hint: 'Only with a code' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setVisibility(option.value)}
                aria-pressed={visibility === option.value}
                className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
                  visibility === option.value
                    ? 'border-brand bg-brand-wash'
                    : 'border-line hover:bg-surface-variant'
                }`}
              >
                <span className="block text-label_Large font-semibold text-ink">{option.label}</span>
                <span className="block text-label_Small text-ink-faint">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-full bg-brand py-3 text-body_Medium font-bold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create community'}
        </button>
      </form>
    </div>
  );
}
