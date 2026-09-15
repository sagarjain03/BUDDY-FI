import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AppShell from '../components/layout/AppShell';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import SafetyMenu from '../components/ui/SafetyMenu';
import PresenceDot from '../components/ui/PresenceDot';
import { presenceLabel } from '../lib/labels';
import { apiFetch } from '../lib/api';
import { acquireSocket, releaseSocket } from '../lib/socket';
import { EASE, usePrefersReducedMotion } from '../lib/motion';

const MAX_BODY = 2000;

const relativeTime = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const dayLabel = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
};

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const [me, setMe] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const listEndRef = useRef(null);
  const scrollBoxRef = useRef(null);
  const typingTimer = useRef(null);

  const active = useMemo(
    () => conversations.find((entry) => entry._id === conversationId) || null,
    [conversations, conversationId]
  );

  /* ---- data ---------------------------------------------------------- */

  const loadConversations = useCallback(async () => {
    try {
      const result = await apiFetch('/api/conversations');
      setConversations(result.data.conversations);
    } catch (err) {
      setError(err.message || 'Could not load your conversations');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((result) => setMe(result.data.user))
      .catch(() => setMe(null));
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingThread(true);
    setError('');

    apiFetch(`/api/conversations/${conversationId}/messages`)
      .then((result) => {
        if (cancelled) return;
        setMessages(result.data.messages);
        setHasMore(result.hasMore);
        return apiFetch(`/api/conversations/${conversationId}/read`, { method: 'PATCH' });
      })
      .then(() => {
        if (!cancelled) {
          setConversations((current) =>
            current.map((entry) =>
              entry._id === conversationId ? { ...entry, unread: 0 } : entry
            )
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not open that conversation');
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const loadOlder = async () => {
    if (messages.length === 0) return;
    try {
      const result = await apiFetch(
        `/api/conversations/${conversationId}/messages?before=${messages[0].createdAt}`
      );
      setMessages((current) => [...result.data.messages, ...current]);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err.message || 'Could not load older messages');
    }
  };

  /* ---- socket -------------------------------------------------------- */

  useEffect(() => {
    const socket = acquireSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onMessage = (message) => {
      setMessages((current) => {
        if (String(message.conversation) !== String(conversationId)) return current;
        if (current.some((entry) => entry._id === message._id)) return current;
        return [...current, message];
      });
    };

    const onConversation = (conversation) => {
      setConversations((current) => {
        const rest = current.filter((entry) => entry._id !== conversation._id);
        return [conversation, ...rest].sort(
          (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
        );
      });
    };

    const onTypingStart = ({ conversationId: id }) => {
      if (String(id) === String(conversationId)) setTyping(true);
    };
    const onTypingStop = ({ conversationId: id }) => {
      if (String(id) === String(conversationId)) setTyping(false);
    };

    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onMessage);
    socket.on('conversation:updated', onConversation);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onMessage);
      socket.off('conversation:updated', onConversation);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      releaseSocket();
    };
  }, [conversationId]);

  // Mark read as soon as a message lands in the open conversation.
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    socketRef.current?.emit('message:read', { conversationId });
  }, [conversationId, messages.length]);

  // Only follow the conversation down if the reader is already near the bottom.
  useEffect(() => {
    const box = scrollBoxRef.current;
    if (!box || messages.length === 0) return;

    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
    if (nearBottom) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  /* ---- sending ------------------------------------------------------- */

  const handleTyping = (value) => {
    setDraft(value.slice(0, MAX_BODY));
    if (!conversationId) return;

    socketRef.current?.emit('typing:start', { conversationId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { conversationId });
    }, 1200);
  };

  const send = (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !conversationId) return;

    setDraft('');
    setError('');
    clearTimeout(typingTimer.current);
    socketRef.current?.emit('typing:stop', { conversationId });

    socketRef.current?.emit('message:send', { conversationId, body }, (response) => {
      if (!response?.ok) {
        setError(response?.error || 'Could not send that message');
        setDraft(body); // give the text back rather than losing it
      }
    });
  };

  /* ---- render -------------------------------------------------------- */

  const showList = !conversationId;

  return (
    <AppShell
      title="Messages"
      subtitle="You can message anyone you are connected with."
      actions={
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            connected ? 'bg-accent-400/15 text-accent-600' : 'bg-ink-100 text-ink-500'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-accent-500' : 'bg-ink-400'}`}
          />
          {connected ? 'Connected' : 'Connecting…'}
        </span>
      }
    >
      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="card grid h-[68vh] min-h-[460px] overflow-hidden md:grid-cols-[320px_1fr]">
        {/* Conversation list ------------------------------------------- */}
        <aside
          className={`flex flex-col border-ink-100 md:border-r ${
            showList ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="text-sm font-bold">Conversations</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList && (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="skeleton h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-2/3 rounded" />
                      <div className="skeleton h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingList && conversations.length === 0 && (
              <div className="p-5">
                <EmptyState
                  icon="💬"
                  title="No conversations yet"
                  description="Connect with someone from Discover, then say hello."
                  action={
                    <Button to="/show-users" variant="outline">
                      Find people
                    </Button>
                  }
                />
              </div>
            )}

            {conversations.map((entry) => (
              <button
                key={entry._id}
                type="button"
                onClick={() => navigate(`/chat/${entry._id}`)}
                className={`flex w-full items-center gap-3 border-b border-ink-100 px-5 py-4 text-left transition-colors ${
                  entry._id === conversationId ? 'bg-brand-50' : 'hover:bg-ink-50'
                }`}
              >
                <span className="relative shrink-0">
                  <Avatar
                    name={entry.withUser?.name}
                    seed={entry.withUser?._id}
                    avatar={entry.withUser?.avatar}
                    size="sm"
                  />
                  <PresenceDot
                    user={entry.withUser}
                    className="absolute -bottom-0.5 -right-0.5"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink-900">
                      {entry.withUser?.name || 'Unknown'}
                    </span>
                    <span className="shrink-0 text-xs text-ink-400">
                      {relativeTime(entry.lastMessageAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="truncate text-xs text-ink-500">
                      {entry.lastMessage?.body || 'Say hello'}
                    </span>
                    {entry.unread > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                        {entry.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Thread ------------------------------------------------------- */}
        <section className={`flex flex-col ${showList ? 'hidden md:flex' : 'flex'}`}>
          {!conversationId && (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-xl">
                  💬
                </div>
                <p className="text-sm font-medium text-ink-700">Pick a conversation</p>
                <p className="mt-1 text-sm text-ink-400">
                  Your messages will show up here.
                </p>
              </div>
            </div>
          )}

          {conversationId && (
            <>
              <header className="flex items-center gap-3 border-b border-ink-100 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="btn btn-ghost h-9 w-9 md:hidden"
                  aria-label="Back to conversations"
                >
                  ←
                </button>
                <Avatar
                  name={active?.withUser?.name}
                  seed={active?.withUser?._id}
                  avatar={active?.withUser?.avatar}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {active?.withUser?.name || 'Conversation'}
                  </p>
                  <p className="text-xs text-ink-400">
                    {typing
                      ? 'typing…'
                      : presenceLabel(active?.withUser) ||
                        (active?.withUser
                          ? `${active.withUser.age} · ${active.withUser.gender}`
                          : '')}
                  </p>
                </div>

                {active?.withUser && (
                  <div className="ml-auto">
                    <SafetyMenu
                      userId={active.withUser._id}
                      userName={active.withUser.name}
                      conversationId={conversationId}
                      onChanged={async () => {
                        await loadConversations();
                        navigate('/chat');
                      }}
                    />
                  </div>
                )}
              </header>

              <div ref={scrollBoxRef} className="flex-1 space-y-1 overflow-y-auto px-5 py-5">
                {hasMore && (
                  <div className="mb-4 text-center">
                    <Button variant="outline" onClick={loadOlder}>
                      Load older messages
                    </Button>
                  </div>
                )}

                {loadingThread && (
                  <div className="space-y-3">
                    {[0, 1, 2].map((key) => (
                      <div key={key} className="skeleton h-9 w-2/3 rounded-2xl" />
                    ))}
                  </div>
                )}

                {!loadingThread && messages.length === 0 && (
                  <p className="py-10 text-center text-sm text-ink-400">
                    No messages yet. Say hello.
                  </p>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((message, index) => {
                    const mine = String(message.sender?._id || message.sender) === String(me?._id);
                    const previous = messages[index - 1];
                    const newDay =
                      !previous ||
                      new Date(previous.createdAt).toDateString() !==
                        new Date(message.createdAt).toDateString();

                    return (
                      <div key={message._id}>
                        {newDay && (
                          <div className="my-4 flex items-center gap-3">
                            <span className="h-px flex-1 bg-ink-100" />
                            <span className="text-xs font-medium text-ink-400">
                              {dayLabel(message.createdAt)}
                            </span>
                            <span className="h-px flex-1 bg-ink-100" />
                          </div>
                        )}

                        <motion.div
                          initial={reduced ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, ease: EASE }}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                              mine
                                ? 'rounded-br-sm bg-brand-500 text-white'
                                : 'rounded-bl-sm bg-ink-100 text-ink-800'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            <p
                              className={`mt-1 text-[11px] ${
                                mine ? 'text-white/60' : 'text-ink-400'
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </AnimatePresence>

                <div ref={listEndRef} />
              </div>

              <form
                onSubmit={send}
                className="flex items-center gap-2 border-t border-ink-100 bg-ink-50 px-4 py-3"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => handleTyping(event.target.value)}
                  placeholder="Type a message…"
                  aria-label="Message"
                  maxLength={MAX_BODY}
                  className="field-input flex-1"
                />
                <Button type="submit" disabled={!draft.trim() || !connected}>
                  Send
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default Chat;
