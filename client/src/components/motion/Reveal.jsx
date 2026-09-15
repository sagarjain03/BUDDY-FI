import { motion } from 'framer-motion';
import { fadeUp, fadeIn, scaleIn, stagger, inView, usePrefersReducedMotion } from '../../lib/motion';

const VARIANTS = { fadeUp, fadeIn, scaleIn };

/**
 * Animates its children in when they scroll into view, once.
 *
 * Falls back to a plain element when the visitor prefers reduced motion, so
 * nothing ever depends on the animation having run.
 */
const Reveal = ({
  children,
  variant = 'fadeUp',
  delay = 0,
  as = 'div',
  className = '',
  ...props
}) => {
  const reduced = usePrefersReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduced) {
    const Plain = as;
    return (
      <Plain className={className} {...props}>
        {children}
      </Plain>
    );
  }

  const base = VARIANTS[variant] || fadeUp;
  const variants = delay
    ? {
        hidden: base.hidden,
        show: { ...base.show, transition: { ...base.show.transition, delay } },
      }
    : base;

  return (
    <Tag className={className} variants={variants} {...inView} {...props}>
      {children}
    </Tag>
  );
};

/**
 * Reveals a list: the parent stages the timing, each `Reveal.Item` child rides
 * the stagger. Use for card grids.
 */
export const RevealGroup = ({
  children,
  className = '',
  staggerChildren = 0.08,
  delayChildren = 0,
  as = 'div',
  ...props
}) => {
  const reduced = usePrefersReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduced) {
    const Plain = as;
    return (
      <Plain className={className} {...props}>
        {children}
      </Plain>
    );
  }

  return (
    <Tag
      className={className}
      variants={stagger(staggerChildren, delayChildren)}
      {...inView}
      {...props}
    >
      {children}
    </Tag>
  );
};

export const RevealItem = ({ children, className = '', variant = 'fadeUp', as = 'div', ...props }) => {
  const reduced = usePrefersReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduced) {
    const Plain = as;
    return (
      <Plain className={className} {...props}>
        {children}
      </Plain>
    );
  }

  return (
    <Tag className={className} variants={VARIANTS[variant] || fadeUp} {...props}>
      {children}
    </Tag>
  );
};

export default Reveal;
