import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { apiFetch, setToken } from '../../lib/api';

const EMPTY = { currentPassword: '', password: '', confirmPassword: '' };

const ChangePassword = () => {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const errors = {};
    if (!form.currentPassword) errors.currentPassword = 'Required';
    if (form.password.length < 8) errors.password = 'At least 8 characters';
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const result = await apiFetch('/api/auth/change-password', {
        method: 'PATCH',
        body: form,
      });

      // The old token was just invalidated; keep this device signed in.
      setToken(result.token);
      setForm(EMPTY);
      setStatus({ tone: 'success', text: result.message });
    } catch (err) {
      setStatus({ tone: 'error', text: err.message || 'Could not change your password' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold">Change password</h2>
      <p className="mt-1 text-sm text-ink-500">
        Changing it signs you out on every other device.
      </p>

      <form className="mt-5 max-w-sm space-y-4" onSubmit={submit} noValidate>
        {status && <Alert tone={status.tone}>{status.text}</Alert>}

        <Input
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={change}
          error={fieldErrors.currentPassword}
        />

        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={change}
          error={fieldErrors.password}
        />

        <Input
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={change}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </Button>
      </form>
    </div>
  );
};

export default ChangePassword;
