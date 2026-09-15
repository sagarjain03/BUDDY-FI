import { avatarSrc } from '../../lib/labels';

// Deterministic colour per person so the same user always gets the same avatar.
const PALETTE = [
  'bg-brand-500',
  'bg-accent-500',
  'bg-ink-700',
  'bg-brand-700',
  'bg-accent-600',
  'bg-ink-500',
];

const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || '?';

const hashOf = (value = '') =>
  [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-28 w-28 text-3xl',
};

/**
 * Shows the member's photo when there is one, and falls back to a coloured
 * initials circle. The fallback is what every new member sees, so it has to
 * look deliberate rather than broken.
 */
const Avatar = ({ name, seed, avatar, size = 'md', className = '' }) => {
  const sizeClass = SIZES[size] || SIZES.md;
  const src = avatarSrc(avatar);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`shrink-0 rounded-full object-cover ${sizeClass} ${className}`}
      />
    );
  }

  const color = PALETTE[hashOf(seed || name || '') % PALETTE.length];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${color} ${sizeClass} ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
};

export default Avatar;
