import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const Footer = () => (
  <footer className="border-t border-ink-100 bg-white">
    <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Logo />
        <p className="mt-2 max-w-xs text-sm text-ink-500">
          Friendship first. Seven questions, then meet people who actually match your vibe.
        </p>
      </div>

      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
        <Link to="/" className="hover:text-ink-900">
          Home
        </Link>
        <Link to="/register" className="hover:text-ink-900">
          Sign up
        </Link>
        <Link to="/login" className="hover:text-ink-900">
          Log in
        </Link>
        <Link to="/guidelines" className="hover:text-ink-900">
          Guidelines
        </Link>
        <Link to="/privacy" className="hover:text-ink-900">
          Privacy
        </Link>
        <Link to="/terms" className="hover:text-ink-900">
          Terms
        </Link>
      </nav>
    </div>

    <div className="border-t border-ink-100">
      <div className="container-page py-4 text-xs text-ink-400">
        &copy; {new Date().getFullYear()} BUDDYFI. Built for people who want real friends.
      </div>
    </div>
  </footer>
);

export default Footer;
