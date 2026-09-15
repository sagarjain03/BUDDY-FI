import { useCallback, useEffect, useState } from 'react';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { apiFetch } from '../../lib/api';

/** Turns a user-agent string into something a person can recognise. */
const describeDevice = (userAgent = '') => {
  if (!userAgent) return 'Unknown device';

  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /Chrome\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    : 'Browser';

  const platform =
    /Windows/.test(userAgent) ? 'Windows'
    : /Macintosh|Mac OS/.test(userAgent) ? 'macOS'
    : /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad/.test(userAgent) ? 'iOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : '';

  return platform ? `${browser} on ${platform}` : browser;
};

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await apiFetch('/api/auth/sessions');
      setSessions(result.data.sessions);
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not load your sessions' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const endOthers = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await apiFetch('/api/auth/sessions', { method: 'DELETE' });
      setStatus({ tone: 'success', text: result.message });
      await load();
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not sign out those devices' });
    } finally {
      setBusy(false);
    }
  };

  const others = sessions.filter((session) => !session.current).length;

  return (
    <div>
      <h2 className="text-lg font-bold">Where you are signed in</h2>
      <p className="mt-1 text-sm text-ink-500">
        Signing out of a device ends its session immediately.
      </p>

      {status && (
        <Alert tone={status.tone} className="mt-4">
          {status.text}
        </Alert>
      )}

      <ul className="mt-5 space-y-2">
        {sessions.map((session) => (
          <li
            key={session._id}
            className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink-800">
                {describeDevice(session.userAgent)}
                {session.current && (
                  <span className="ml-2 rounded-full bg-accent-400/15 px-2 py-0.5 text-xs font-semibold text-accent-600">
                    This device
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-xs text-ink-400">
                Last active {new Date(session.lastSeenAt).toLocaleString()}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {others > 0 && (
        <Button variant="outline" className="mt-5" onClick={endOthers} disabled={busy}>
          {busy ? 'Signing out…' : `Sign out of ${others} other device${others === 1 ? '' : 's'}`}
        </Button>
      )}
    </div>
  );
};

export default Sessions;
