import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { apiFetch } from '../../lib/api';

/**
 * Sits above every signed-in page until the address is confirmed. Unverified
 * accounts can still use their own profile and the quiz, so this explains what
 * is actually locked rather than blocking the whole app.
 */
const VerifyBanner = () => {
  const [user, setUser] = useState(null);
  const [state, setState] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/auth/me')
      .then((result) => {
        if (!cancelled) setUser(result.data.user);
      })
      .catch(() => {
        /* the banner is not worth an error state */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!user || user.isVerified) return null;

  const resend = async () => {
    setState('sending');
    try {
      await apiFetch('/api/auth/verify-email/send', { method: 'POST' });
      setState('sent');
    } catch {
      setState('failed');
    }
  };

  return (
    <div className="border-b border-brand-200 bg-brand-50">
      <div className="container-page flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand-800">
          <span className="font-semibold">Confirm your email</span> to browse matches,
          connect with people and send messages. We sent a link to {user.email}.
        </p>

        <div className="shrink-0">
          {state === 'sent' ? (
            <span className="text-sm font-semibold text-accent-600">Sent — check your inbox</span>
          ) : (
            <Button variant="outline" onClick={resend} disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Resend email'}
            </Button>
          )}
          {state === 'failed' && (
            <p className="mt-1 text-xs font-medium text-red-600">Could not send that. Try again.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyBanner;
