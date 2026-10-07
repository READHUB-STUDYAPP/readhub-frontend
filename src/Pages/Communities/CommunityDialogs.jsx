import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

import { communitiesApi } from '../../services/communities';
import { groupsApi } from '../../services/groups';
import { authInputClass } from '../../Util/authStyles';

/**
 * The two things an admin makes inside a community: a reading group, and a
 * challenge.
 *
 * Kept out of Community.jsx, which is long enough already, and kept together
 * because they share a shell. Both are forms in a sheet, and on a phone the
 * sheet is the thing that decides whether they are usable at all.
 */

/* ------------------------------------------------------- dialog shell */

/**
 * The shell both forms sit in.
 *
 * The height cap and its own scrolling matter more than they look: the
 * challenge form is taller than a phone screen, and without them the buttons
 * at the bottom are simply unreachable. It rises from the bottom edge on a
 * phone and centres on a larger screen, which is where each belongs.
 */
export function Dialog({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-2xl bg-surface p-6 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-tittle_Large font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1 text-ink-soft transition-colors hover:bg-surface-variant"
          >
            <FiX size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Actions({ saving, submitLabel, onClose }) {
  return (
    <div className="flex gap-3">
      <button
        type="submit"
        disabled={saving}
        className="flex-1 rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-full border border-line px-5 py-2.5 text-body_Medium font-semibold text-ink-soft transition-colors hover:bg-surface-variant"
      >
        Cancel
      </button>
    </div>
  );
}

/* ---------------------------------------------------- creating a group */

/**
 * A reading group, made inside this community.
 *
 * The button that opens this used to navigate to `/groups`, which left the
 * community entirely and made a group beside it rather than in it — so a
 * community's Groups tab stayed empty however many groups were created from
 * it.
 */
export function NewGroup({ communityId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Give the group a name.');
      return;
    }

    setSaving(true);
    try {
      const { group } = await groupsApi.create({
        name: name.trim(),
        description: description.trim(),
        community: communityId,
      });
      await onCreated(group);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not create that group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title="New reading group" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">Name</span>
          <input
            value={name}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            placeholder="Sunday Evening Readers"
            className={authInputClass(false)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">
            What is it for <span className="font-normal text-ink-faint">(optional)</span>
          </span>
          <textarea
            value={description}
            maxLength={500}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="One book a month, discussed on Sundays."
            className={`${authInputClass(false)} resize-none`}
          />
        </label>

        <Actions saving={saving} submitLabel="Create group" onClose={onClose} />
      </form>
    </Dialog>
  );
}

/* ------------------------------------------------ creating a challenge */

/**
 * The goals the server accepts, each with the unit its target is counted in.
 *
 * The unit is the point: a target of "20" means nothing on its own, and asking
 * "How many minutes a day?" rather than "Target" is the difference between a
 * field someone fills in correctly and one they guess at.
 */
const CHALLENGE_GOALS = [
  { value: 'read-daily', label: 'Read every day', unit: 'minutes a day' },
  { value: 'read-minutes', label: 'Read for a total time', unit: 'minutes in total' },
  { value: 'read-pages', label: 'Read a number of pages', unit: 'pages' },
  { value: 'read-books', label: 'Read a number of books', unit: 'books' },
  { value: 'finish-book', label: 'Finish a book', unit: 'books' },
  { value: 'complete-schedule', label: 'Keep up with a schedule', unit: 'weeks' },
];

/** A sensible default window: starts today, runs a fortnight. */
const isoDay = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

export function NewChallenge({ communityId, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('read-daily');
  const [target, setTarget] = useState(20);
  const [startsAt, setStartsAt] = useState(isoDay(0));
  const [endsAt, setEndsAt] = useState(isoDay(14));
  const [saving, setSaving] = useState(false);

  const unit = CHALLENGE_GOALS.find((item) => item.value === goal)?.unit ?? 'units';

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error('Give the challenge a title.');
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      toast.error('The end date has to come after the start date.');
      return;
    }

    setSaving(true);
    try {
      const challenge = await communitiesApi.createChallenge(communityId, {
        title: title.trim(),
        description: description.trim(),
        goal,
        target: Number(target) || 1,
        // The inputs give YYYY-MM-DD; the server wants instants. The end runs
        // to the close of its day, so a challenge ending "on the 20th" is not
        // over at midnight as the 20th begins.
        startsAt: new Date(`${startsAt}T00:00:00`).toISOString(),
        endsAt: new Date(`${endsAt}T23:59:59`).toISOString(),
      });
      await onCreated(challenge);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not create that challenge.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title="New challenge" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">Title</span>
          <input
            value={title}
            maxLength={140}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="30-Day Reading Challenge"
            className={authInputClass(false)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">
            What is it <span className="font-normal text-ink-faint">(optional)</span>
          </span>
          <textarea
            value={description}
            maxLength={1000}
            rows={2}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Read for at least 20 minutes every day."
            className={`${authInputClass(false)} resize-none`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">The goal</span>
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className={authInputClass(false)}
          >
            {CHALLENGE_GOALS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">How many {unit}?</span>
          <input
            type="number"
            min={1}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className={authInputClass(false)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-body_Small font-semibold text-ink">Starts</span>
            <input
              type="date"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className={authInputClass(false)}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-body_Small font-semibold text-ink">Ends</span>
            <input
              type="date"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className={authInputClass(false)}
            />
          </label>
        </div>

        <Actions saving={saving} submitLabel="Start challenge" onClose={onClose} />
      </form>
    </Dialog>
  );
}
