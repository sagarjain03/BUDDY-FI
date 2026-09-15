import { useEffect, useState } from 'react';

/**
 * Shared motion vocabulary. Every animated component pulls its timing and
 * easing from here so the whole app moves the same way.
 */

// A gentle overshoot-free ease, good for UI that should feel quick but calm.
export const EASE = [0.16, 1, 0.3, 1];
export const EASE_OUT = [0.22, 1, 0.36, 1];

export const DURATION = {
  fast: 0.28,
  base: 0.5,
  slow: 0.8,
};

/** Fade and rise. The default entrance for almost everything. */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE },
  },
};

/** Put on a parent to stagger its children's `show` variants. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** Props for "animate once, when it scrolls into view". */
export const inView = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.25 },
};

/** Route-level transition used by the page wrapper. */
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.fast, ease: EASE } },
};

/** Card lift used on hover across Discover, quick actions and feature cards. */
export const hoverLift = {
  rest: { y: 0, transition: { duration: DURATION.fast, ease: EASE } },
  hover: { y: -6, transition: { duration: DURATION.fast, ease: EASE } },
};

/**
 * True when the visitor asked their OS to reduce motion. Every animated
 * component should fall back to something static when this is true.
 */
export function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setPrefers(event.matches);

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return prefers;
}
