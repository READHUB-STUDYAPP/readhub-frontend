import { useState } from 'react';
import { FiBookOpen, FiClock, FiTarget, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';

import {
  GENRE_SUGGESTIONS,
  PACE_LABELS,
  PURPOSE_LABELS,
  TIME_LABELS,
  buddiesApi,
} from '../../services/buddies';
import { authInputClass } from '../../Util/authStyles';

const MAX_GENRES = 8;

/**
 * The way into Reading Buddy, and the way to change your mind later.
 *
 * One screen, not a wizard. The PRD asks for "enough information to produce
 * useful matches without making onboarding unnecessarily long", and a
 * multi-step flow makes a seven-field form feel like a commitment -- the most
 * common outcome of which is abandoning it halfway.
 *
 * Every field except the genres has a sensible default already selected, so the
 * shortest honest path through this is: pick two genres, press the button.
 */
export default function BuddyProfileForm({ profile, onSaved, onCancel }) {
  const isNew = !profile;

  const [bio, setBio] = useState(profile?.bio ?? '');
  const [genres, setGenres] = useState(profile?.genres ?? []);
  const [favourite, setFavourite] = useState((profile?.favouriteBooks ?? []).join(', '));
  const [preferredTime, setPreferredTime] = useState(profile?.preferredTime ?? 'evening');
  const [pace, setPace] = useState(profile?.pace ?? 'steady');
  const [monthlyGoal, setMonthlyGoal] = useState(profile?.monthlyGoal ?? 2);
  const [purpose, setPurpose] = useState(profile?.purpose ?? 'accountability');
  const [school, setSchool] = useState(profile?.school ?? '');
  const [discoverable, setDiscoverable] = useState(profile?.discoverable ?? true);
  const [acceptingRequests, setAccepting] = useState(profile?.acceptingRequests ?? true);
  const [saving, setSaving] = useState(false);

  const toggleGenre = (genre) => {
    setGenres((current) => {
      if (current.includes(genre)) return current.filter((item) => item !== genre);
      if (current.length >= MAX_GENRES) return current;
      return [...current, genre];
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (genres.length === 0) {
      toast.error('Pick at least one genre, so we have something to match on.');
      return;
    }

    setSaving(true);
    try {
      await buddiesApi.saveProfile({
        bio,
        genres,
        favouriteBooks: favourite
          .split(',')
          .map((title) => title.trim())
          .filter(Boolean),
        preferredTime,
        pace,
        monthlyGoal: Number(monthlyGoal) || 1,
        purpose,
        school,
        discoverable,
        acceptingRequests,
      });
      toast.success(isNew ? 'You are in. Here are some readers to meet.' : 'Profile saved.');
      await onSaved?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {isNew ? (
        <header className="flex flex-col gap-4">
          <h1 className="text-headline_Small font-extrabold text-ink">Reading Buddy</h1>
          <p className="max-w-prose text-body_Medium text-ink-soft">
            Find someone who reads what you read, pick a book together, and keep each other
            going. Tell us a little and we will suggest people worth reading with.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            <Pitch Icon={FiUsers} title="Matched on reading">
              Shared taste, pace and goals — not a follower count.
            </Pitch>
            <Pitch Icon={FiBookOpen} title="One book at a time">
              Choose it together and track progress side by side.
            </Pitch>
            <Pitch Icon={FiTarget} title="Nudges, not pressure">
              Reminders that encourage. Leave whenever you like.
            </Pitch>
          </ul>
        </header>
      ) : (
        <header>
          <h1 className="text-headline_Small font-extrabold text-ink">Your buddy profile</h1>
          <p className="text-body_Small text-ink-soft">
            This is what other readers see. Nothing else from your account is shown.
          </p>
        </header>
      )}

      {/* ------------------------------------------------------- the taste */}
      <Field
        label="What do you read?"
        hint={`Pick up to ${MAX_GENRES}. This matters most for matching.`}
        required
        as="group"
      >
        <div role="group" aria-label="Favourite genres" className="flex flex-wrap gap-2">
          {GENRE_SUGGESTIONS.map((genre) => {
            const on = genres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={on}
                onClick={() => toggleGenre(genre)}
                className={`rounded-full px-3.5 py-2 text-body_Small font-medium capitalize transition-colors ${
                  on
                    ? 'bg-brand text-white'
                    : 'border border-line text-ink-soft hover:bg-surface-variant'
                }`}
              >
                {genre.replace(/-/g, ' ')}
              </button>
            );
          })}
        </div>
      </Field>

      {/* ------------------------------------------------------ the reader */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="When do you usually read?" Icon={FiClock}>
          <select
            value={preferredTime}
            onChange={(event) => setPreferredTime(event.target.value)}
            className={authInputClass(false)}
          >
            {Object.entries(TIME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="How fast do you read?">
          <select
            value={pace}
            onChange={(event) => setPace(event.target.value)}
            className={authInputClass(false)}
          >
            {Object.entries(PACE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="How many books a month are you aiming for?">
          <input
            type="number"
            min={1}
            max={60}
            value={monthlyGoal}
            onChange={(event) => setMonthlyGoal(event.target.value)}
            className={authInputClass(false)}
          />
        </Field>

        <Field label="What do you want from a buddy?">
          <select
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            className={authInputClass(false)}
          >
            {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* ------------------------------------------------------- about you */}
      <Field label="A line about you" hint="Optional. Other readers see this.">
        <textarea
          value={bio}
          maxLength={300}
          rows={3}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Law student. Mostly self-development and memoir, usually after 9pm."
          className={`${authInputClass(false)} resize-none`}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Books you love" hint="Optional, comma separated.">
          <input
            value={favourite}
            onChange={(event) => setFavourite(event.target.value)}
            placeholder="Atomic Habits, Things Fall Apart"
            className={authInputClass(false)}
          />
        </Field>

        <Field label="School or university" hint="Optional.">
          <input
            value={school}
            maxLength={120}
            onChange={(event) => setSchool(event.target.value)}
            placeholder="University of Lagos"
            className={authInputClass(false)}
          />
        </Field>
      </div>

      {/* -------------------------------------------------------- controls */}
      {!isNew && (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-line p-4">
          <legend className="px-2 text-body_Small font-semibold text-ink">Who can find you</legend>

          <Toggle
            checked={discoverable}
            onChange={setDiscoverable}
            label="Show me in Find a Buddy"
            hint="Turn this off to keep your profile without being suggested to anyone."
          />
          <Toggle
            checked={acceptingRequests}
            onChange={setAccepting}
            label="Let readers send me requests"
            hint="Turn this off when you have enough buddies for now."
          />
        </fieldset>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-6 py-3 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
        >
          {saving ? 'Saving…' : isNew ? 'Find me a reading buddy' : 'Save profile'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line px-6 py-3 text-body_Medium font-semibold text-ink-soft transition-colors hover:bg-surface-variant"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/* -------------------------------------------------------------- pieces */

/**
 * A labelled field.
 *
 * `as="group"` renders a div rather than a label. A <label> may only wrap its
 * own form control -- wrapping buttons in one is invalid HTML, and the browser
 * resolves it by dropping them out of the accessibility tree, so they stop
 * being reachable by role for a screen reader or anything else that reads it.
 */
function Field({ label, hint, required, Icon, as = 'label', children }) {
  const Wrapper = as === 'group' ? 'div' : 'label';

  return (
    <Wrapper className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-body_Small font-semibold text-ink">
        {Icon && <Icon className="text-ink-faint" />}
        {label}
        {required && <span className="text-ink-faint">*</span>}
      </span>
      {hint && <span className="text-label_Small text-ink-faint">{hint}</span>}
      {children}
    </Wrapper>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-brand"
      />
      <span className="flex flex-col">
        <span className="text-body_Small font-medium text-ink">{label}</span>
        <span className="text-label_Small text-ink-faint">{hint}</span>
      </span>
    </label>
  );
}

function Pitch({ Icon, title, children }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-xl bg-surface-variant p-4">
      {Icon && <Icon className="text-brand" size={20} />}
      <span className="text-body_Medium font-semibold text-ink">{title}</span>
      <span className="text-body_Small text-ink-soft">{children}</span>
    </li>
  );
}
