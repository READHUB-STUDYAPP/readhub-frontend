import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * Motion helpers for the landing page.
 *
 * Two rules run through all of them:
 *
 *   The page is readable before any of this runs. Nothing is parked at
 *   `opacity: 0` in the stylesheet waiting to be rescued by an observer -- the
 *   hidden state is switched on from here, once we know an observer will
 *   actually run. A script that fails should cost the visitor an animation,
 *   not the page.
 *
 *   Reduced motion is honoured by not starting, rather than by animating fast.
 */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const canObserve = () => typeof window !== 'undefined' && 'IntersectionObserver' in window;

/**
 * Turns the scroll-reveal on for a whole subtree and plays each piece once.
 *
 * Takes a ref to the root rather than wrapping every element in a component:
 * the markup stays plain, and a section is opted in by a class name.
 */
export function useScrollReveal(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    // Leave everything visible. This is the branch where the page still works.
    if (prefersReducedMotion() || !canObserve()) return undefined;

    root.dataset.reveal = 'on';

    const waiting = new Set(root.querySelectorAll('.lp-reveal'));

    const show = (el) => {
      el.dataset.shown = 'true';
      waiting.delete(el);
      // Once seen, done. Re-animating on the way back up is distracting.
      observer.unobserve(el);
      if (waiting.size === 0) {
        window.removeEventListener('scroll', sweep);
        window.removeEventListener('resize', sweep);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) show(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    );

    /*
      The net under the observer, and the page depends on it.

      An IntersectionObserver only reports a *change* in intersection. Scroll
      hard enough -- a flung phone, a Home/End key, a restored scroll position
      -- and an element can go from "below the fold" to "above the fold"
      between two deliveries without ever being reported as intersecting. No
      callback fires, `data-shown` is never set, and because the reveal starts
      at `opacity: 0` that element stays invisible for the rest of the visit.
      Testing this page headlessly, 33 of 46 pieces vanished exactly that way.

      So anything whose top has passed the bottom of the viewport is shown,
      whether or not the observer ever mentioned it. The listener removes
      itself once nothing is left waiting.
    */
    const sweep = () => {
      const limit = window.innerHeight;
      for (const el of [...waiting]) {
        if (el.getBoundingClientRect().top < limit) show(el);
      }
    };

    for (const el of waiting) observer.observe(el);
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });

    /*
      And once on the next frame, without waiting to be scrolled.

      A browser restoring a scroll position on reload puts the reader halfway
      down the page having fired no scroll event at all. The observer covers
      what is on screen; this covers everything already above it, which would
      otherwise stay invisible until the reader happened to scroll up.
    */
    const first = requestAnimationFrame(sweep);

    return () => {
      cancelAnimationFrame(first);
      observer.disconnect();
      window.removeEventListener('scroll', sweep);
      window.removeEventListener('resize', sweep);
    };
  }, [rootRef]);
}

/**
 * Whether one element has been on screen yet.
 *
 * The node is held in state rather than a ref on purpose. A ref callback runs
 * before effects, so an effect keyed on `ref.current` can read null on the pass
 * that mattered and quietly never observe anything -- a bug this project has
 * already paid for once, in the reader.
 */
export function useInView(threshold = 0.3) {
  const [node, setNode] = useState(null);
  // Without an observer there is no "later", so the answer is yes from the
  // start. Decided here rather than in an effect, which would mean one render
  // with everything hidden on exactly the browsers that cannot reveal it.
  const [inView, setInView] = useState(() => !canObserve());

  useEffect(() => {
    if (!node || inView) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, inView, threshold]);

  return [setNode, inView];
}

/**
 * Counts up to a number once it is on screen.
 *
 * Driven by requestAnimationFrame against the clock rather than a per-frame
 * increment, so it takes the same time on a 120Hz phone as on a slow laptop.
 */
export function useCountUp(target, run, duration = 1100) {
  /*
    Starts at zero whenever it is going to animate, and at the destination
    whenever it is not -- keyed on the motion preference rather than on `run`.
    Keying it on `run` would seed the final number while the card is still off
    screen, and the count would then snap back to zero the moment it scrolled
    into view: a visible glitch, on exactly the element meant to draw the eye.
  */
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (!run || prefersReducedMotion()) return undefined;

    let frame = 0;
    const started = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - started) / duration);
      // Ease out: fast at the start, settling rather than stopping dead.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, target, duration]);

  return value;
}

/** True once the page has scrolled past `offset`. Drives the sticky header. */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);

  return scrolled;
}

/**
 * Which section is under the header right now, for the nav underline.
 *
 * Reads scroll position rather than using an observer because the answer is
 * "the last section whose top has passed", which a threshold cannot express.
 */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const onScroll = () => {
      // Just below the sticky header, so a section counts once it is readable.
      const line = window.scrollY + 140;
      let current = ids[0];

      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= line) current = id;
      }

      // At the very bottom the last section may be too short to ever reach the
      // line; nothing below it can be active, so it is.
      const atEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
      setActive(atEnd ? ids[ids.length - 1] : current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ids]);

  return active;
}

/** Smooth-scrolls to a section, respecting a reduced-motion preference. */
export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}
