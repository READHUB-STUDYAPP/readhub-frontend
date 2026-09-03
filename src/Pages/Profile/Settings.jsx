import { useEffect, useRef, useState } from 'react';
import {
  FiArrowLeft,
  FiChevronRight,
  FiFileText,
  FiHelpCircle,
  FiLogOut,
  FiShield,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import ThemeToggle from '../../Components/ThemeToggle';
import { useFiles } from '../../Context/FileContext';
import { apiEndpoints } from '../../Util/apiEndpoints';
import { authInputClass } from '../../Util/authStyles';
import axiosConfig from '../../Util/axiosConfig';

/** Where to write for help. */
const SUPPORT_EMAIL = 'admin@readhub.study';

/**
 * The reading goal's range.
 *
 * The slider used to run from 0 to 30, which made zero a goal that could never
 * be met and half an hour the ceiling rather than an ordinary target.
 */
const GOAL_MIN = 10;
const GOAL_MAX = 120;
const GOAL_STEP = 5;

/**
 * Settings.
 *
 * Only settings this app can honour. The page used to show notification, sound
 * and vibration toggles and an "Export data" row, none of which were wired to
 * anything: the toggles were images of switches, the export had no endpoint
 * behind it, and there is no service worker or push subscription in this app at
 * all. A control that does nothing is worse than an absent one -- a reader
 * turns notifications on, believes it, and then hears nothing.
 *
 * What is left works: the profile, the daily goal, appearance, the policies, a
 * way to reach a person, signing out, and deleting the account.
 */
const Settings = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [readingGoal, setReadingGoal] = useState(() => {
    const saved = Number(localStorage.getItem('readingGoal'));
    return Number.isFinite(saved) && saved > 0 ? saved : 30;
  });
  const { setReadingGoal: setReadingGoalGlobal } = useFiles();
  const goalSaveTimerRef = useRef(null);

  useEffect(() => {
    axiosConfig
      .get(apiEndpoints.USER_PROFILE)
      .then(({ data }) => {
        setUser(data.user);
        setUsername(data.user.username ?? '');
        setEmail(data.user.email ?? '');
      })
      .catch(() => toast.error('Could not load your profile.'));
  }, []);

  useEffect(() => {
    axiosConfig
      .get(apiEndpoints.BOOK_STATS)
      .then(({ data }) => {
        // The server is the authority on the goal, so a goal set on the phone
        // shows here rather than whatever this browser last remembered.
        const goal = Math.round(Number(data?.dailyGoal));
        if (Number.isFinite(goal) && goal > 0) {
          setReadingGoal(goal);
          setReadingGoalGlobal(goal);
        }
      })
      .catch(() => {
        // Not worth a message: the local goal is already on screen.
      });
  }, [setReadingGoalGlobal]);

  const onGoalChange = (value) => {
    const next = Number(value);
    setReadingGoal(next);
    setReadingGoalGlobal(next);
    localStorage.setItem('readingGoal', String(next));

    // Debounced, because dragging a slider would otherwise send a request per
    // pixel. The goal is no longer locked for the day -- that rule was removed
    // from the server, and this screen went on claiming it long afterwards.
    if (goalSaveTimerRef.current) clearTimeout(goalSaveTimerRef.current);
    goalSaveTimerRef.current = setTimeout(() => {
      axiosConfig
        .patch(apiEndpoints.BOOK_GOAL, { dailyGoal: next })
        .catch(() => toast.error('Could not save your reading goal.'));
    }, 500);
  };

  // Clear a pending save on unmount, so leaving mid-drag does not fire a
  // request from a screen that is gone.
  useEffect(() => () => clearTimeout(goalSaveTimerRef.current), []);

  /*
    Whether anything has actually been edited.

    The old page showed a permanent blue "Settings Saved" bar which was not a
    button and had never saved anything. The save appears only when there is a
    change to save, and sits above the destructive rows -- the same order as the
    phone app, so delete is never the button under your thumb when you meant to
    save.
  */
  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();
  const changed =
    Boolean(user) && (trimmedUsername !== user.username || trimmedEmail !== user.email);
  const valid = trimmedUsername.length > 0 && trimmedEmail.length > 0;

  const onSave = async () => {
    if (!valid) {
      toast.info('Your name and email cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await axiosConfig.patch(apiEndpoints.UPDATE_PROFILE, {
        username: trimmedUsername,
        email: trimmedEmail,
      });
      setUser(data.updatedUser);
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const onSignOut = async () => {
    try {
      await axiosConfig.post(apiEndpoints.LOGOUT);
    } catch {
      // Signing out of this browser matters more than telling the server.
    }
    localStorage.clear();
    navigate('/login');
  };

  const onDelete = async () => {
    setIsDeleting(true);
    try {
      await axiosConfig.delete(apiEndpoints.DELETE_PROFILE);
      localStorage.clear();
      toast.success('Your account has been deleted.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not delete your account.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const onSupport = () => {
    const subject = encodeURIComponent('ReadHub support');
    window.location.href = 'mailto:' + SUPPORT_EMAIL + '?subject=' + subject;
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* The way back to the profile. Lost when this page was rewritten, and
          on a phone browser there is no other route out of here. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Back to your profile"
          className="text-ink-soft transition-colors hover:text-ink"
        >
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-headline_Small font-extrabold text-ink">Settings</h1>
      </div>

      {/* Profile, editable in place -- two fields behind an Edit button is a
          mode for no reason. */}
      <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4">
        <h2 className="flex items-center gap-2 text-tittle_Medium font-bold text-ink">
          <FiUser className="text-brand" size={18} /> Profile
        </h2>

        <label className="flex flex-col gap-1">
          <span className="text-label_Medium text-ink-soft">Display name</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Your name"
            maxLength={60}
            className={authInputClass(false)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-label_Medium text-ink-soft">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={authInputClass(false)}
          />
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-tittle_Medium font-bold text-ink">Daily reading goal</h2>
          <span className="text-label_Large font-semibold text-brand">{`${readingGoal} min`}</span>
        </div>
        <input
          type="range"
          min={GOAL_MIN}
          max={GOAL_MAX}
          step={GOAL_STEP}
          value={readingGoal}
          onChange={(event) => onGoalChange(event.target.value)}
          aria-label="Daily reading goal in minutes"
          className="w-full cursor-pointer accent-[var(--brand)]"
        />
        <p className="text-label_Medium text-ink-faint">
          Counted from time actually spent in a book, on any device.
        </p>
      </section>

      {/* Appearance is genuinely a web setting: the app resolves "system"
          against the browser, so all three states mean something here. */}
      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
        <h2 className="text-tittle_Medium font-bold text-ink">Appearance</h2>
        <ThemeToggle />
      </section>

      <section className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
        <Row
          icon={<FiShield size={16} />}
          label="Privacy Policy"
          onClick={() => navigate('/privacy')}
        />
        <Row
          icon={<FiFileText size={16} />}
          label="Terms of Service"
          onClick={() => navigate('/terms')}
        />
        {/* Opens a mail client, rather than a support screen that does not
            exist. This row used to navigate to this very page. */}
        <Row
          icon={<FiHelpCircle size={16} />}
          label="Help and support"
          hint={SUPPORT_EMAIL}
          onClick={onSupport}
          last
        />
      </section>

      {changed && (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !valid}
          className="rounded-full bg-brand py-3 text-body_Medium font-bold text-ink-on-brand transition-colors hover:bg-brand-strong disabled:opacity-60 animate-[fadeIn_160ms_ease-out]"
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-body_Medium font-semibold text-ink transition-colors hover:bg-surface-variant"
        >
          <FiLogOut size={16} /> Sign out
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-body_Medium font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          <FiTrash2 size={16} /> Delete account
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-surface p-6 shadow-overlay animate-[fadeIn_160ms_ease-out]">
            <h2 className="text-tittle_Large font-bold text-ink">Delete your account?</h2>
            <p className="text-body_Medium text-ink-soft">
              Your books, notes and reading history are removed permanently. Comments you have left
              in reading groups stay, under your name, so those conversations still make sense.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 rounded-full border border-line py-2.5 text-body_Medium font-semibold text-ink transition-colors hover:bg-surface-variant"
              >
                Keep my account
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-danger py-2.5 text-body_Medium font-bold text-white disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Row({ icon, label, hint, onClick, last = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 p-4 text-left transition-colors hover:bg-surface-variant ${
        last ? '' : 'border-b border-line'
      }`}
    >
      <span className="text-brand">{icon}</span>
      <span className="flex-1 text-body_Medium text-ink">{label}</span>
      {hint && <span className="text-label_Medium text-ink-faint">{hint}</span>}
      <FiChevronRight className="text-ink-faint" size={16} />
    </button>
  );
}

export default Settings;
