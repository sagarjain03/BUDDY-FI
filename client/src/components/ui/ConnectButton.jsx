import { useState } from 'react';
import Button from './Button';
import { apiFetch } from '../../lib/api';

/**
 * The one control for every connection state. It owns its own optimistic
 * update and rolls back if the request fails, so callers only have to hand it
 * the current status and be told when it changes.
 *
 * status: 'none' | 'pending_out' | 'pending_in' | 'accepted'
 */
const ConnectButton = ({ userId, connection, onChange, fullWidth = false, size = 'md' }) => {
  const [state, setState] = useState(connection || { status: 'none', id: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (optimistic, request) => {
    const previous = state;
    setError('');
    setBusy(true);
    setState(optimistic);

    try {
      const result = await request();
      const next = result?.data?.connection || optimistic;
      setState(next);
      onChange?.(next);
    } catch (err) {
      setState(previous); // roll back
      setError(err.message || 'That did not work');
    } finally {
      setBusy(false);
    }
  };

  const sendRequest = () =>
    run({ status: 'pending_out', id: null }, () =>
      apiFetch('/api/connections', { method: 'POST', body: { userId } })
    );

  const acceptRequest = () =>
    run({ status: 'accepted', id: state.id }, () =>
      apiFetch(`/api/connections/${state.id}/accept`, { method: 'PATCH' })
    );

  const declineRequest = () =>
    run({ status: 'none', id: null }, () =>
      apiFetch(`/api/connections/${state.id}/decline`, { method: 'PATCH' })
    );

  const withdrawRequest = () =>
    run({ status: 'none', id: null }, () =>
      apiFetch(`/api/connections/${state.id}`, { method: 'DELETE' })
    );

  const removeConnection = () =>
    run({ status: 'none', id: null }, () =>
      apiFetch(`/api/connections/${state.id}`, { method: 'DELETE' })
    );

  const body = (() => {
    switch (state.status) {
      case 'accepted':
        return (
          <div className="flex gap-2">
            <span className="btn btn-md flex-1 cursor-default bg-accent-400/15 text-accent-600">
              ✓ Buddies
            </span>
            <Button variant="ghost" onClick={removeConnection} disabled={busy || !state.id}>
              Remove
            </Button>
          </div>
        );

      case 'pending_in':
        return (
          <div className="flex gap-2">
            <Button
              size={size}
              onClick={acceptRequest}
              disabled={busy || !state.id}
              className="flex-1"
            >
              Accept
            </Button>
            <Button variant="outline" onClick={declineRequest} disabled={busy || !state.id}>
              Decline
            </Button>
          </div>
        );

      case 'pending_out':
        return (
          <Button
            variant="outline"
            size={size}
            fullWidth={fullWidth}
            onClick={withdrawRequest}
            disabled={busy || !state.id}
            title="Withdraw your request"
          >
            Requested
          </Button>
        );

      default:
        return (
          <Button size={size} fullWidth={fullWidth} onClick={sendRequest} disabled={busy}>
            {busy ? 'Sending…' : 'Connect'}
          </Button>
        );
    }
  })();

  return (
    <div>
      {body}
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};

export default ConnectButton;
