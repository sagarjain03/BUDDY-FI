import { useEffect, useRef, useState } from 'react';
import ReportDialog from './ReportDialog';
import { apiFetch } from '../../lib/api';

/**
 * The block / report control. Small on purpose — it should be findable without
 * being the loudest thing on a profile.
 */
const SafetyMenu = ({ userId, userName, conversationId, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onClickAway = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);

    document.addEventListener('mousedown', onClickAway);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickAway);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const block = async () => {
    setOpen(false);
    try {
      const result = await apiFetch('/api/blocks', { method: 'POST', body: { userId } });
      setNote(result.message);
      onChanged?.('blocked');
    } catch (err) {
      setNote(err.message || 'Could not block them');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Safety options for ${userName}`}
        aria-expanded={open}
        className="btn btn-ghost h-9 w-9 text-lg leading-none"
      >
        &#8942;
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-lift">
          <button
            type="button"
            onClick={block}
            className="block w-full px-4 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
          >
            Block
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setReporting(true);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Report
          </button>
        </div>
      )}

      {reporting && (
        <ReportDialog
          userId={userId}
          userName={userName}
          conversationId={conversationId}
          onClose={() => setReporting(false)}
          onDone={(message, blocked) => {
            setNote(message);
            onChanged?.(blocked ? 'blocked' : 'reported');
          }}
        />
      )}

      {note && (
        <p className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg bg-ink-900 px-3 py-2 text-xs text-white">
          {note}
        </p>
      )}
    </div>
  );
};

export default SafetyMenu;
