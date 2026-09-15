import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import NotificationBell from './NotificationBell';
import { apiFetch, clearToken } from '../../lib/api';
import { acquireSocket, releaseSocket, resetSocket } from '../../lib/socket';

const LINKS = [
  { to: '/show-users', label: 'Discover' },
  { to: '/buddies', label: 'Buddies', badge: 'incoming' },
  { to: '/chat', label: 'Chat', badge: 'unread' },
  { to: '/profile', label: 'Profile' },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
  }`;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ incoming: 0, buddies: 0, unread: 0 });
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const refresh = useCallback(async () => {
    const [connections, messages] = await Promise.all([
      apiFetch('/api/connections/counts').catch(() => ({ data: {} })),
      apiFetch('/api/conversations/unread-count').catch(() => ({ data: {} })),
    ]);

    setCounts({
      incoming: connections.data.incoming || 0,
      buddies: connections.data.buddies || 0,
      unread: messages.data.unread || 0,
    });
  }, []);

  // Refresh on navigation so accepting a request updates the badge without a
  // full reload. The badges are not worth an error state, so failures are
  // swallowed rather than surfaced.
  useEffect(() => {
    refresh().catch(() => {});
  }, [pathname, refresh]);

  // Also refresh live, otherwise a message that arrives while you are sitting
  // on a page leaves the badge stale until you navigate.
  useEffect(() => {
    const socket = acquireSocket();
    const onChange = () => refresh().catch(() => {});

    socket.on('conversation:updated', onChange);
    socket.on('message:new', onChange);

    return () => {
      socket.off('conversation:updated', onChange);
      socket.off('message:new', onChange);
      releaseSocket();
    };
  }, [refresh]);

  const logout = async () => {
    // Best effort: if the request fails the local token still goes, but the
    // server call is what actually ends the session.
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    resetSocket();
    clearToken();
    navigate('/login', { replace: true });
  };

  const badgeFor = (link) => (link.badge ? counts[link.badge] : 0);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo to="/welcome" />

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
              {badgeFor(link) > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                  {badgeFor(link)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <NotificationBell />
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="btn btn-ghost relative h-10 w-10 md:hidden"
        >
          <span className="text-xl leading-none">{open ? '×' : '≡'}</span>
          {!open && counts.incoming > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
                {badgeFor(link) > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                    {badgeFor(link)}
                  </span>
                )}
              </NavLink>
            ))}
            <NavLink to="/notifications" className={linkClass} onClick={() => setOpen(false)}>
              Notifications
            </NavLink>
            <NavLink to="/location" className={linkClass} onClick={() => setOpen(false)}>
              Location
            </NavLink>
            <NavLink
              to="/settings/notifications"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              Settings
            </NavLink>
            <Button variant="outline" className="mt-2" onClick={logout}>
              Log out
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
