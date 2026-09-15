import { FaGoogle, FaFacebookF, FaInstagram } from 'react-icons/fa';

const PROVIDERS = [
  { label: 'Google', Icon: FaGoogle },
  { label: 'Facebook', Icon: FaFacebookF },
  { label: 'Instagram', Icon: FaInstagram },
];

/**
 * Placeholder social buttons. They are disabled until the OAuth flows exist,
 * rather than looking clickable and doing nothing.
 */
const SocialLogin = () => (
  <div>
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-ink-100" />
      <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
        or continue with
      </span>
      <span className="h-px flex-1 bg-ink-100" />
    </div>

    <div className="grid grid-cols-3 gap-3">
      {PROVIDERS.map(({ label, Icon }) => (
        <button
          key={label}
          type="button"
          disabled
          title={`${label} sign-in is coming soon`}
          className="btn btn-outline btn-md"
          aria-label={`Continue with ${label} (coming soon)`}
        >
          <Icon className="text-base" />
        </button>
      ))}
    </div>
  </div>
);

export default SocialLogin;
