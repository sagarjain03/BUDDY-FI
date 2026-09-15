import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import { apiFetch } from '../../lib/api';
import { acquireSocket, releaseSocket } from '../../lib/socket';
import { EASE, usePrefersReducedMotion } from '../../lib/motion';

const COPY = {
  connection_request: (name) => `${name} wants to connect`,
  connection_accepted: (name) => `${name} accepted your request`,
  new_message: (name) => `${name} sent you a message`,
  new_match: (name) => `${name} looks like a strong match`,
};

const destination = (notification) => {
  if (notification.type === 'new_message' && notification.entity?.id) {
    return `/chat/${notification.entity.id}`;
  }
  if (notification.type.startsWith('connection')) return '/buddies';
  return '/show-users';
};

const relative = (value) => {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const load = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        apiFetch('/api/notifications'),
        apiFetch('/api/notifications/unread-count'),
      ]);
      setItems(list.data.notifications.slice(0, 10));
      setUnread(count.data.unread);
    } catch {
      /* the bell is not worth an error state */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live, so a request that arrives while you are sitting on a page shows up.
  useEffect(() => {
    const socket = acquireSocket();
    const onNew = () => load();

    socket.on('notification:new', onNew);
    return () => {
      socket.off('notification:new', onNew);
      releaseSocket();
    };
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;

    const onClickAway = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);

    document.addEventListener('mousedown', onClickAway);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openItem = async (notification) => {
    setOpen(false);
    apiFetch(`/api/notifications/${notification._id}/read`, { method: 'PATCH' })
      .then(load)
      .catch(() => {});
    navigate(destination(notification));
  };

  const markAll = async () => {
    await apiFetch('/api/notifications/read', { method: 'PATCH' }).catch(() => {});
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="btn btn-ghost relative h-10 w-10 text-lg"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute right-0 z-30 mt-1 w-80 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <span className="text-sm font-bold">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-ink-400">Nothing yet.</p>
              )}

              {items.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => openItem(notification)}
                  className={`flex w-full items-center gap-3 border-b border-ink-100 px-4 py-3 text-left transition-colors hover:bg-ink-50 ${
                    notification.readAt ? '' : 'bg-brand-50/60'
                  }`}
                >
                  <Avatar
                    name={notification.actor?.name}
                    seed={notification.actor?._id}
                    avatar={notification.actor?.avatar}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-800">
                      {(COPY[notification.type] || (() => 'Something happened'))(
                        notification.actor?.name || 'Someone'
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-400">
                      {relative(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-center text-sm font-semibold text-brand-600 hover:bg-ink-50"
            >
              See all
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
