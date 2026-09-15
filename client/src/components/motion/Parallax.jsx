import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from '../../lib/motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll parallax layer.
 *
 * `speed` is how far the layer drifts, as a fraction of its own height, across
 * the full scroll of its parent:
 *   > 0  lags behind the page — the usual background feel (0.15–0.35 reads well)
 *   < 0  runs ahead of the page — foreground elements
 *   0    no movement
 *
 * The layer is scaled up slightly so the drift never exposes an edge. Disabled
 * entirely when the visitor prefers reduced motion.
 */
const Parallax = ({
  children,
  speed = 0.2,
  className = '',
  cover = true,
  scrub = 0.6,
  ...props
}) => {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const element = ref.current;
    if (reduced || !element || speed === 0) return undefined;

    // Scoped so every tween and ScrollTrigger is reverted together on unmount.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        { yPercent: -speed * 50 },
        {
          yPercent: speed * 50,
          ease: 'none',
          scrollTrigger: {
            trigger: element.parentElement || element,
            start: 'top bottom',
            end: 'bottom top',
            scrub,
            invalidateOnRefresh: true,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [speed, scrub, reduced]);

  const style =
    reduced || speed === 0
      ? undefined
      : { willChange: 'transform', transform: cover ? `scale(${1 + Math.abs(speed)})` : undefined };

  return (
    <div ref={ref} className={className} style={style} {...props}>
      {children}
    </div>
  );
};

export default Parallax;
