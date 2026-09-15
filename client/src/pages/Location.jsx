import { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { apiFetch } from '../lib/api';

const formatWhen = (value) => {
  if (!value) return null;
  const date = new Date(value);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

const Location = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    apiFetch('/api/auth/me')
      .then((result) => setUser(result.data.user))
      .catch((err) => setStatus({ tone: 'error', text: err.message }));

  useEffect(() => {
    load();
  }, []);

  const share = () => {
    if (!navigator.geolocation) {
      setStatus({ tone: 'error', text: 'Your browser does not support location sharing.' });
      return;
    }

    setStatus(null);
    setBusy(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await apiFetch('/api/auth/update-location', {
            method: 'POST',
            body: {
              longitude: position.coords.longitude,
              latitude: position.coords.latitude,
            },
          });
          await load();
          setStatus({ tone: 'success', text: 'Location saved.' });
        } catch (err) {
          setStatus({ tone: 'error', text: err.message || 'Could not save your location.' });
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setStatus({ tone: 'error', text: err.message || 'Could not read your location.' });
        setBusy(false);
      }
    );
  };

  const toggleSharing = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await apiFetch('/api/auth/me', {
        method: 'PATCH',
        body: { shareLocation: !user.shareLocation },
      });
      await load();
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not change that setting.' });
    } finally {
      setBusy(false);
    }
  };

  const forget = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await apiFetch('/api/auth/me/location', { method: 'DELETE' });
      await load();
      setStatus({ tone: 'success', text: 'Location cleared.' });
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not clear your location.' });
    } finally {
      setBusy(false);
    }
  };

  const hasLocation = Boolean(user?.location);
  const sharing = user?.shareLocation !== false;

  return (
    <AppShell
      title="Location"
      subtitle="Share roughly where you are so we can show you people close enough to meet."
      width="narrow"
    >
      {status && (
        <Alert tone={status.tone} className="mb-6">
          {status.text}
        </Alert>
      )}

      <div className="card p-7 sm:p-9">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
          📍
        </div>

        <h2 className="mt-5 text-xl font-bold">
          {hasLocation ? 'Your location is saved' : 'Share your current location'}
        </h2>

        {/* What is actually stored, in plain words. */}
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-500">
          <p>
            We store one pair of coordinates and use it only to sort matches by distance.
          </p>
          <p>
            <span className="font-medium text-ink-700">Other members never see your
            coordinates.</span>{' '}
            They see a rounded distance, and anything closer than 2&nbsp;km is shown only as
            &ldquo;Under 2 km&rdquo; — precise short distances would give away where you live.
          </p>
        </div>

        {hasLocation && (
          <dl className="mt-6 grid gap-4 rounded-xl border border-ink-100 bg-ink-50 p-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-400">Latitude</dt>
              <dd className="mt-1 font-mono text-sm font-medium">
                {user.location.latitude.toFixed(4)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-400">Longitude</dt>
              <dd className="mt-1 font-mono text-sm font-medium">
                {user.location.longitude.toFixed(4)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-400">Updated</dt>
              <dd className="mt-1 text-sm font-medium">
                {formatWhen(user.location.updatedAt) || 'just now'}
              </dd>
            </div>
          </dl>
        )}

        {hasLocation && (
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-ink-100 p-4">
            <input
              type="checkbox"
              checked={sharing}
              onChange={toggleSharing}
              disabled={busy}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-semibold text-ink-800">
                Use my location for matching
              </span>
              <span className="mt-0.5 block text-sm text-ink-500">
                {sharing
                  ? 'You appear in distance-based searches and members see a rough distance.'
                  : 'You are hidden from distance searches and nobody sees a distance for you.'}
              </span>
            </span>
          </label>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={share} disabled={busy}>
            {busy ? 'Working…' : hasLocation ? 'Update my location' : 'Use my current location'}
          </Button>

          {hasLocation && (
            <Button size="lg" variant="outline" onClick={forget} disabled={busy}>
              Forget my location
            </Button>
          )}

          <Button size="lg" variant="ghost" to="/show-users">
            Back to discover
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

export default Location;
