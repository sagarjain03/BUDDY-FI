import { useEffect, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { apiFetch } from '../lib/api';

const Toggle = ({ label, description, checked, onChange, disabled }) => {
  // Optimistic: the box flips immediately and only reverts if the save fails,
  // otherwise it looks broken for the length of a round trip.
  const [value, setValue] = useState(checked);

  useEffect(() => {
    setValue(checked);
  }, [checked]);

  const handle = async (event) => {
    const next = event.target.checked;
    setValue(next);
    const ok = await onChange(next);
    if (ok === false) setValue(!next);
  };

  return (
  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-100 p-4">
    <input
      type="checkbox"
      checked={value}
      onChange={handle}
      disabled={disabled}
      className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
    />
    <span>
      <span className="block text-sm font-semibold text-ink-800">{label}</span>
      <span className="mt-0.5 block text-sm text-ink-500">{description}</span>
    </span>
  </label>
  );
};

const NotificationSettings = () => {
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

  /** Returns false when the save failed, so the toggle can roll back. */
  const save = async (changes) => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await apiFetch('/api/auth/me', { method: 'PATCH', body: changes });
      setUser(result.data.user);
      setStatus({ tone: 'success', text: 'Saved' });
      return true;
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not save that' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title="Notifications and privacy"
      subtitle="What we send you, and what other members can see."
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

      {!user && (
        <div className="card space-y-3 p-7">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      )}

      {user && (
        <div className="space-y-6">
          <section className="card space-y-4 p-7 sm:p-9">
            <div>
              <h2 className="text-lg font-bold">Email</h2>
              <p className="mt-1 text-sm text-ink-500">
                In-app notifications always work. This is only about email.
              </p>
            </div>

            <Toggle
              label="Weekly summary"
              description="One email a week, only when something actually happened."
              checked={user.emailPrefs?.digest !== false}
              disabled={busy}
              onChange={(next) => save({ emailPrefs: { digest: next } })}
            />
          </section>

          <section className="card space-y-4 p-7 sm:p-9">
            <div>
              <h2 className="text-lg font-bold">Privacy</h2>
              <p className="mt-1 text-sm text-ink-500">
                These control what other members can see about you.
              </p>
            </div>

            <Toggle
              label="Show when I am online"
              description="Only people you are connected with ever see this."
              checked={user.sharePresence !== false}
              disabled={busy}
              onChange={(next) => save({ sharePresence: next })}
            />

            <Toggle
              label="Use my location for matching"
              description="Turning this off hides your distance and removes you from nearby searches."
              checked={user.shareLocation !== false}
              disabled={busy}
              onChange={(next) => save({ shareLocation: next })}
            />
          </section>
        </div>
      )}
    </AppShell>
  );
};

export default NotificationSettings;
