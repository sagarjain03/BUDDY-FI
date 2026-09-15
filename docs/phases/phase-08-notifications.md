# Phase 08 — Notifications and presence — SHIPPED

**Size:** M (about a week) · **Depends on:** 02, 03

> Delivered. The digest runs from `scripts/send-digest.js` rather than an
> in-process cron, because an in-process job duplicates every email once the
> app runs on more than one instance.

## Goal

Tell people something happened: in-app notification feed, unread badges, online
and last-seen status, and a weekly email digest.

## Why

A social app with no notifications is a app people open once. Every event that
matters — a connection request, an accepted request, a new message, a new
high-percentage match — currently happens invisibly.

## Design

### Model

`server/models/notificationModel.js`:

```js
{
  user:   { type: ObjectId, ref: 'User', required: true, index: true },
  type:   { type: String, enum: ['connection_request', 'connection_accepted', 'new_message', 'new_match'], required: true },
  actor:  { type: ObjectId, ref: 'User' },        // who caused it
  entity: { kind: String, id: ObjectId },         // conversation, connection…
  readAt: Date,
}
// index { user: 1, createdAt: -1 }
```

Create notifications from one place so every producer behaves the same:

```js
// server/utils/notify.js
async function notify({ user, type, actor, entity }) {
  const doc = await Notification.create({ user, type, actor, entity });
  io.to(String(user)).emit('notification:new', await doc.populate('actor', 'name avatar'));
  return doc;
}
```

Phase 03 already gives each user a personal socket room, so `io.to(userId)`
works.

Consider a TTL index to expire read notifications after 90 days rather than
growing the collection forever.

### Don't notify for noise

- No notification for your own actions.
- Collapse repeated `new_message` from the same conversation into one unread
  row — one badge per conversation, not per message.
- `new_match` only above a threshold (say 70%) and at most a few per week.

### Presence

Track it on the user document, driven by socket lifecycle:

```js
isOnline:   { type: Boolean, default: false },
lastSeenAt: Date,
```

On `connection`: set `isOnline = true`. On `disconnect`: set `isOnline = false`
and stamp `lastSeenAt`.

A user can have several sockets (two tabs). Count them:

```js
// Map<userId, Set<socketId>> — only mark offline when the set empties.
```

Broadcast `presence:changed` to that user's connections only, not globally.

Display as: "Online", "Active 5m ago", "Active yesterday". Anything older than a
week shows nothing rather than "Active 3 months ago", which reads as abandoned.

Let users turn presence off in settings; tie it to the same privacy screen as
`shareLocation` from phase 06.

### Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/notifications` | paginated, newest first |
| GET | `/api/notifications/unread-count` | for the badge |
| PATCH | `/api/notifications/read` | mark all read |
| PATCH | `/api/notifications/:id/read` | mark one read |

### Email digest

Weekly, one email: new matches above the threshold, pending connection requests,
unread message count. Reuse `sendEmail` from phase 04.

Requirements:

- An unsubscribe link in every email that works without logging in (signed
  token), and a notification preferences screen.
- Never send to an unverified address.
- Skip users with nothing to report — an empty digest is spam.
- Run it with `node-cron` in-process for now; move to a proper scheduler if the
  app is ever deployed to more than one instance, or every instance will send a
  copy.

## Client work

- Bell icon in [Navbar.jsx](../../client/src/components/layout/Navbar.jsx) with
  an unread count and a dropdown of the last ten notifications.
- `/notifications` page with the full list and mark-all-read.
- Live insert on `notification:new` — no polling.
- Presence dot on avatars in Discover, Buddies and the conversation list.
- Unread badge per conversation in the chat list.
- `/settings/notifications` with per-type email toggles.

## Tasks

- [x] `notificationModel.js` with indexes and a TTL on read rows
- [x] `notify()` in `services/notifyService.js`, used by connections and messaging
- [x] Four endpoints
- [x] Socket `notification:new` into the user's room
- [x] Repeated `new_message` collapse into one unread row per conversation
- [x] Presence with multi-socket reference counting
- [x] `presence:changed` scoped to connections, and skipped when switched off
- [x] Presence cleared for everyone on boot, so a crash does not leave the whole
      membership marked online
- [x] Bell dropdown and `/notifications` page
- [x] Presence dots and labels on Discover, Buddies and Chat
- [x] Weekly digest with a working unsubscribe that needs no login
- [x] `/settings/notifications` for email and privacy preferences
- [x] Notifications from a blocked member disappear along with them
- [x] 11 end-to-end tests in `client/tests/e2e/notifications.spec.js`
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] A connection request produces a notification within a second, no refresh.
- [x] Four messages in one conversation produce one unread row, not four.
- [x] Opening two tabs and closing one leaves the member online; closing the
      last one marks them offline.
- [x] Presence is only visible to connections, and can be turned off.
- [x] You are never notified about your own actions.
- [x] The digest sends only to verified members with actual activity — an empty
      digest is spam, so it is skipped.
- [x] A wrong unsubscribe signature changes nothing.

## Watch out for

- Presence written on every socket event will hammer the database. It is written
  on first connect and last disconnect only.
- If the process crashes, everyone stays `isOnline: true` forever.
  `presence.resetAll()` runs on boot for exactly that reason.
- **A controlled checkbox driven only by fetched state looks broken.** The
  settings toggles snapped back until the round trip finished; they are now
  optimistic and roll back on failure.
- The digest must not run in-process on more than one instance, or every member
  gets the email twice. Call `npm run digest:send` from a scheduler.
