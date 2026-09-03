import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { groupsApi } from '../../services/groups';
import { authInputClass } from '../../Util/authStyles';

/**
 * The reader's groups.
 *
 * Creating and joining are forms that open in place rather than screens of
 * their own -- two fields between them, and a page each would be more
 * navigation than content.
 *
 * The grid is one column on a phone and two from the medium breakpoint, so a
 * desktop browser is not a phone layout with empty margins either side.
 */
export default function Groups() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState('none');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroups(await groupsApi.list());
    } catch {
      // The empty state below says it plainly; a toast on every failed load of
      // a screen the reader just opened is noise.
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setBusy(true);
    try {
      const group = await groupsApi.create({ name: trimmed });
      setName('');
      setPanel('none');
      navigate(`/groups/${group._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not create the group.');
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setBusy(true);
    try {
      const group = await groupsApi.join(trimmed);
      setCode('');
      setPanel('none');
      navigate(`/groups/${group._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline_Small font-extrabold text-ink">Reading Groups</h1>
        <p className="text-body_Medium text-ink-soft">
          Read a book alongside a few other people, with a schedule to keep to. Anyone can start
          one.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPanel(panel === 'create' ? 'none' : 'create')}
          aria-expanded={panel === 'create'}
          className="flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-body_Medium font-semibold text-ink-on-brand transition-colors hover:bg-brand-strong"
        >
          <FiPlus size={16} /> New group
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === 'join' ? 'none' : 'join')}
          aria-expanded={panel === 'join'}
          className="flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-body_Medium font-semibold text-ink transition-colors hover:bg-surface-variant"
        >
          <FiUsers size={16} /> Join with code
        </button>
      </div>

      {panel === 'create' && (
        <form onSubmit={onCreate} className="flex max-w-md flex-col gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Group name"
            maxLength={80}
            autoFocus
            className={authInputClass(false)}
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-full bg-brand py-2.5 text-body_Medium font-bold text-ink-on-brand disabled:opacity-60"
          >
            Create group
          </button>
        </form>
      )}

      {panel === 'join' && (
        <form onSubmit={onJoin} className="flex max-w-md flex-col gap-2">
          {/* Said before joining, not discovered after: joining is what makes a
              reader's pages visible to the group. */}
          <p className="text-label_Medium text-ink-soft">
            Members of a group can see how far each other has read. You can hide your own reading at
            any time from inside the group.
          </p>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Invite code"
            maxLength={8}
            autoFocus
            className={`${authInputClass(false)} tracking-[0.2em] uppercase`}
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="rounded-full bg-brand py-2.5 text-body_Medium font-bold text-ink-on-brand disabled:opacity-60"
          >
            Join group
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="h-28 animate-pulse rounded-lg bg-surface-variant" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <button
              key={group._id}
              type="button"
              onClick={() => navigate(`/groups/${group._id}`)}
              className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:border-brand/40"
            >
              <span className="flex items-center gap-2">
                <FiUsers className="text-brand" size={18} />
                <span className="text-tittle_Medium font-bold text-ink">{group.name}</span>
              </span>
              {group.description && (
                <span className="line-clamp-2 text-label_Medium text-ink-soft">
                  {group.description}
                </span>
              )}
              <span className="text-label_Medium text-ink-faint">
                {`${group.memberCount} ${group.memberCount === 1 ? 'member' : 'members'} · ${group.bookCount} ${group.bookCount === 1 ? 'book' : 'books'}`}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line p-8 text-center">
          <FiUsers size={24} className="text-ink-faint" />
          <p className="text-tittle_Medium font-bold text-ink">No groups yet</p>
          <p className="max-w-sm text-label_Medium text-ink-soft">
            Start one and share the code, or join a group with a code someone has sent you.
          </p>
        </div>
      )}
    </div>
  );
}
