# Phase 04 — Account security — SHIPPED

**Size:** M (about a week) · **Depends on:** phase 00 · **Blocks:** 10

> Delivered. Two things worth knowing:
> - **No provider key is needed to develop.** `EMAIL_TRANSPORT=file` writes
>   messages to `server/.dev-emails` and `GET /api/dev/emails` reads them back.
>   That router is only mounted when NODE_ENV is not production. Set
>   `EMAIL_TRANSPORT=resend` with a key to send for real.
> - `passwordChangedAt` is stamped **one second in the past**. A JWT's `iat` is
>   whole seconds, so a token minted in the same second as the change would
>   otherwise look older than it and invalidate itself immediately.

## Goal

Email verification, password reset, and changing your password while logged in.

## Why

- Anyone can register as any email address today. On an app where strangers meet,
  an unverified account is a safety problem, not just a data-quality one.
- The "Forgot password?" link on the login form goes nowhere. A user who forgets
  their password is permanently locked out.
- There is no way to change a password, so a user who thinks they were
  compromised can do nothing about it.

This phase is independent of matching and messaging, so it can run in parallel.

## Design

### Email delivery

Pick one provider and put it behind a thin wrapper so it can be swapped:

```js
// server/utils/sendEmail.js
module.exports = async function sendEmail({ to, subject, html }) { … };
```

Resend or SendGrid are both fine on a free tier. In development, log the email
to the console instead of sending, gated on `NODE_ENV`.

New env vars (add to `server/.env.example`):

```
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM="BUDDYFI <hello@yourdomain.com>"
APP_URL=http://localhost:5173
```

### Token storage

Store only a hash of each token, never the raw value — the same reason
passwords are hashed. The raw token goes in the emailed link.

Add to `userModel.js`:

```js
isVerified:               { type: Boolean, default: false },
verifyTokenHash:          { type: String, select: false },
verifyTokenExpires:       { type: Date,   select: false },
passwordResetTokenHash:   { type: String, select: false },
passwordResetExpires:     { type: Date,   select: false },
passwordChangedAt:        { type: Date,   select: false },
```

Generate and hash:

```js
const raw = crypto.randomBytes(32).toString('hex');
const hash = crypto.createHash('sha256').update(raw).digest('hex');
```

Verification tokens expire in 24 hours, reset tokens in 1 hour.

### Invalidating old sessions

When a password changes, set `passwordChangedAt`. In `protect`, reject any token
issued before that moment:

```js
if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
  return res.status(401).json({ message: 'Password recently changed. Please log in again.' });
}
```

This is the only revocation mechanism until phase 07 adds refresh tokens.

## Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/verify-email/send` | yes | resend the verification email |
| GET | `/api/auth/verify-email/:token` | no | confirm the address |
| POST | `/api/auth/forgot-password` | no | email a reset link |
| POST | `/api/auth/reset-password/:token` | no | set a new password |
| PATCH | `/api/auth/change-password` | yes | requires the current password |

`forgot-password` must return the **same** response whether or not the email
exists — otherwise it becomes an account-enumeration oracle.

## What verification gates

Decide deliberately, and keep it consistent:

- Unverified users **can** log in, finish the quiz and edit their profile.
- Unverified users **cannot** appear in Discover, send connection requests, or
  send messages.

Enforce with a small middleware after `protect`:

```js
// server/middlewares/requireVerified.js
```

Show a dismissible banner in `AppShell` while `isVerified` is false, with a
Resend button.

## Client work

- `/verify-email/:token` page — verifying / success / expired states.
- `/forgot-password` page — one email field, then a "check your inbox" state.
- `/reset-password/:token` page — new password + confirm, with the same strength
  rules as signup.
- Point the existing "Forgot password?" link in
  [LoginForm.jsx](../../client/src/components/LoginForm/LoginForm.jsx) at the
  real page.
- Change-password form on the profile page.
- Unverified banner in `AppShell`.

All four pages use `AuthLayout` so they match login and signup.

## Tasks

- [x] `sendEmail.js` with three transports: file (default off prod), console, resend
- [x] Dev inbox at `GET /api/dev/emails`, never mounted in production
- [x] Token fields on the user model, all `select: false`
- [x] SHA-256 hash at rest for both token types; only the raw value is emailed
- [x] Verification email on register, and a mail failure never fails signup
- [x] Five endpoints
- [x] `requireVerified` on discover, connections and conversations
- [x] Unverified members are also **hidden from other people's Discover**
- [x] `passwordChangedAt` check inside `protect`
- [x] Three client pages on `AuthLayout` (verify, forgot, reset)
- [x] Change-password form on the profile page
- [x] Unverified banner with resend, above every signed-in page
- [x] 9 end-to-end tests in `client/tests/e2e/account-security.spec.js`
- [ ] Rate limit the resend and forgot-password endpoints — deferred to phase 07
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] Registering sends a verification email; the link flips `isVerified`.
- [x] An expired or reused token gives a clear error, not a crash.
- [x] Forgot-password returns a byte-identical response for known and unknown
      emails — asserted in the test suite, not just by eye.
- [x] Resetting the password logs out existing sessions and the old password
      stops working.
- [x] Changing the password requires the current one, and hands the caller a
      fresh token since their own was just retired.
- [x] Unverified accounts cannot browse, connect or message, and see the banner.
- [x] Unverified accounts can still log in, take the quiz and manage their own
      profile.

## Watch out for

- Hash the new password on reset. It is easy to write
  `user.password = newPassword` and store it in plain text.
- Clear both token fields after a successful use.
- `select: false` fields need `.select('+passwordResetTokenHash')` to be read.
- **A single-use link plus a React effect is a trap.** StrictMode runs effects
  twice in development, so the verify page consumed its own token and then
  reported the link as invalid. `VerifyEmail.jsx` guards with a ref. Any future
  single-use request from an effect needs the same treatment.
