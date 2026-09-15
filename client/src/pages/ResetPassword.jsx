import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { apiFetch, setToken } from '../lib/api';
import loginBack from '../assets/login-back.jpg';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const errors = {};
    if (password.length < 8) errors.password = 'At least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy(true);
    try {
      const result = await apiFetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        auth: false,
        body: { password, confirmPassword },
      });

      // The reset logs you in on this device, so go straight into the app.
      setToken(result.token);
      navigate('/welcome', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not reset your password');
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      image={loginBack}
      quote="Pick something you will actually remember."
      quoteAuthor="Eight characters or more."
    >
      <div className="animate-fade-up">
        <h1 className="text-3xl font-extrabold">Choose a new password</h1>
        <p className="mt-2 text-sm text-ink-500">
          This also signs you out everywhere else, which is what you want if someone
          else had your old password.
        </p>

        <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
          <Alert tone="error">{error}</Alert>

          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />

          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
          />

          <Button type="submit" size="lg" fullWidth disabled={busy} className="!mt-6">
            {busy ? 'Saving…' : 'Set new password'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-ink-500">
          Link expired?{' '}
          <Link
            to="/forgot-password"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Ask for a new one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
