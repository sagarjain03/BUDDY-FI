import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import MatchRing from '../components/ui/MatchRing';
import MessageButton from '../components/ui/MessageButton';
import PresenceDot from '../components/ui/PresenceDot';
import { RevealGroup, RevealItem } from '../components/motion/Reveal';
import { apiFetch } from '../lib/api';
import { genderLabel } from '../lib/labels';

const TABS = [
  { key: 'buddies', label: 'Buddies', path: '/api/connections' },
  { key: 'requests', label: 'Requests', path: '/api/connections/pending' },
  { key: 'sent', label: 'Sent', path: '/api/connections/sent' },
];

const EMPTY = {
  buddies: {
    icon: '🤝',
    title: 'No buddies yet',
    description: 'Send someone a request from Discover and it will show up here once they accept.',
  },
  requests: {
    icon: '📭',
    title: 'No requests waiting',
    description: 'When someone asks to connect, you will find them here.',
  },
  sent: {
    icon: '📤',
    title: 'Nothing sent',
    description: 'Requests you send are listed here until the other person responds.',
  },
};

const PersonRow = ({ entry, children }) => (
  <RevealItem>
    <article className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <Avatar name={entry.user.name} seed={entry.user._id} avatar={entry.user.avatar} />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-bold">{entry.user.name}</h2>
        <p className="text-sm text-ink-500">
          {entry.user.age} &middot; {genderLabel(entry.user.gender)}
        </p>
        <PresenceDot user={entry.user} withLabel className="mt-0.5" />
        {entry.user.bio && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-600">{entry.user.bio}</p>
        )}
        {entry.shared?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.shared.slice(0, 3).map((label) => (
              <span key={label} className="chip bg-brand-50 text-brand-700">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {typeof entry.percent === 'number' && <MatchRing percent={entry.percent} size={52} />}

      <div className="shrink-0 sm:w-56">{children}</div>
    </article>
  </RevealItem>
);

const Buddies = () => {
  const [tab, setTab] = useState('buddies');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ incoming: 0, buddies: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const active = TABS.find((entry) => entry.key === tab);

  const loadCounts = useCallback(async () => {
    try {
      const result = await apiFetch('/api/connections/counts');
      setCounts(result.data);
    } catch {
      /* the badge is not worth surfacing an error for */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch(active.path);
      setItems(result.data.buddies || result.data.requests || []);
    } catch (err) {
      setError(err.message || 'Could not load that list');
    } finally {
      setLoading(false);
    }
  }, [active.path]);

  useEffect(() => {
    load();
    loadCounts();
  }, [load, loadCounts]);

  const act = async (connectionId, request) => {
    setBusyId(connectionId);
    setError('');
    try {
      await request();
      setItems((current) => current.filter((entry) => entry.connectionId !== connectionId));
      loadCounts();
    } catch (err) {
      setError(err.message || 'That did not work');
    } finally {
      setBusyId(null);
    }
  };

  const accept = (id) =>
    act(id, () => apiFetch(`/api/connections/${id}/accept`, { method: 'PATCH' }));
  const decline = (id) =>
    act(id, () => apiFetch(`/api/connections/${id}/decline`, { method: 'PATCH' }));
  const drop = (id) => act(id, () => apiFetch(`/api/connections/${id}`, { method: 'DELETE' }));

  return (
    <AppShell
      title="Your buddies"
      subtitle="People you have connected with, and the requests still waiting on an answer."
      width="narrow"
      actions={
        <Button to="/show-users" variant="outline">
          Find more people
        </Button>
      }
    >
      {error && <Alert tone="error" className="mb-6">{error}</Alert>}

      {/* Tabs -------------------------------------------------------- */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-ink-200 bg-white p-1">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === entry.key ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            {entry.label}
            {entry.key === 'requests' && counts.incoming > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  tab === entry.key ? 'bg-white text-ink-900' : 'bg-brand-500 text-white'
                }`}
              >
                {counts.incoming}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="card flex items-center gap-4 p-5">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          icon={EMPTY[tab].icon}
          title={EMPTY[tab].title}
          description={EMPTY[tab].description}
          action={
            <Button to="/show-users" variant="outline">
              Go to Discover
            </Button>
          }
        />
      )}

      {!loading && items.length > 0 && (
        <RevealGroup className="space-y-4">
          {items.map((entry) => (
            <PersonRow key={entry.connectionId} entry={entry}>
              {tab === 'buddies' && (
                <div className="flex gap-2">
                  <MessageButton userId={entry.user._id} className="flex-1" />
                  <Button
                    variant="ghost"
                    onClick={() => drop(entry.connectionId)}
                    disabled={busyId === entry.connectionId}
                  >
                    Remove
                  </Button>
                </div>
              )}

              {tab === 'requests' && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => accept(entry.connectionId)}
                    disabled={busyId === entry.connectionId}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => decline(entry.connectionId)}
                    disabled={busyId === entry.connectionId}
                  >
                    Decline
                  </Button>
                </div>
              )}

              {tab === 'sent' && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => drop(entry.connectionId)}
                  disabled={busyId === entry.connectionId}
                >
                  Withdraw
                </Button>
              )}
            </PersonRow>
          ))}
        </RevealGroup>
      )}

      {!loading && tab === 'buddies' && items.length > 0 && (
        <p className="mt-8 text-center text-sm text-ink-400">
          Looking for more?{' '}
          <Link to="/show-users" className="font-semibold text-brand-600 hover:text-brand-700">
            Browse Discover
          </Link>
        </p>
      )}
    </AppShell>
  );
};

export default Buddies;
