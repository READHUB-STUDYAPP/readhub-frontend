import { useCallback, useEffect, useState } from 'react';
import { FiArrowLeft, FiFlag, FiSlash } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  PACE_LABELS,
  PURPOSE_LABELS,
  REPORT_REASONS,
  TIME_LABELS,
  buddiesApi,
  labelFor,
  timeAgo,
} from '../../services/buddies';
import { AchievementList } from '../../Components/Achievements';
import { authInputClass } from '../../Util/authStyles';

/**
 * One reader's public buddy profile.
 *
 * Everything here was put there deliberately by the person it describes --
 * the server returns a whitelist, not a redacted account -- so the screen can
 * show all of it without deciding what is safe.
 *
 * The match explanation sits directly under the percentage because the number
 * on its own is the part people distrust. "82%" invites "says who"; the
 * sentence answers it.
 */
export default function BuddyProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setPerson(await buddiesApi.profileOf(userId));
    } catch (error) {
      setFailed(error?.response?.data?.message || 'That reader could not be found.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSend = async () => {
    setSending(true);
    try {
      await buddiesApi.sendRequest(userId, message);
      toast.success('Request sent. You will hear when they answer.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not send that request.');
    } finally {
      setSending(false);
    }
  };

  const onBlock = async () => {
    if (!window.confirm(`Block ${person.user.username}? They will not be able to reach you, and any buddy relationship between you ends.`)) {
      return;
    }
    try {
      await buddiesApi.block(userId);
      toast.success('Blocked.');
      navigate('/buddies');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not block that reader.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-variant" />
        <div className="h-32 animate-pulse rounded-xl bg-surface-variant" />
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

  const state = person.relationship?.state ?? 'none';

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex w-fit items-center gap-2 text-body_Small font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <FiArrowLeft /> Back
      </button>

      <header className="flex flex-wrap items-start gap-4">
        {person.user.profilePicture ? (
          <img src={person.user.profilePicture} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-wash text-headline_Small font-bold text-brand-strong">
            {person.user.username.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-headline_Small font-extrabold text-ink">{person.user.username}</h1>
          <p className="text-label_Small text-ink-faint">Active {timeAgo(person.lastActiveAt)}</p>
          {person.school && <p className="text-body_Small text-ink-soft">{person.school}</p>}
        </div>

        {typeof person.match?.score === 'number' && person.match.score >= 30 && (
          <span className="rounded-full bg-brand-wash px-3 py-1.5 text-body_Medium font-bold text-brand-strong">
            {person.match.score}% match
          </span>
        )}
      </header>

      {person.match?.explanation && (
        <p className="rounded-xl bg-surface-variant p-4 text-body_Medium text-ink-soft">
          {person.match.explanation}
        </p>
      )}

      {person.bio && <p className="max-w-prose text-body_Medium text-ink">{person.bio}</p>}

      <dl className="grid gap-4 sm:grid-cols-3">
        <Fact label="Reads">{labelFor(TIME_LABELS, person.preferredTime)}</Fact>
        <Fact label="Pace">{labelFor(PACE_LABELS, person.pace)}</Fact>
        <Fact label="Goal">{person.monthlyGoal} books a month</Fact>
        <Fact label="Looking for">{labelFor(PURPOSE_LABELS, person.purpose)}</Fact>
      </dl>

      {person.genres?.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-body_Small font-semibold text-ink">Reads</h2>
          <div className="flex flex-wrap gap-2">
            {person.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-surface-variant px-3 py-1.5 text-body_Small capitalize text-ink-soft"
              >
                {genre.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </section>
      )}

      {person.achievements?.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-body_Small font-semibold text-ink">Achievements</h2>
          {/* Earned only. The server does not send the unearned list for
              somebody else, and a page listing what a stranger has not
              managed would be nobody's business anyway. */}
          <AchievementList achievements={person.achievements} />
        </section>
      )}

      {person.favouriteBooks?.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-body_Small font-semibold text-ink">Books they love</h2>
          <ul className="flex flex-col gap-1">
            {person.favouriteBooks.map((title) => (
              <li key={title} className="text-body_Medium text-ink-soft">
                {title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------------ the action */}
      <section className="flex flex-col gap-3 rounded-xl border border-line p-4">
        {state === 'buddies' && (
          <>
            <p className="text-body_Medium font-semibold text-ink">You are already buddies.</p>
            <button
              type="button"
              onClick={() => navigate(`/buddies/${person.relationship.buddyId}`)}
              className="w-fit rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              Open your buddy space
            </button>
          </>
        )}

        {state === 'request-sent' && (
          <p className="text-body_Medium text-ink-soft">
            Your request is waiting for an answer.
          </p>
        )}

        {state === 'request-received' && (
          <>
            <p className="text-body_Medium text-ink-soft">
              {person.user.username} has asked to be your buddy.
            </p>
            <button
              type="button"
              onClick={() => navigate('/buddies?tab=requests')}
              className="w-fit rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              Answer the request
            </button>
          </>
        )}

        {state === 'none' && !person.acceptingRequests && (
          <p className="text-body_Medium text-ink-soft">
            {person.user.username} is not taking new buddies right now.
          </p>
        )}

        {state === 'none' && person.acceptingRequests && (
          <>
            <label className="flex flex-col gap-2">
              <span className="text-body_Small font-semibold text-ink">
                Say hello <span className="font-normal text-ink-faint">(optional)</span>
              </span>
              <textarea
                value={message}
                maxLength={300}
                rows={3}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I saw you read self-development too. Fancy going through one together?"
                className={`${authInputClass(false)} resize-none`}
              />
            </label>
            <button
              type="button"
              disabled={sending}
              onClick={onSend}
              className="w-fit rounded-full bg-brand px-6 py-3 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send buddy request'}
            </button>
          </>
        )}
      </section>

      {/* ------------------------------------------------------- safety */}
      <section className="flex flex-wrap gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setReporting(true)}
          className="flex items-center gap-2 text-body_Small text-ink-soft transition-colors hover:text-ink"
        >
          <FiFlag /> Report this reader
        </button>
        <button
          type="button"
          onClick={onBlock}
          className="flex items-center gap-2 text-body_Small text-ink-soft transition-colors hover:text-ink"
        >
          <FiSlash /> Block
        </button>
      </section>

      {reporting && (
        <ReportDialog
          person={person}
          onClose={() => setReporting(false)}
          onDone={() => {
            setReporting(false);
            toast.success('Thank you. Our team will review this.');
          }}
        />
      )}
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-label_Small uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="text-body_Medium font-medium text-ink">{children}</dd>
    </div>
  );
}

/**
 * The report form.
 *
 * The evidence field is prefilled with the bio, because that is what is on
 * screen when someone reports a profile -- and a report whose evidence is a
 * pointer is worthless once the author edits it.
 */
function ReportDialog({ person, onClose, onDone }) {
  const [reason, setReason] = useState('harassment');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      await buddiesApi.report(person.user._id, {
        reason,
        surface: 'buddy-profile',
        details,
        evidence: person.bio ?? '',
      });
      onDone();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not send that report.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-surface p-6"
      >
        <h2 className="text-tittle_Large font-bold text-ink">
          Report {person.user.username}
        </h2>
        <p className="text-body_Small text-ink-soft">
          This goes to our team, not to them. They will not be told who reported it.
        </p>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">What is wrong?</span>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={authInputClass(false)}
          >
            {REPORT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-body_Small font-semibold text-ink">
            Anything else <span className="font-normal text-ink-faint">(optional)</span>
          </span>
          <textarea
            value={details}
            maxLength={1000}
            rows={4}
            onChange={(event) => setDetails(event.target.value)}
            className={`${authInputClass(false)} resize-none`}
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={sending}
            className="flex-1 rounded-full bg-brand px-5 py-2.5 text-body_Medium font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send report'}
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
