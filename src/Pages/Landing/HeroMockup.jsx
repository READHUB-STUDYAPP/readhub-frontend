import { FiTarget } from 'react-icons/fi';

import readhubMark from '../../assets/landing/readhub-mark.svg';

import { useInView } from './hooks';

/**
 * The product, shown rather than described.
 *
 * Built out of real elements instead of dropped in as a screenshot, for three
 * reasons: it stays sharp on every display, it reflows into something readable
 * on a phone instead of becoming an unreadable 1200px-wide picture, and the
 * numbers in it can animate — the ring fills, the bars grow, the progress bar
 * advances — which is what makes the page feel like software rather than a
 * poster of software.
 *
 * Every figure is illustrative and plainly a sample. Nothing here is passed off
 * as a real reader's data.
 */

const WEEK = [
  { h: 38, tone: 'muted' },
  { h: 56, tone: 'muted' },
  { h: 30, tone: 'muted' },
  { h: 68, tone: 'muted' },
  { h: 48, tone: 'muted' },
  { h: 92, tone: 'solid' },
  { h: 62, tone: 'accent' },
];

const NAV = [
  { label: 'Home', on: true },
  { label: 'Discover', on: false },
  { label: 'My Library', on: false },
  { label: 'Community', on: false },
];

/** The 80% ring on the floating goal card. */
function GoalRing({ run }) {
  const r = 11;
  const circumference = 2 * Math.PI * r;
  const offset = run ? circumference * (1 - 0.8) : circumference;

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle
        className="lp-ring__track"
        cx="14"
        cy="14"
        r={r}
        fill="none"
        strokeWidth="3.5"
      />
      <circle
        className="lp-ring__value"
        cx="14"
        cy="14"
        r={r}
        fill="none"
        strokeWidth="3.5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 14 14)"
      />
    </svg>
  );
}

export default function HeroMockup() {
  const [ref, inView] = useInView(0.25);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="lp-mock">
        {/* ------------------------------------------------------ sidebar */}
        <div className="lp-mock__side">
          <div className="lp-mock__brand">
            <img className="lp-mock__mark" src={readhubMark} alt="" width="68" height="40" />
            <span>ReadHub</span>
            <span>Study</span>
          </div>

          <nav className="lp-mock__nav" aria-hidden="true">
            {NAV.map((item) => (
              <span key={item.label} className="lp-mock__navitem" data-on={String(item.on)}>
                <i />
                {item.label}
              </span>
            ))}
          </nav>
        </div>

        {/* --------------------------------------------------------- main */}
        <div className="lp-mock__main">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <p className="lp-mock__greet">Good morning, Amara</p>
              <p className="lp-mock__title">Ready to read?</p>
            </div>
            <span className="lp-mock__avatar">AM</span>
          </div>

          <div className="lp-mock__hero">
            <p className="lp-mock__kicker">Your reading journey</p>
            <p className="lp-mock__big">
              Small pages.
              <br />
              Big progress.
            </p>
            <p className="lp-mock__link">Continue reading →</p>

            <div className="lp-mock__stack" aria-hidden="true">
              <span className="lp-mock__cover" />
              <span className="lp-mock__cover" />
              <span className="lp-mock__cover" />
            </div>
          </div>

          <div className="lp-mock__row">
            <div className="lp-mock__card">
              <div className="lp-mock__cardhead">
                <span>Continue reading</span>
                <span>View all</span>
              </div>

              <div className="lp-mock__book">
                <span className="lp-mock__bookcover">A</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="lp-mock__booktitle">A Brief History of Time</p>
                  <p className="lp-mock__bookmeta">Stephen Hawking</p>
                  <div className="lp-meter">
                    <span
                      className="lp-meter__fill"
                      style={{ width: inView ? '64%' : 0 }}
                    />
                  </div>
                  <p className="lp-mock__bookmeta" style={{ marginTop: 4 }}>
                    64% complete
                  </p>
                </div>
              </div>
            </div>

            <div className="lp-mock__card">
              <div className="lp-mock__cardhead">
                <span>This week</span>
                <span style={{ color: 'var(--ink-4)', fontWeight: 600 }}>Oct 14&ndash;20</span>
              </div>

              <div className="lp-mock__bars" aria-hidden="true">
                {WEEK.map((bar, i) => (
                  <span
                    key={i}
                    className="lp-bar"
                    data-tone={bar.tone}
                    style={{
                      height: inView ? `${bar.h}%` : 0,
                      // Left to right, so the week reads as it is written.
                      transitionDelay: `${160 + i * 70}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The two cards that lift off the frame. Decorative framing for real
          features, so they are announced plainly rather than hidden. */}
      <div className="lp-float lp-float--goal">
        <GoalRing run={inView} />
        <div>
          <p className="lp-float__label">Weekly goal</p>
          <p className="lp-float__value">4 of 5 days complete</p>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--blue)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          80%
        </span>
      </div>

      <div className="lp-float lp-float--buddy">
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--navy)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.5625rem',
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          KO
        </span>
        <div>
          <p className="lp-float__label">Your reading buddy</p>
          <p className="lp-float__value">Korede sent encouragement!</p>
        </div>
        <FiTarget size={13} style={{ color: 'var(--orange)', flexShrink: 0 }} />
      </div>
    </div>
  );
}
