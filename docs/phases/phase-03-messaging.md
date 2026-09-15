# Phase 03 — Direct messaging — SHIPPED

**Size:** L (two weeks or more) · **Depends on:** 02 · **Blocks:** 08

> Delivered. Notable differences from the plan:
> - Unread counts are **denormalised onto the conversation** (`unread` map,
>   keyed by user id) rather than counted from messages on every list load.
> - All persistence and fan-out live in `server/services/messageService.js`, so
>   the socket handlers and the REST controllers cannot drift apart.
> - The connection check runs on **every** message, not only when the
>   conversation is opened — removing a buddy stops the chat immediately.
> - The client shares **one** socket via `lib/socket.js` reference counting,
>   which is what makes React 18 StrictMode's double-mount safe.

## Goal

Replace the anonymous global Socket.IO room with real one-to-one conversations:
persisted, authenticated, with history, unread counts and typing indicators.

## Why

Today [Chat.jsx](../../client/src/pages/Chat.jsx) connects to one room where
everybody sees everything, nobody has a name, and a refresh erases the
conversation. The socket accepts connections from anyone — no token is checked.

## Design

### Models

`server/models/conversationModel.js`:

```js
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date, index: true },
}, { timestamps: true });

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
```

`server/models/messageModel.js`:

```js
const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body:         { type: String, required: true, trim: true, maxlength: 2000 },
  readBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });
```

Two participants only for now. Keeping `participants` an array leaves the door
open for group chats later without a migration.

### Authenticating the socket

The socket currently trusts anyone. Add a handshake middleware:

```js
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('unauthorized'));
  }
});
```

Client side, pass the token when connecting:

```js
io(API_URL, { auth: { token: getToken() } });
```

Each socket joins a room named after its own user id (`socket.join(socket.userId)`),
so the server can push to a specific person regardless of which conversation
they have open.

### Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `message:send` | client → server | `{ conversationId, body }` |
| `message:new` | server → client | the saved message, populated with sender |
| `message:read` | client → server | `{ conversationId }` |
| `conversation:updated` | server → client | `{ conversationId, unreadCount, lastMessage }` |
| `typing:start` / `typing:stop` | both | `{ conversationId }` |

On `message:send` the server must: verify the sender is a participant, verify
the two users are still connected (`areConnected` from phase 02), persist the
message, update the conversation's `lastMessage`/`lastMessageAt`, then emit
`message:new` to both participants' user rooms.

**Persist before emitting.** If the write fails, nothing should have been
broadcast.

### REST alongside sockets

History and the conversation list are ordinary requests. Sockets are only for
live delivery.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/conversations` | list, newest activity first, with unread counts |
| POST | `/api/conversations` | find or create with `{ userId }` — requires an accepted connection |
| GET | `/api/conversations/:id/messages` | paginated history, `before` cursor |
| PATCH | `/api/conversations/:id/read` | mark read up to now |

Paginate history with a `before` timestamp cursor, 30 per page, newest first;
reverse for display.

## Client work

Rebuild `/chat` as a two-pane layout:

- **Left:** conversation list — avatar, name, last message preview, relative
  time, unread badge. On mobile this is the whole screen until you pick one.
- **Right:** message thread — own messages right-aligned in `brand-500`, theirs
  left-aligned in `ink-100`, date separators, composer pinned to the bottom.
- `/chat/:conversationId` as the route so a conversation is linkable.
- "Say hello" on a Discover card posts to `/api/conversations` and navigates to
  the returned conversation.

Reuse the connection-status dot and empty state already in `Chat.jsx`.

Scroll handling: keep the list pinned to the bottom on new messages **only when
the user is already near the bottom**, and scroll the message container, not the
document. Scrolling the document was a bug in the previous version.

## Tasks

- [x] `conversationModel.js` and `messageModel.js` with indexes
- [x] Socket handshake auth; a missing or invalid token is rejected
- [x] Per-user socket rooms (`user:<id>`), so pushes reach every tab
- [x] `message:send` with participant + live connection checks, persist first
- [x] Read receipts and unread counts, denormalised per participant
- [x] Typing indicators, debounced to 1.2s
- [x] Five REST endpoints with a `before` cursor (the four planned, plus
      `/unread-count` for the navbar)
- [x] Conversation list pane with previews, relative times and unread badges
- [x] Message thread with bubbles, timestamps and day separators
- [x] `/chat/:conversationId` routing, list-only on mobile until one is picked
- [x] `MessageButton` opens or creates the conversation and navigates to it
- [x] Unread badge in the navbar, refreshed **live** over the socket as well as
      on navigation
- [x] Per-socket rate limit of 20 messages per 10 seconds
- [x] 9 end-to-end tests in `client/tests/e2e/messaging.spec.js`
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] Two browsers, two accounts: messages arrive live in both directions.
- [x] Refreshing preserves the full conversation history.
- [x] A socket connection without a valid token is rejected.
- [x] Messaging someone you are not connected to returns 403, and so does
      messaging after the connection is removed.
- [x] Unread counts are correct and clear when the conversation is opened.
- [x] The message list scrolls only when the reader is already near the bottom;
      the page behind it never jumps.
- [x] A non-participant can neither send to nor read a conversation.
- [x] Empty messages and messages over 2000 characters are refused with a
      useful reason, not a generic failure.

## Watch out for

- Do not trust `senderId` from the client. The sender is `socket.userId`.
- Cap `body` length server-side as well as in the input.
- Escape nothing manually — React escapes text by default. Do not introduce
  `dangerouslySetInnerHTML` for message rendering.
- In React 18 StrictMode the effect that opens the socket runs twice in dev.
  Make the cleanup disconnect properly or you will see duplicate messages.
