import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import { apiFetch, getToken } from '../lib/api';
import registerImage from '../assets/register.png';

const VerifyEmail = () => {
  const { token } = useParams();
  const [state, setState] = useState('checking');
  const [message, setMessage] = useState('');

  // Verification is single-use, so this request must fire exactly once. React
  // 18 StrictMode runs effects twice in development: without this guard the
  // first call consumes the token and the second reports the link as invalid.
  const attempted = useRef(null);

  useEffect(() => {
    if (attempted.current === token) return;
    attempted.current = token;

    apiFetch(`/api/auth/verify-email/${token}`, { auth: false })
      .then(() => setState('done'))
      .catch((err) => {
        setMessage(err.message || 'That link did not work');
        setState('failed');
      });
  }, [token]);

  const signedIn = Boolean(getToken());

  return (
    <AuthLayout
      image={registerImage}
      quote="Almost there."
      quoteAuthor="One click and your account is live."
    >
      <div className="animate-fade-up text-center sm:text-left">
        {state === 'checking' && (
          <>
            <div className="mb-5 h-12 w-12 rounded-2xl bg-ink-100" />
            <h1 className="text-3xl font-extrabold">Confirming your email…</h1>
            <p className="mt-2 text-sm text-ink-500">This only takes a second.</p>
          </>
        )}

        {state === 'done' && (
          <>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-400/15 text-2xl">
              ✅
            </div>
            <h1 className="text-3xl font-extrabold">Email confirmed</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Your account is live. You can now browse matches, send connection requests
              and start conversations.
            </p>
            <div className="mt-8">
              <Button to={signedIn ? '/welcome' : '/login'} size="lg">
                {signedIn ? 'Go to BUDDYFI' : 'Log in'}
              </Button>
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-2xl">
              ⚠️
            </div>
            <h1 className="text-3xl font-extrabold">That link did not work</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">{message}</p>
            <p className="mt-2 text-sm text-ink-400">
              Links expire after 24 hours, and each one can only be used once.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to={signedIn ? '/welcome' : '/login'} size="lg">
                {signedIn ? 'Back to BUDDYFI' : 'Log in'}
              </Button>
              <Button to="/register" variant="outline" size="lg">
                Create an account
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
