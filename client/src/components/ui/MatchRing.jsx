import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { EASE, usePrefersReducedMotion } from '../../lib/motion';

const toneFor = (percent) => {
  if (percent >= 75) return { stroke: '#17B79A', text: 'text-accent-600' };
  if (percent >= 45) return { stroke: '#FF5A1F', text: 'text-brand-600' };
  return { stroke: '#A7B0CB', text: 'text-ink-400' };
};

/**
 * Compatibility ring. Draws its arc once when it scrolls into view.
 */
const MatchRing = ({ percent = 0, size = 64, stroke = 5, label }) => {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const visible = useInView(ref, { once: true, amount: 0.6 });

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone = toneFor(clamped);
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      ref={ref}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${clamped}% match${label ? ` — ${label}` : ''}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E9EBF2"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduced ? offset : circumference }}
          animate={{ strokeDashoffset: reduced || visible ? offset : circumference }}
          transition={{ duration: 1, ease: EASE }}
        />
      </svg>

      <span
        className={`absolute inset-0 flex items-center justify-center font-display font-bold ${tone.text}`}
        style={{ fontSize: size * 0.26 }}
      >
        {clamped}%
      </span>
    </div>
  );
};

export default MatchRing;
