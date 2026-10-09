import { useRef, useState } from 'react';
import { FiImage, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

import { COMMUNITY_CATEGORIES, communitiesApi } from '../../services/communities';
import { groupsApi } from '../../services/groups';
import { uploadCoverToCloudinary } from '../../Utils/CloudinaryUpload';
import { authInputClass } from '../../Util/authStyles';

/**
 * The things an admin makes or changes inside a community: a reading group, a
 * challenge, and the community's own details.
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

/* -------------------------------------------- editing the community */

/** Rough guard before an upload, so an obvious mistake fails locally. */
const MAX_COVER_BYTES = 8 * 1024 * 1024;

/**
 * The community's own details, including the picture behind its name.
 *
 * Cover and logo are separate fields doing different jobs: the cover is wide
 * and sits behind the name, the logo is square and appears beside it in a
 * list. The banner used to fall back to the logo, which meant a square image
 * stretched across a landscape box.
 *
 * The upload happens when a file is chosen rather than on save, so the preview
 * is the real hosted image. A cover that looked right in the form and wrong
 * afterwards would be worse than a short wait.
 */
export function EditCommunity({ community, onClose, onSaved }) {
  const [name, setName] = useState(community.name ?? '');
  const [description, setDescription] = useState(community.description ?? '');
  const [category, setCategory] = useState(community.category ?? 'other');
  const [coverUrl, setCoverUrl] = useState(community.coverUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const onPickCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.');
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      toast.error('That image is too large. Keep it under 8MB.');
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadCoverToCloudinary(file);
      setCoverUrl(url);
    } catch (error) {
      toast.error(error?.message || 'Could not upload that image.');
    } finally {
      setUploading(false);
      // Let the same file be chosen again after a failure.
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('A community needs a name.');
      return;
    }

    setSaving(true);
    try {
      await communitiesApi.update(community._id, {
        name: name.trim(),
        description: description.trim(),
        category,
        coverUrl,
      });
      await onSaved();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not save those changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title="Edit community" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">Cover image</span>

          <div className="relative flex h-32 items-end overflow-hidden rounded-xl bg-brand">
            {coverUrl && (
              <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
            <p className="relative truncate p-3 text-body_Medium font-bold text-white">
              {name || community.name}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-body_Small font-semibold text-ink transition-colors hover:bg-surface-variant disabled:opacity-60"
            >
              <FiImage size={14} />
              {uploading ? 'Uploading…' : coverUrl ? 'Change cover' : 'Add a cover'}
            </button>
            {coverUrl && (
              <button
                type="button"
                onClick={() => setCoverUrl('')}
                className="rounded-full border border-line px-4 py-2 text-body_Small text-ink-soft transition-colors hover:bg-surface-variant"
              >
                Remove
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickCover}
            className="sr-only"
            aria-label="Choose a cover image"
          />
          <span className="text-label_Small text-ink-faint">
            A wide image works best. It sits behind the community name.
          </span>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">Name</span>
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            className={authInputClass(false)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">Description</span>
          <textarea
            value={description}
            maxLength={500}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            className={`${authInputClass(false)} resize-none`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={authInputClass(false)}
          >
            {COMMUNITY_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <Actions saving={saving || uploading} submitLabel="Save changes" onClose={onClose} />
      </form>
    </Dialog>
  );
}
