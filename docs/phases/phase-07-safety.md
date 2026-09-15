# Phase 07 — Safety and abuse — MOSTLY SHIPPED

**Size:** M (about a week) · **Depends on:** 02, 03 · **Blocks:** 10

> Blocking, reporting, the admin queue, rate limiting and account lockout are
> done. **Session revocation is done in a different shape than planned**, and
> one piece is deliberately outstanding — see "Sessions" below.

## Goal

Block, report, rate limiting, and revocable sessions. This is the phase that
makes it defensible to let strangers contact each other.

## Why

Three concrete holes today:

1. **No block.** If someone harasses you, there is nothing you can do.
2. **No rate limiting.** `/api/auth/login` accepts unlimited attempts, so
   passwords can be brute-forced as fast as the attacker's connection allows.
3. **No revocation.** The JWT lives 7 days in `localStorage`. "Log out" only
   deletes the local copy — a stolen token stays valid for the full week.

Do not launch publicly without this phase.

## Block

`server/models/blockModel.js`:

```js
{
  blocker: { type: ObjectId, ref: 'User', required: true, index: true },
  blocked: { type: ObjectId, ref: 'User', required: true, index: true },
  reason:  String,
}
// unique compound index on { blocker, blocked }
```

A block must apply in **both** directions. If A blocks B, then for both users:

- neither appears in the other's Discover results
- existing connections between them are removed
- pending requests between them are cancelled
- messages cannot be sent either way
- existing conversation history is hidden from A (decide whether B keeps theirs;
  hiding for both is simpler and fine)

Write one helper and use it everywhere:

```js
// server/utils/blockFilter.js
async function blockedIdsFor(userId) { … }   // ids blocked by OR blocking this user
```

Then every list query excludes them: `_id: { $nin: blockedIds }`. The reason to
centralise this is that missing one query is how blocked users reappear.

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/blocks` | block `{ userId, reason? }` |
| GET | `/api/blocks` | my block list |
| DELETE | `/api/blocks/:userId` | unblock |

## Report

`server/models/reportModel.js`:

```js
{
  reporter:    { type: ObjectId, ref: 'User', required: true },
  reported:    { type: ObjectId, ref: 'User', required: true, index: true },
  category:    { type: String, enum: ['harassment', 'spam', 'fake-profile', 'inappropriate-content', 'other'], required: true },
  details:     { type: String, maxlength: 1000 },
  context:     { conversationId: ObjectId, messageId: ObjectId },
  status:      { type: String, enum: ['open', 'reviewing', 'actioned', 'dismissed'], default: 'open' },
  reviewedBy:  { type: ObjectId, ref: 'User' },
  reviewNotes: String,
}
```

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/reports` | file a report |
| GET | `/api/admin/reports` | admin only, filter by status |
| PATCH | `/api/admin/reports/:id` | update status and notes |

Add `role: { type: String, enum: ['user', 'admin'], default: 'user' }` to the
user model and a `requireAdmin` middleware. A minimal admin list view is enough
— reports that nobody reads are worse than no report button, because they imply
a promise you are not keeping.

Offer "Block and report" as a single action in the UI; it is what people
actually want.

## Rate limiting

`express-rate-limit`, applied per route group:

| Route | Limit |
|-------|-------|
| `POST /api/auth/login` | 10 per 15 min per IP, and 5 per 15 min per email |
| `POST /api/auth/register` | 5 per hour per IP |
| `POST /api/auth/forgot-password` | 3 per hour per IP and per email |
| `POST /api/auth/verify-email/send` | 3 per hour per account |
| `POST /api/reports` | 20 per day per account |
| everything else | 300 per 15 min per IP |

Also add progressive lockout on repeated failed logins for one account
(`failedLoginCount`, `lockedUntil` on the user), so an attacker rotating IPs
still hits a wall.

If you deploy behind a proxy (Render, Railway, Heroku, nginx), set
`app.set('trust proxy', 1)` or every request will look like it came from the
same IP and the limiter will lock out all users at once.

Socket.IO needs its own throttle — cap `message:send` to something like 20
messages per 10 seconds per socket.

## Sessions — what was built, and what was not

**Built:** every token now carries a session id (`sid`) and has a matching row
in a `sessions` collection. `protect` checks the row exists on every request,
so:

- `POST /api/auth/logout` deletes the row and the token dies immediately
- `GET /api/auth/sessions` lists where the account is signed in
- `DELETE /api/auth/sessions` signs out every other device
- changing or resetting a password deletes every session for that account

That is the substance of revocation, and it did not require changing how the
token is transported.

**Not built:** the access-token-in-memory plus refresh-token-in-an-httpOnly-cookie
split described below. It is a real improvement — it is what stops an XSS from
stealing a long-lived token — but it changes the transport, CORS credentials,
`ProtectedRoute` (which currently reads the token synchronously) and every test
helper. It was left as its own piece of work rather than bolted onto this phase.

**What that means today:** a 7-day token still lives in `localStorage`. If the
app ever ships an XSS, that token can be stolen and used until it expires or the
member logs out. Do this before launch.

### The original plan, for whoever picks it up

Replace the single long-lived token:

- **Access token**: JWT, 15 minutes, kept in memory (not `localStorage`).
- **Refresh token**: random 32 bytes, stored hashed in a `sessions` collection,
  sent as an `httpOnly`, `secure`, `sameSite=strict` cookie, 30 days.
- `POST /api/auth/refresh` rotates the refresh token on every use. If a
  already-used token is presented, treat it as theft and revoke the whole
  session family.
- `POST /api/auth/logout` deletes the session row — so logout is real.
- `GET /api/auth/sessions` and `DELETE /api/auth/sessions/:id` for "log out
  everywhere".

This changes CORS: the client must send `credentials: 'include'`, and the server
already has `credentials: true` with an origin allowlist, which is required — a
cookie-based refresh token with `origin: '*'` would be exploitable.

Update [lib/api.js](../../client/src/lib/api.js) to hold the access token in a
module variable and transparently retry once through `/refresh` on a 401.

## Tasks

- [x] `blockModel.js`, three endpoints, symmetric effect
- [x] `blockedIdsFor` applied to discover, connections, counts, conversations
      and unread counts
- [x] Block deletes the connection and any pending request in either direction
- [x] Blocked members read as **404**, not "you are blocked" — the latter tells
      them exactly what happened
- [x] The old conversation history is closed too, not merely hidden from the list
- [x] `reportModel.js`, member endpoint, admin endpoints, `role` + `requireAdmin`
- [x] Admin reports screen at `/admin/reports` with status transitions
- [x] "Block and report" as one action, checked by default
- [x] `express-rate-limit` on login (per IP **and** per email), register,
      forgot-password, resend-verification, reports, plus a global catch-all
- [x] Account lockout after 8 failed logins, cleared by a successful one
- [x] `trust proxy` driven by `TRUST_PROXY`
- [x] Socket message throttle (shipped in phase 03)
- [x] Session records, real logout, "log out everywhere", a sessions panel
- [ ] **Refresh-token rotation with an httpOnly cookie — not done**, see below
- [x] Block / Report menu on match detail and in message threads
- [x] 15 end-to-end tests in `client/tests/e2e/safety.spec.js`
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] After A blocks B, neither can see, connect to or message the other —
      including by guessing the id, and including the old message history.
- [x] Unblocking restores visibility but not the old connection.
- [x] Repeated wrong passwords lock the account, and the correct password is
      refused while it is locked.
- [x] A successful login clears the failure count.
- [x] A report appears in the admin list and can be actioned; ordinary members
      get 403 from the whole admin surface.
- [x] Logging out makes the old token useless immediately, and leaves other
      devices signed in.
- [x] Rate limiting counts per real client IP once `TRUST_PROXY` is set.
- [ ] Re-using a refresh token revokes the session family — needs the cookie
      work above.

## Watch out for

- Every new list endpoint added after this phase must apply `blockedIdsFor`.
  It is already in the definition of done in
  [01-conventions.md](../01-conventions.md).
- Hiding something from a list is not the same as closing it. The conversation
  list filtered blocked members out, but `GET /:id/messages` was still readable
  by id until that was fixed too. Check both whenever you hide something.
- Moving tokens out of `localStorage` breaks the current `ProtectedRoute` check,
  which reads `getToken()` synchronously. It will need a small auth context with
  a loading state.
- Rate limits are disabled in the test suite via `DISABLE_RATE_LIMITS=true`,
  set in `playwright.config.js`. The lockout tests exercise the per-account
  limit instead, which is not affected by that flag.
