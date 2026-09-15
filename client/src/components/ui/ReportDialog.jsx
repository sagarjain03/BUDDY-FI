import { useEffect, useState } from 'react';
import Button from './Button';
import Alert from './Alert';
import { apiFetch } from '../../lib/api';

const CATEGORIES = [
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'fake-profile', label: 'Fake profile' },
  { value: 'inappropriate-content', label: 'Inappropriate content' },
  { value: 'other', label: 'Something else' },
];

/**
 * Report, with "block them too" checked by default — that is what people
 * actually want when they reach for this.
 */
const ReportDialog = ({ userId, userName, conversationId, onClose, onDone }) => {
  const [category, setCategory] = useState('harassment');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Escape closes, as people expect from a dialog.
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const result = await apiFetch('/api/reports', {
        method: 'POST',
        body: {
          userId,
          category,
          details: details.trim() || undefined,
          block: alsoBlock,
          context: conversationId ? { conversationId } : undefined,
        },
      });
      onDone?.(result.message, alsoBlock);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not send that report');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md p-6 sm:p-7">
        <h2 id="report-title" className="text-lg font-bold">
          Report {userName}
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          We review every report. Nobody is told who reported them.
        </p>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          {error && <Alert tone="error">{error}</Alert>}

          <div>
            <label htmlFor="report-category" className="field-label">
              What happened?
            </label>
            <select
              id="report-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="field-input"
            >
              {CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-details" className="field-label">
              Anything else? <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea
              id="report-details"
              rows={3}
              maxLength={1000}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="What they did, and where."
              className="field-input h-auto py-2.5"
            />
          </div>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(event) => setAlsoBlock(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-ink-600">
              Block them as well, so they cannot see or contact me.
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={busy} className="flex-1">
              {busy ? 'Sending…' : 'Send report'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportDialog;
