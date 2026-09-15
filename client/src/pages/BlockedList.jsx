import { useCallback, useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import { apiFetch } from '../lib/api';

const BlockedList = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch('/api/blocks');
      setBlocks(result.data.blocks);
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not load your block list' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (userId) => {
    setBusyId(userId);
    setStatus(null);
    try {
      await apiFetch(`/api/blocks/${userId}`, { method: 'DELETE' });
      setBlocks((current) => current.filter((entry) => entry.user._id !== userId));
      setStatus({ tone: 'success', text: 'Unblocked. Your old connection does not come back.' });
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not unblock them' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell
      title="Blocked members"
      subtitle="They cannot see you, message you, or send you a request — and you cannot see them."
      width="narrow"
      actions={
        <Button to="/profile" variant="outline">
          Back to profile
        </Button>
      }
    >
      {status && (
        <Alert tone={status.tone} className="mb-6">
          {status.text}
        </Alert>
      )}

      {loading && (
        <div className="space-y-4">
          {[0, 1].map((key) => (
            <div key={key} className="card flex items-center gap-4 p-5">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && blocks.length === 0 && (
        <EmptyState
          icon="🛡️"
          title="You have not blocked anyone"
          description="If someone bothers you, the menu on their profile or in a conversation will block and report them."
          action={
            <Button to="/show-users" variant="outline">
              Back to discover
            </Button>
          }
        />
      )}

      {!loading && blocks.length > 0 && (
        <div className="space-y-4">
          {blocks.map((entry) => (
            <article key={entry._id} className="card flex items-center gap-4 p-5">
              <Avatar name={entry.user.name} seed={entry.user._id} avatar={entry.user.avatar} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold">{entry.user.name}</h2>
                <p className="text-sm text-ink-500">
                  Blocked {new Date(entry.blockedAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => unblock(entry.user._id)}
                disabled={busyId === entry.user._id}
              >
                {busyId === entry.user._id ? 'Working…' : 'Unblock'}
              </Button>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default BlockedList;
