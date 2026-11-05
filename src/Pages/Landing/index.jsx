import { useMemo, useRef, useState } from 'react';
import {
  FiArrowRight,
  FiBarChart2,
  FiBookmark,
  FiCheck,
  FiCompass,
  FiHeart,
  FiMail,
  FiMenu,
  FiTarget,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

import readhubMark from '../../assets/landing/readhub-mark.svg';
import studentsReading from '../../assets/landing/students-reading.jpg';
import { FAQS } from './faq';
import HeroMockup from './HeroMockup';
import {
  scrollToSection,
  useActiveSection,
  useCountUp,
  useInView,
  useScrollReveal,
  useScrolled,
} from './hooks';
import './landing.css';

/**
 * What a visitor sees before they decide whether to sign up.
 *
 * Three things govern everything here.
 *
 * It owns its own colours. The app resolves light and dark into `data-theme`
 * on the root, and a marketing page that inverts on half the devices that open
 * it cannot be held to a single comp. Every value comes from the `.lp` scope in
 * landing.css, nothing reads an app token, and the two dark bands are dark
 * because the design says so.
 *
 * It is readable before any script runs. The reveal animation is switched on
 * from JavaScript, so a failed bundle costs a visitor the motion and not the
 * page. Nothing sits at `opacity: 0` hoping an observer turns up.
 *
 * Every link goes somewhere real. The comp carries a handful of destinations
 * that do not exist yet -- a blog, a help centre, a cookie policy -- and those
 * are left out rather than shipped pointing at nothing. The nav moves within
 * the page; the only places a visitor leaves for are sign-in and sign-up.
 */

const SECTIONS = ['top', 'features', 'community', 'about', 'faq'];

const NAV_LINKS = [
  { id: 'top', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'community', label: 'Community' },
  { id: 'about', label: 'About us' },
  { id: 'faq', label: 'FAQ' },
];

const FEATURES = [
  {
    n: '01',
    Icon: FiCompass,
    title: 'Discover books',
    body: 'Find books that match your interests, goals, and the person you are becoming.',
    visual: 'books',
  },
  {
    n: '02',
    Icon: FiUsers,
    title: 'Reading communities',
    body: 'Join thoughtful spaces where readers exchange ideas and grow together.',
    visual: 'community',
  },
  {
    n: '03',
    Icon: FiHeart,
    title: 'Ready Buddy',
    body: 'Meet a compatible reading partner who helps you stay encouraged and accountable.',
    visual: 'pair',
  },
  {
    n: '04',
    Icon: FiTarget,
    title: 'Reading goals',
    body: 'Turn big intentions into clear, achievable goals you can work towards every day.',
    visual: 'goal',
  },
  {
    n: '05',
    Icon: FiBarChart2,
    title: 'Progress tracking',
    body: 'See your reading rhythm, celebrate your streaks, and understand how far you have come.',
    visual: 'spark',
  },
  {
    n: '06',
    Icon: FiBookmark,
    title: 'Personal library',
    body: 'Keep what you are reading, what you have finished, and what comes next in one place.',
    visual: 'library',
  },
];

const STEPS = [
  {
    n: 1,
    Icon: FiUsers,
    title: 'Create your account',
    body: 'Tell us a little about you and set up your reading profile.',
  },
  {
    n: 2,
    Icon: FiCompass,
    title: 'Explore your experience',
    body: 'Discover books, communities, and readers who match your goals.',
  },
  {
    n: 3,
    Icon: FiBarChart2,
    title: 'Start reading & growing',
    body: 'Set your goals, track progress, and keep moving forward together.',
  },
];

const COMMUNITY_POINTS = [
  'Join thoughtful book discussions',
  'Take part in reading challenges',
  'Share ideas with curious minds',
  'Stay motivated and accountable',
];

const BUDDY_POINTS = [
  'Thoughtful reader matching',
  'Shared reading journeys',
  'Gentle accountability',
  'Real encouragement',
];

const FOOTER_COLUMNS = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: 'about' },
      { label: 'Contact', href: 'mailto:hello@readhub.study' },
      { label: 'Our Mission', to: 'about' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Features', to: 'features' },
      { label: 'Community', to: 'community' },
      { label: 'Reading Buddy', to: 'buddy' },
      { label: 'Get Started', route: '/signup' },
    ],
  },
  {
    title: 'Resources',
    links: [{ label: 'FAQs', to: 'faq' }],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', route: '/privacy' },
      { label: 'Terms of Service', route: '/terms' },
    ],
  },
  /*
    Only accounts that exist.

    The comp lists LinkedIn too, and there is no ReadHub LinkedIn page yet. A
    guessed handle is a link to a stranger's profile wearing our name, which is
    worse than a column one row short -- so it goes in when there is one to
    point at. Both URLs below are stripped of their share-sheet tracking
    parameters (?s=, ?obrf=), which are not part of the address.
  */
  {
    title: 'Social',
    links: [
      { label: 'Instagram', href: 'https://www.instagram.com/readhub8' },
      { label: 'X', href: 'https://x.com/readhub_study' },
    ],
  },
];

/* ------------------------------------------------------------- pieces */

function Arrow() {
  return <FiArrowRight className="lp-arrow" size={16} aria-hidden="true" />;
}

function Check() {
  return (
    <span className="lp-check" aria-hidden="true">
      <FiCheck size={11} strokeWidth={3} />
    </span>
  );
}

/**
 * The real mark, not a stand-in.
 *
 * ReadHubLogo.svg is a full lockup whose wordmark is painted near-white for a
 * dark ground, so dropping it straight onto this header would leave the words
 * invisible. The mark is cropped out of it by viewBox and the words are set
 * here in the page's own colours.
 */
function Logo({ onClick }) {
  return (
    <button type="button" className="lp-logo" onClick={onClick} aria-label="ReadHub Study, home">
      <img className="lp-logo__mark" src={readhubMark} alt="" width="68" height="40" />
      <span>
        ReadHub <span className="lp-logo__study">Study</span>
      </span>
    </button>
  );
}

/** The small illustration at the foot of each feature card. */
function CardVisual({ kind }) {
  const [ref, inView] = useInView(0.4);
  const books = useCountUp(12, inView);

  if (kind === 'books') {
    return (
      <div className="lp-minibooks" aria-hidden="true">
        <span className="lp-minibook" style={{ background: 'linear-gradient(160deg,#3b82f6,#2563eb)' }}>
          Atomic Habits
        </span>
        <span className="lp-minibook" style={{ background: 'linear-gradient(160deg,#fb7a45,#f15a29)' }}>
          Think Again
        </span>
        <span className="lp-minibook" style={{ background: 'linear-gradient(160deg,#27364d,#0f1a2e)' }}>
          Deep Work
        </span>
      </div>
    );
  }

  if (kind === 'community') {
    return (
      <div className="lp-chipbar" aria-hidden="true">
        <span className="lp-avatars">
          <span style={{ background: '#2563eb' }}>AM</span>
          <span style={{ background: '#f15a29' }}>PO</span>
          <span style={{ background: '#0f1a2e' }}>+9</span>
        </span>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--ink-2)' }}>
          Campus Book Circle
        </span>
      </div>
    );
  }

  if (kind === 'pair') {
    return (
      <div className="lp-chipbar lp-chipbar--warm" aria-hidden="true">
        <span className="lp-pairavatar" style={{ background: '#2563eb' }}>
          YOU
        </span>
        <FiHeart size={14} style={{ color: 'var(--orange)' }} />
        <span className="lp-pairavatar" style={{ background: '#0f1a2e' }}>
          KO
        </span>
      </div>
    );
  }

  if (kind === 'goal') {
    return (
      <div className="lp-goalbar" ref={ref} aria-hidden="true">
        <div className="lp-goalbar__row">
          <span className="lp-goalbar__n">{books}</span>
          <span className="lp-goalbar__t">books this year</span>
        </div>
        <div className="lp-goalbar__track">
          <span className="lp-goalbar__fill" style={{ width: inView ? '72%' : 0 }} />
        </div>
      </div>
    );
  }

  if (kind === 'spark') {
    const bars = [34, 46, 40, 58, 52, 96, 70];
    return (
      <div className="lp-sparkbars" ref={ref} aria-hidden="true">
        {bars.map((h, i) => (
          <span
            key={i}
            className="lp-bar"
            data-tone={i === 5 ? 'solid' : 'muted'}
            style={{ height: inView ? `${h}%` : 0, transitionDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    );
  }

  const lib = [
    { h: 72, c: '#f15a29' },
    { h: 92, c: '#2563eb' },
    { h: 54, c: '#0f1a2e' },
    { h: 80, c: '#f6c445' },
    { h: 44, c: '#93b9fb' },
  ];

  return (
    <div className="lp-libbars" ref={ref} aria-hidden="true">
      {lib.map((bar, i) => (
        <span
          key={i}
          className="lp-bar"
          style={{
            height: inView ? `${bar.h}%` : 0,
            background: bar.c,
            transitionDelay: `${i * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

function FaqItem({ item, open, onToggle, id }) {
  return (
    <div className="lp-acc__item">
      <h3>
        <button
          type="button"
          className="lp-acc__btn"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          onClick={onToggle}
        >
          {item.q}
          <span className="lp-acc__sign" aria-hidden="true" />
        </button>
      </h3>

      {/*
        Animated by grid-template-rows rather than max-height.

        An answer's height is not known in advance, and a max-height guess is
        either a jump when it is too small or a lazy open when it is too big.
        0fr to 1fr animates the real height with no measuring.
      */}
      <div
        className="lp-acc__panel"
        data-open={String(open)}
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        hidden={!open ? undefined : undefined}
      >
        <div className="lp-acc__panelinner">
          <p className="lp-acc__answer">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- page */

export default function Landing() {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const ids = useMemo(() => SECTIONS, []);
  const active = useActiveSection(ids);
  const stuck = useScrolled(8);

  useScrollReveal(rootRef);

  const go = (id) => {
    setMenuOpen(false);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    scrollToSection(id);
  };

  return (
    <div className="lp" ref={rootRef}>
      {/* --------------------------------------------------------- nav */}
      <header className="lp-nav" data-stuck={String(stuck)}>
        <div className="lp-shell lp-nav__inner">
          <Logo onClick={() => go('top')} />

          <nav className="lp-nav__links" aria-label="Sections">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className="lp-nav__link"
                data-active={String(active === link.id)}
                onClick={() => go(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="lp-nav__actions">
            <Link to="/login" className="lp-nav__login">
              Log in
            </Link>
            <Link to="/signup" className="lp-btn lp-btn--primary lp-btn--sm">
              Get started <Arrow />
            </Link>
          </div>

          <button
            type="button"
            className="lp-burger"
            aria-label={menuOpen ? 'Close the menu' : 'Open the menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lp-drawer">
            <div className="lp-drawer__inner">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="lp-drawer__link"
                  onClick={() => go(link.id)}
                >
                  {link.label}
                </button>
              ))}

              <div className="lp-drawer__actions">
                <Link to="/login" className="lp-btn lp-btn--ghost">
                  Log in
                </Link>
                <Link to="/signup" className="lp-btn lp-btn--primary">
                  Get started <Arrow />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        {/* ------------------------------------------------------ hero */}
        <section className="lp-hero">
          <span className="lp-hero__orb" aria-hidden="true" />

          <div className="lp-shell">
            <div className="lp-hero__grid">
              <div className="lp-hero__copy">
                <span className="lp-badge lp-reveal" style={{ '--d': '0ms' }}>
                  <span className="lp-badge__dot" />
                  Built for students who want to grow
                </span>

                <h1 className="lp-h1 lp-reveal" style={{ '--d': '70ms' }}>
                  Build a reading habit that takes you <span className="lp-mark">further.</span>
                </h1>

                <p className="lp-lead lp-reveal" style={{ '--d': '140ms', maxWidth: '34rem' }}>
                  Discover books, meet readers like you, find your reading buddy, and turn a good
                  intention into a habit that lasts.
                </p>

                <div className="lp-hero__ctas lp-reveal" style={{ '--d': '210ms' }}>
                  <Link to="/signup" className="lp-btn lp-btn--primary">
                    Get started for free <Arrow />
                  </Link>
                  <button type="button" className="lp-btn lp-btn--ghost" onClick={() => go('features')}>
                    Explore ReadHub <Arrow />
                  </button>
                </div>

                <div className="lp-hero__assurances lp-reveal" style={{ '--d': '280ms' }}>
                  <span className="lp-assurance">
                    <Check /> Free to get started
                  </span>
                  <span className="lp-assurance">
                    <Check /> Made for mobile
                  </span>
                </div>
              </div>

              <div className="lp-reveal" style={{ '--d': '160ms' }}>
                <HeroMockup />
              </div>
            </div>

            <div className="lp-strip lp-reveal" style={{ '--d': '360ms' }}>
              <p className="lp-strip__label">One place for every part of your reading life</p>
              <div className="lp-strip__items">
                {['Discover books', 'Set goals', 'Meet readers', 'Track progress'].map((item) => (
                  <span key={item} className="lp-strip__item">
                    <i /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- features */}
        <section className="lp-section" id="features">
          <div className="lp-shell">
            <div className="lp-head">
              <p className="lp-eyebrow lp-reveal">Your reading toolkit</p>
              <h2 className="lp-h2 lp-reveal" style={{ '--d': '60ms' }}>
                Everything you need to build a better reading habit.
              </h2>
              <p className="lp-lead lp-reveal" style={{ '--d': '120ms' }}>
                Reading gets easier when the right tools, people, and encouragement are all in one
                place.
              </p>
            </div>

            <div className="lp-cards">
              {FEATURES.map((feature, i) => (
                <article
                  key={feature.n}
                  className="lp-card lp-reveal"
                  style={{ '--d': `${i * 70}ms` }}
                >
                  <span className="lp-card__num">{feature.n}</span>
                  <span className="lp-card__icon">
                    <feature.Icon size={19} />
                  </span>
                  <h3 className="lp-card__title">{feature.title}</h3>
                  <p className="lp-body">{feature.body}</p>
                  <div className="lp-card__visual">
                    <CardVisual kind={feature.visual} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ how it works */}
        <section className="lp-section lp-section--wash">
          <div className="lp-shell">
            <div className="lp-head">
              <p className="lp-eyebrow lp-reveal">How it works</p>
              <h2 className="lp-h2 lp-reveal" style={{ '--d': '60ms' }}>
                Your next chapter is three simple steps away.
              </h2>
            </div>

            {/*
              Numbered, and the numbers are honest: this is a real sequence
              somebody performs in order, which is the only thing that earns
              a step marker.
            */}
            <ol className="lp-steps">
              {STEPS.map((step, i) => (
                <li key={step.n} className="lp-step lp-reveal" style={{ '--d': `${i * 110}ms` }}>
                  <span className="lp-step__badge">
                    <step.Icon size={22} />
                    <span className="lp-step__n">{step.n}</span>
                  </span>
                  <h3 className="lp-step__title">{step.title}</h3>
                  <p className="lp-body" style={{ maxWidth: '18rem' }}>
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>

            <div className="lp-steps__cta lp-reveal" style={{ '--d': '220ms' }}>
              <Link to="/signup" className="lp-btn lp-btn--primary">
                Start your reading journey <Arrow />
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- community */}
        <section className="lp-section" id="community">
          <div className="lp-shell">
            <div className="lp-split lp-split--flip">
              <figure className="lp-photo lp-reveal">
                <div className="lp-photo__frame">
                  <img
                    src={studentsReading}
                    alt="Two students reading side by side at a desk in a library"
                    loading="lazy"
                    decoding="async"
                    width="1200"
                    height="800"
                  />
                </div>

                <figcaption className="lp-photo__chip">
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: 'var(--blue-wash)',
                      color: 'var(--blue)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FiUsers size={14} />
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800 }}>
                      Learning together
                    </span>
                    <span style={{ fontSize: '0.625rem', color: 'var(--ink-4)' }}>
                      Ideas grow when they are shared
                    </span>
                  </span>
                </figcaption>
              </figure>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p className="lp-eyebrow lp-reveal">ReadHub community</p>
                <h2 className="lp-h3 lp-reveal" style={{ '--d': '60ms' }}>
                  Reading is better when we grow together.
                </h2>
                <p className="lp-lead lp-reveal" style={{ '--d': '120ms' }}>
                  Connect with students and readers who share your curiosity. Exchange ideas,
                  discuss books, join reading challenges, and find the encouragement to keep
                  showing up.
                </p>

                <ul className="lp-checklist lp-reveal" style={{ '--d': '180ms' }}>
                  {COMMUNITY_POINTS.map((point) => (
                    <li key={point}>
                      <Check /> {point}
                    </li>
                  ))}
                </ul>

                <div className="lp-reveal" style={{ '--d': '240ms' }}>
                  <Link to="/signup" className="lp-btn lp-btn--primary">
                    Join our community <Arrow />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------- ready buddy */}
        <section className="lp-section lp-section--navy" id="buddy">
          <div className="lp-shell">
            <div className="lp-split">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p className="lp-eyebrow lp-reveal">Ready Buddy</p>
                <h2 className="lp-h3 lp-reveal" style={{ '--d': '60ms', color: '#fff' }}>
                  Find someone who keeps you accountable.
                </h2>
                <p className="lp-lead lp-reveal" style={{ '--d': '120ms' }}>
                  Meet a compatible reader who understands your goals. Share a reading journey,
                  celebrate progress, and keep each other going when motivation dips.
                </p>

                <ul className="lp-checklist lp-reveal" style={{ '--d': '180ms' }}>
                  {BUDDY_POINTS.map((point) => (
                    <li key={point}>
                      <Check /> {point}
                    </li>
                  ))}
                </ul>

                <div className="lp-reveal" style={{ '--d': '240ms' }}>
                  <Link to="/signup" className="lp-btn lp-btn--white">
                    Find your reading buddy <Arrow />
                  </Link>
                </div>
              </div>

              <div className="lp-match lp-reveal" style={{ '--d': '140ms' }}>
                <div className="lp-match__head">
                  <span className="lp-match__kicker">Your reading match</span>
                  <span className="lp-match__pct">96% match</span>
                </div>

                <div className="lp-match__pair">
                  <div className="lp-match__who">
                    <span className="lp-match__ava" style={{ background: '#2563eb' }}>
                      AO
                    </span>
                    <span className="lp-match__name">You</span>
                  </div>

                  <span className="lp-match__heart" aria-hidden="true">
                    <FiHeart size={16} />
                  </span>

                  <div className="lp-match__who">
                    <span className="lp-match__ava" style={{ background: '#f15a29' }}>
                      KO
                    </span>
                    <span className="lp-match__name">Korede</span>
                  </div>
                </div>

                <div className="lp-tags">
                  <span className="lp-tag">Personal growth</span>
                  <span className="lp-tag">Evening reader</span>
                  <span className="lp-tag">3 books/month</span>
                </div>

                <div className="lp-quotebox">
                  <span className="lp-quotebox__q" aria-hidden="true">
                    &ldquo;
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        color: '#cbd5e1',
                      }}
                    >
                      Korede
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#9fb0c9' }}>
                      &ldquo;Ready for chapter four today?&rdquo;
                    </span>
                  </span>
                  <span style={{ fontSize: '0.625rem', color: '#6b7a93', flexShrink: 0 }}>2m</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- why we exist */}
        <section className="lp-section" id="about">
          <div className="lp-shell">
            <div className="lp-why">
              <div className="lp-wordcard lp-reveal">
                <span className="lp-wordcard__orb" aria-hidden="true" />
                <p className="lp-wordcard__word">Read.</p>
                <p className="lp-wordcard__word" style={{ color: 'var(--blue)' }}>
                  Connect.
                </p>
                <p className="lp-wordcard__word" style={{ color: 'var(--orange)' }}>
                  Become.
                </p>
                <span className="lp-wordcard__rule" aria-hidden="true" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p className="lp-eyebrow lp-reveal">Why we exist</p>
                <h2 className="lp-h3 lp-reveal" style={{ '--d': '60ms' }}>
                  Every student deserves the opportunity to become better.
                </h2>
                <p className="lp-body lp-reveal" style={{ '--d': '120ms' }}>
                  Reading can change how students think, learn, and approach life. But building the
                  habit can be hard when you have to do it alone.
                </p>
                <p className="lp-body lp-reveal" style={{ '--d': '160ms' }}>
                  We are creating an environment where reading feels easier, more engaging, and more
                  consistent &mdash; through books, community, and accountability.
                </p>
                <blockquote className="lp-quote lp-reveal" style={{ '--d': '200ms' }}>
                  &ldquo;We&rsquo;re not just building a reading platform. We&rsquo;re building a
                  community of students becoming more.&rdquo;
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- faq */}
        <section className="lp-section lp-section--wash" id="faq">
          <div className="lp-shell">
            <div className="lp-faq">
              <div className="lp-faq__aside">
                <p className="lp-eyebrow lp-reveal">FAQ</p>
                <h2 className="lp-h3 lp-reveal" style={{ '--d': '60ms' }}>
                  Questions? We&rsquo;ve got answers.
                </h2>
                <p className="lp-body lp-reveal" style={{ '--d': '120ms' }}>
                  Everything you need to know before beginning your reading journey.
                </p>

                <div className="lp-contactcard lp-reveal" style={{ '--d': '180ms' }}>
                  <p className="lp-contactcard__t">Still have a question?</p>
                  <p className="lp-body" style={{ fontSize: '0.8125rem' }}>
                    We&rsquo;d love to hear from you.
                  </p>
                  <a className="lp-contactcard__mail" href="mailto:hello@readhub.study">
                    <FiMail size={14} /> hello@readhub.study
                  </a>
                </div>
              </div>

              <div className="lp-acc lp-reveal" style={{ '--d': '80ms' }}>
                {FAQS.map((item, i) => (
                  <FaqItem
                    key={item.q}
                    id={`lp-faq-${i}`}
                    item={item}
                    open={openFaq === i}
                    // One at a time: a wall of open answers is a wall of text,
                    // and closing the current one is what makes the next land.
                    onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- closing cta */}
        {/*
            Full padding above, not zero.

            Killing the top padding to avoid "double" spacing against the FAQ
            section instead left the blue band hard against the section edge,
            which reads as a mistake rather than as tightening.
        */}
        <section className="lp-section">
          <div className="lp-shell">
            <div className="lp-cta lp-reveal">
              <span className="lp-cta__orb lp-cta__orb--a" aria-hidden="true" />
              <span className="lp-cta__orb lp-cta__orb--b" aria-hidden="true" />

              <div className="lp-cta__inner">
                <p className="lp-cta__kicker">Start today</p>
                <h2 className="lp-h2" style={{ color: '#fff' }}>
                  Your next reading chapter starts here.
                </h2>
                <p
                  style={{
                    maxWidth: '38rem',
                    lineHeight: 1.65,
                    color: 'rgb(255 255 255 / 0.88)',
                    // Otherwise "further." drops onto a line of its own.
                    textWrap: 'balance',
                  }}
                >
                  Discover books, find your people, and build a reading habit that takes you
                  further.
                </p>

                <div className="lp-cta__actions">
                  <Link to="/signup" className="lp-btn lp-btn--white">
                    Join ReadHub today <Arrow />
                  </Link>
                  <Link to="/login" className="lp-btn lp-btn--onblue">
                    Already a member? Log in <Arrow />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------- footer */}
      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <p className="lp-footer__name">ReadHub Study</p>
              <p className="lp-footer__blurb">
                Reading, community and accountability for university students.
              </p>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="lp-footer__coltitle">{column.title}</p>
                <div className="lp-footer__links">
                  {column.links.map((link) => {
                    if (link.route) {
                      return (
                        <Link key={link.label} to={link.route} className="lp-footer__link">
                          {link.label}
                        </Link>
                      );
                    }

                    if (link.href) {
                      return (
                        <a
                          key={link.label}
                          href={link.href}
                          className="lp-footer__link"
                          {...(link.href.startsWith('http')
                            ? { target: '_blank', rel: 'noreferrer noopener' }
                            : {})}
                        >
                          {link.label}
                        </a>
                      );
                    }

                    return (
                      <button
                        key={link.label}
                        type="button"
                        className="lp-footer__link"
                        onClick={() => go(link.to)}
                      >
                        {link.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <hr className="lp-footer__rule" />
          <p className="lp-footer__legal">
            &copy; {new Date().getFullYear()} ReadHub Study. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
