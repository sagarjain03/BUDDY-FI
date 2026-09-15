import { Link } from 'react-router-dom';

const LogoMark = ({ className = '' }) => (
  <svg viewBox="0 0 40 32" className={className} aria-hidden="true">
    <circle cx="14" cy="12" r="9" fill="#FF5A1F" />
    <circle cx="26" cy="12" r="9" fill="#17B79A" fillOpacity="0.85" />
    <path
      d="M6 29c2.4-4.6 7.4-7 14-7s11.6 2.4 14 7"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const Logo = ({ to = '/', tone = 'dark', className = '' }) => {
  const text = tone === 'light' ? 'text-white' : 'text-ink-900';

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight ${text} ${className}`}
    >
      <LogoMark className="h-7 w-[34px]" />
      BUDDYFI
    </Link>
  );
};

export default Logo;
