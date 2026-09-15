import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pageTransition, usePrefersReducedMotion } from '../../lib/motion';

/**
 * Fades each route in. Also resets scroll position and refreshes GSAP's
 * ScrollTrigger measurements, which would otherwise be stale after a route
 * swaps the page height out from under them.
 */
const PageTransition = ({ children }) => {
  const reduced = usePrefersReducedMotion();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Let the new page lay out before ScrollTrigger re-measures it.
    const id = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  if (reduced) return children;

  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
