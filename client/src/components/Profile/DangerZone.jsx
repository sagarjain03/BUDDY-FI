import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { apiFetch, API_URL, getToken, clearToken } from '../../lib/api';
import { resetSocket } from '../../lib/socket';

const DangerZone = () => {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setStatus(null);
    setBusy(true);
    try {
      // Fetched directly so the response can be saved as a file rather than
      // parsed and thrown away.
      const response = await fetch(`${API_URL}/api/auth/me/export`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Could not build your export');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'buddyfi-data.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatus({ tone: 'success', text: 'Downloaded.' });
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not export your data' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (event) => {
    event.preventDefault();
    setStatus(null);
    setBusy(true);

    try {
      await apiFetch('/api/auth/me', { method: 'DELETE', body: { password } });
      resetSocket();
      clearToken();
      navigate('/', { replace: true });
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not delete your account' });
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold">Your data</h2>
      <p className="mt-1 text-sm text-ink-500">
        Take a copy of everything we hold, or remove it all.
      </p>

      {status && (
        <Alert tone={status.tone} className="mt-4">
          {status.text}
        </Alert>
      )}

      <div className="mt-5">
        <Button variant="outline" onClick={download} disabled={busy}>
          {busy ? 'Working…' : 'Download my data'}
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h3 className="text-sm font-bold text-red-800">Delete my account</h3>
        <p className="mt-1 text-sm text-red-700">
          This removes your profile, messages, connections and photo. It cannot be undone.
        </p>

        {!confirming ? (
          <Button variant="outline" className="mt-4" onClick={() => setConfirming(true)}>
            Delete my account
          </Button>
        ) : (
          <form className="mt-4 max-w-sm space-y-3" onSubmit={remove}>
            <Input
              label="Confirm your password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy || !password}
                className="btn btn-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Deleting…' : 'Permanently delete'}
              </button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirming(false);
                  setPassword('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DangerZone;
