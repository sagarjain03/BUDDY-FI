import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import SocialLogin from '../SocialLogin/SocialLogin';
import { apiFetch, setToken } from '../../lib/api';

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      });

      setToken(data.token);
      navigate('/welcome', { replace: true });
    } catch (err) {
      setError(err.message || 'There was an error logging in. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-extrabold">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-500">
        Log in to see who matched your vibe while you were away.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <Alert tone="error">{error}</Alert>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" fullWidth disabled={submitting} className="!mt-6">
          {submitting ? 'Logging in\u2026' : 'Log in'}
        </Button>
      </form>

      <SocialLogin />

      <p className="mt-8 text-center text-sm text-ink-500">
        New here?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
