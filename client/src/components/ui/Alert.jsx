const TONES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-accent-400/40 bg-accent-400/10 text-accent-600',
  info: 'border-ink-200 bg-ink-50 text-ink-700',
};

const Alert = ({ tone = 'info', children, className = '' }) => {
  if (!children) return null;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </div>
  );
};

export default Alert;
