import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { apiFetch } from '../../lib/api';

/**
 * Opens the conversation with someone, creating it if it does not exist yet,
 * then navigates to it. The server refuses unless the two are connected.
 */
const MessageButton = ({ userId, children = 'Message', ...props }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await apiFetch('/api/conversations', {
        method: 'POST',
        body: { userId },
      });
      navigate(`/chat/${result.data.conversation._id}`);
    } catch (err) {
      setError(err.message || 'Could not open that conversation');
      setBusy(false);
    }
  };

  return (
    <div>
      <Button onClick={open} disabled={busy} {...props}>
        {busy ? 'Opening…' : children}
      </Button>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
};

export default MessageButton;
