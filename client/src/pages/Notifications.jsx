import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { apiFetch } from '../lib/api';

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

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch('/api/notifications');
      setItems(result.data.notifications);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err.message || 'Could not load your notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadOlder = async () => {
    if (items.length === 0) return;
    try {
      const result = await apiFetch(
        `/api/notifications?before=${items[items.length - 1].createdAt}`
      );
      setItems((current) => [...current, ...result.data.notifications]);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err.message || 'Could not load more');
    }
  };

  const markAll = async () => {
    await apiFetch('/api/notifications/read', { method: 'PATCH' }).catch(() => {});
    load();
  };

  const unread = items.filter((entry) => !entry.readAt).length;

  return (
    <AppShell
      title="Notifications"
      subtitle="Requests, replies and anything else worth knowing."
      width="narrow"
      actions={
        unread > 0 ? (
          <Button variant="outline" onClick={markAll}>
            Mark all read
          </Button>
        ) : null
      }
    >
      {error && (
        <Alert tone="error" className="mb-6">
          {error}
        </Alert>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="card flex items-center gap-4 p-5">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-2.5 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          icon="🔔"
          title="Nothing yet"
          description="When someone connects with you or sends a message, it shows up here."
          action={
            <Button to="/show-users" variant="outline">
              Find people
            </Button>
          }
        />
      )}

      {!loading && items.length > 0 && (
        <>
          <RevealGroup className="space-y-3" staggerChildren={0.05}>
            {items.map((notification) => (
              <RevealItem key={notification._id}>
                <Link
                  to={destination(notification)}
                  className={`card flex items-center gap-4 p-5 transition-colors hover:bg-ink-50 ${
                    notification.readAt ? '' : 'border-brand-200 bg-brand-50/60'
                  }`}
                >
                  <Avatar
                    name={notification.actor?.name}
                    seed={notification.actor?._id}
                    avatar={notification.actor?.avatar}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink-800">
                      {(COPY[notification.type] || (() => 'Something happened'))(
                        notification.actor?.name || 'Someone'
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </span>
                  {!notification.readAt && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  )}
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>

          {hasMore && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={loadOlder}>
                Load older
              </Button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};

export default Notifications;
