import { useEffect, useState } from 'react';

import { ReadHubImages } from '../assets/asset';
/**
 * The frame every auth screen sits in.
 *
 * Two shapes, because the designs have two. Sign-in and sign-up are a split
 * card: a blue promotional panel beside the form. Everything after that --
 * forgot password, the code, the new password -- is a single centred card, and
 * rightly so: somebody halfway through recovering an account is not being sold
 * the product, they are completing a task.
 *
 * The promotional panel is only shown from the medium breakpoint up. On a phone
 * it would push the form below the fold, and a form nobody can see is worse
 * than no illustration.
 */
const SLIDES = [
  {
    image: ReadHubImages.SecondOnboardingImage,
    title: 'Find your next great read',
    body: 'Explore books you actually want to read and build your personal reading list',
  },
  {
    image: ReadHubImages.ThirdOnboardingImage,
    title: 'Read at your pace',
    body: 'Pick up where you left off and keep track of your progress as you read',
  },
  {
    image: ReadHubImages.FourthOnboardingImage,
    title: 'Read more. Stay consistent',
    body: 'Set reading goals and keep yourself motivated one page at a time',
  },
];

/** How long each promotional slide holds before the next. */
const SLIDE_MS = 5000;

function PromoPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="hidden w-[46%] shrink-0 flex-col items-center justify-between rounded-l-lg p-8 text-white md:flex"
      style={{ backgroundColor: 'var(--brand-500)' }}>
      <p className="text-headline_Small font-extrabold">Welcome to ReadHub!</p>

      {/* Fixed height, so the panel does not resize as the slides change --
          a card that grows and shrinks under a form is distracting. */}
      <div className="flex h-64 w-full items-center justify-center">
        <img
          key={slide.image}
          src={slide.image}
          alt=""
          className="max-h-full max-w-[80%] object-contain animate-[fadeIn_400ms_ease-out]"
          /*
           * The artwork is a PNG on a white background, which sat on the blue
           * as a hard white rectangle. The mask fades its edges out instead,
           * so the illustration dissolves into the panel rather than being
           * pasted onto it. Centre stays fully opaque, so nothing that matters
           * is dimmed.
           */
          style={{
            maskImage:
              'radial-gradient(ellipse 72% 72% at 50% 50%, #000 60%, transparent 92%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 72% 72% at 50% 50%, #000 60%, transparent 92%)',
          }}
        />
      </div>

      <div className="flex w-full flex-col items-center gap-2 text-center">
        <p className="w-full text-tittle_Large font-bold">{slide.title}</p>
        {/* `w-full` on both, because a centred flex column sizes its children
            to min-content -- which wrapped this sentence one word per line. */}
        <p className="w-full text-body_Medium leading-relaxed text-white/85">{slide.body}</p>

        <div className="mt-4 flex gap-2" role="tablist" aria-label="Highlights">
          {SLIDES.map((item, position) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={position === index}
              aria-label={item.title}
              onClick={() => setIndex(position)}
              className={[
                'h-1.5 rounded-full transition-all',
                position === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {'split'|'centred'} [props.variant] Which of the two shapes to use.
 * @param {string} props.title Heading above the form.
 * @param {string} [props.subtitle] One line under it.
 */
export default function AuthLayout({ variant = 'split', title, subtitle, children }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page px-4 py-6">
      <div
        className={[
          'flex w-full overflow-hidden rounded-lg bg-surface shadow-overlay',
          variant === 'split' ? 'max-w-4xl' : 'max-w-md',
        ].join(' ')}
      >
        {variant === 'split' && <PromoPanel />}

        <div className="flex w-full flex-col justify-center gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h1 className="text-headline_Small font-extrabold text-ink">{title}</h1>
            {subtitle && <p className="text-body_Medium text-ink-soft">{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

/** A labelled field, with the error state the designs call for. */
export function AuthField({ label, error, hint, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label_Medium font-semibold text-ink-soft">{label}</span>
      {children}
      {error && <span className="text-label_Medium text-danger">{error}</span>}
      {!error && hint && <span className="text-label_Medium text-ink-faint">{hint}</span>}
    </label>
  );
}

/** The primary action, full width as in the designs. */
export function AuthButton({ children, loading, ...props }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      {...props}
      className="w-full rounded-full bg-brand py-3 text-body_Medium font-bold text-ink-on-brand transition-colors hover:bg-brand-strong disabled:opacity-60"
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}

/** The divider and the two providers, shared by sign-in and sign-up. */
export function AuthProviders({ onGoogle, children }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center gap-2">
        <span className="h-px flex-1 bg-line" />
        <span className="text-label_Medium text-ink-faint">Or continue with</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Google only. Apple sign-in needs an Apple developer configuration the
          web app does not have, and a button that cannot complete is worse
          than one that is not offered. `children` is for the provider that
          brings its own button, which Google's SDK does. */}
      <div className="flex w-full items-center justify-center gap-4 [&_iframe]:!rounded-full">
        {children}
        {onGoogle && (
          <button
            type="button"
            onClick={onGoogle}
            aria-label="Continue with Google"
            className="flex h-11 items-center gap-2 rounded-full border border-line px-4 transition-colors hover:bg-surface-variant"
          >
            <img src={ReadHubImages.GoogleIcon} alt="" className="h-5 w-5" />
            <span className="text-body_Medium font-semibold text-ink">Continue with Google</span>
          </button>
        )}
      </div>
    </div>
  );
}
