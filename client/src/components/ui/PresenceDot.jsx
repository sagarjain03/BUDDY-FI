import { presenceLabel } from '../../lib/labels';

const PresenceDot = ({ user, withLabel = false, className = '' }) => {
  const label = presenceLabel(user);
  if (!label) return null;

  const online = Boolean(user?.isOnline);

  if (!withLabel) {
    return (
      <span
        title={label}
        aria-label={label}
        className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
          online ? 'bg-accent-500' : 'bg-ink-300'
        } ${className}`}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-ink-400 ${className}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-accent-500' : 'bg-ink-300'}`}
      />
      {label}
    </span>
  );
};

export default PresenceDot;
