import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { apiFetch } from '../lib/api';
import loginBack from '../assets/login-back.jpg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        auth: false,
        body: { email },
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send that email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      image={loginBack}
      quote="Locked out? It happens to everyone."
      quoteAuthor="One email and you are back in."
    >
      <div className="animate-fade-up">
        {sent ? (
          <>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-400/15 text-2xl">
              📬
            </div>
            <h1 className="text-3xl font-extrabold">Check your inbox</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              If <span className="font-medium text-ink-700">{email}</span> has an account, a
              reset link is on its way. The link works for one hour.
            </p>
            <p className="mt-2 text-sm text-ink-400">
              Nothing arrived? Check spam, or try again in a few minutes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/login" size="lg">
                Back to log in
              </Button>
              <Button variant="outline" size="lg" onClick={() => setSent(false)}>
                Use another email
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold">Forgot your password?</h1>
            <p className="mt-2 text-sm text-ink-500">
              Tell us your email and we will send you a link to choose a new one.
            </p>

            <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
              <Alert tone="error">{error}</Alert>

              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <Button type="submit" size="lg" fullWidth disabled={busy} className="!mt-6">
                {busy ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-ink-500">
              Remembered it?{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
