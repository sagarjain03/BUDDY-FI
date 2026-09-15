# Current state

What exists in the repo today. Read this before starting any phase.

Last updated: 2026-09-15, after phase 10.

## Stack

| Layer | Choice |
|-------|--------|
| Front end | React 18, Vite, Tailwind CSS, React Router 7 |
| 3D | three.js via `@react-three/fiber` and `@react-three/drei` (Welcome hero only) |
| Animation | Framer Motion + GSAP ScrollTrigger (parallax, reveals, page transitions) |
| Back end | Express 4, Mongoose 8, MongoDB 8 (local) |
| Auth | JWT (`jsonwebtoken`), bcrypt hashes |
| Realtime | Socket.IO 4 |
| Tests | Playwright (`client/tests/e2e/`) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

## Layout

```
client/
  index.html                  title, meta, Google Fonts (Sora + Inter)
  tailwind.config.js          design tokens: brand, ink, accent, fonts, shadows
  src/
    index.css                 base layer + component classes (.btn, .card, .field-input…)
    lib/api.js                API base URL, token storage, apiFetch wrapper
    App.jsx                   router, every protected route wrapped
    components/
      ui/                     Button, Input, Alert, Avatar, Logo, EmptyState,
                              MatchRing, ConnectButton
      layout/                 AppShell, AuthLayout, Navbar, MarketingNav, Footer
      motion/                 Reveal, RevealGroup, Parallax, PageTransition
      ProtectedRoute/         redirects to /login when no token
      LoginForm/ SignUpForm/ Questionpage/ SocialLogin/
      Profile/ Personality/ Compatibility/ About/    (profile page sections)
      MacContainer/           the 3D laptop on Welcome
    lib/motion.js             shared easings, durations, variants, reduced-motion hook
    pages/                    Home, Login, SignUp, QuestionForm, Welcome,
                              ShowUsers, MatchDetail, Buddies, Chat, Location,
                              UserProfile
  playwright.config.js        starts both servers, points at buddyfi_test
  tests/e2e/                  signup-flow.spec.js, helpers.js, global-teardown.js
server/
  app.js                      express + CORS allowlist + Socket.IO + error handler
  config/db.js                Mongo connection, honours MONGO_DB_NAME
  config/quizQuestions.js     the 7 questions, their options and affinity groups
  models/userModel.js
  models/connectionModel.js   friend requests, one record per pair
  models/conversationModel.js one per pair, with a denormalised unread map
  models/blockModel.js        symmetric blocks
  models/reportModel.js       the moderation queue
  models/sessionModel.js      one row per signed-in device; deleting it logs out
  models/notificationModel.js in-app notifications, TTL on read rows
  models/questionModel.js     the quiz itself — questions and their options
  services/notifyService.js   the single place notifications are created
  services/presenceService.js multi-socket online tracking
  services/questionService.js cached questions + legacy answer fallback
  services/digestService.js   the weekly email
  scripts/migrate-quiz.js     seeds the quiz and migrates hobbies -> answers
  scripts/send-digest.js      run from a scheduler, never in-process
  utils/blocks.js             blockedIdsFor — apply this to EVERY list query
  middlewares/rateLimit.js    per-route limits, skipped when DISABLE_RATE_LIMITS
  models/messageModel.js      body capped at 2000 characters
  services/messageService.js  all persistence and fan-out for messaging
  socket/index.js             handshake auth, per-user rooms, event handlers
  utils/compatibility.js      pure scorer: compareUsers(a, b)
  utils/sendEmail.js          file / console / resend transports
  utils/imageStore.js         local / cloudinary, magic-byte type check
  utils/geo.js                GeoJSON helpers, haversine, distance banding
  scripts/migrate-location.js one-off move to GeoJSON, idempotent
  middlewares/uploadAvatar.js multer memory storage, 5 MB cap
  utils/authTokens.js         single-use tokens, hashed at rest
  middlewares/requireVerified.js  gates the social surface on a real address
  utils/connections.js        findBetween, areConnected, describe, statusMapFor
  controllers/               authController, discoverController, connectionController
  routes/                     authRoutes, discoverRoutes, connectionRoutes
  tests/compatibility.test.js 12 unit tests (node --test)
  middlewares/authMiddleware.js   protect(): verifies Bearer token, sets req.user
  utils/signToken.js
  scripts/cleanup-test-users.js   deletes pwtest-* accounts, guards real databases
.github/workflows/ci.yml        lint + build, audit, end-to-end
```

## Data model

One collection, `users`:

```js
{
  name:     String,   // required
  email:    String,   // required, unique, lowercase
  password: String,   // bcrypt hash, select: false
  age:      Number,   // 13–120
  gender:   String,   // female | male | non-binary | other | prefer-not-to-say
  avatar:   { url: String, publicId: String },  // absent when there is no photo
  bio:      String,   // max 240
  interests: [String],// max 8, each max 30
  // Legacy positional answers. Read only as a fallback; being dropped.
  hobbies:  Map<String, String>,
  answers:  [{ question: ObjectId, value: String, answeredAt: Date }],
  role:     String,                // user | admin
  isOnline: Boolean, lastSeenAt: Date, sharePresence: Boolean,
  emailPrefs: { digest: Boolean },
  // GeoJSON. coordinates are [longitude, latitude] — that order, always.
  location: { type: 'Point', coordinates: [Number, Number], updatedAt: Date },
  shareLocation: Boolean,          // default true; off hides distance and
                                   // removes the member from radius searches

  isVerified: Boolean,             // gates discover, connections, messaging
  verifyTokenHash, verifyTokenExpires,          // select: false
  passwordResetTokenHash, passwordResetExpires, // select: false
  passwordChangedAt,                            // select: false, revokes old JWTs

  createdAt, updatedAt
}
```

`hobbies` keys are `hobby1`…`hobby7` and map positionally to the seven quiz
questions, in the order they appear in
[QuestionPage.jsx](../client/src/components/Questionpage/QuestionPage.jsx).
Nothing enforces that mapping — phase 09 fixes it.

## API

Base path `/api/auth`. Everything except register and login requires
`Authorization: Bearer <token>`.

**`/api/auth`**

| Method | Route | Auth | Returns |
|--------|-------|------|---------|
| POST | `/register` | no | `{ status, token, data.user }` |
| POST | `/login` | no | `{ status, token, data.user }` |
| GET | `/verify-email/:token` | no | confirms the address |
| POST | `/forgot-password` | no | emails a reset link, same answer either way |
| POST | `/reset-password/:token` | no | sets a new password, returns a token |
| GET | `/me` | yes | the caller's own profile |
| PATCH | `/me` | yes | edit name, age, gender, bio, interests — nothing else |
| POST | `/me/avatar` | yes | multipart upload, field `avatar` |
| DELETE | `/me/avatar` | yes | back to the initials avatar |
| DELETE | `/me/location` | yes | forget the stored position |
| POST | `/answers` | yes | save quiz answers (partial allowed) |
| GET | `/answers` | yes | the caller's answers, with labels |
| GET | `/me/export` | yes | everything we hold, as JSON |
| DELETE | `/me` | yes | delete the account; needs the password |
| GET | `/unsubscribe/:userId/:token` | no | stop the weekly email |
| POST | `/logout` | yes | ends this session on the server |
| GET | `/sessions` | yes | where this account is signed in |
| DELETE | `/sessions` | yes | sign out every other device |
| POST | `/verify-email/send` | yes | resend the verification email |
| PATCH | `/change-password` | yes | needs the current password |
| POST | `/submit-answers` | yes | saves `hobbies` for the caller |
| POST | `/update-location` | yes | saves `{ longitude, latitude }` |

Discover, connections and conversations additionally require a **confirmed
email**; they answer 403 with a EMAIL_NOT_VERIFIED code otherwise. Unverified
members are hidden from other people's Discover.

In development only, `GET /api/dev/emails` and `/api/dev/emails/latest?to=`
read the local inbox that the file email transport writes.

**`/api/discover`** — all protected

| Method | Route | Returns |
|--------|-------|---------|
| GET | `/` | ranked matches (`?sort=match|distance|newest&minScore&radius&page&limit`), plus `newMembers` |
| GET | `/:id` | one member and the seven-question breakdown against the caller |

**`/api/conversations`** — all protected

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | conversations, most recent first, with unread counts |
| POST | `/` | find or create with `{ userId }` — requires an accepted connection |
| GET | `/unread-count` | total unread, for the navbar badge |
| GET | `/:id/messages` | history, 30 per page, `?before=<iso>` cursor |
| PATCH | `/:id/read` | mark the conversation read |

**`/api/questions`** and **`/api/notifications`** — all protected

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/questions` | the active quiz, in order |
| GET | `/api/notifications` | paginated, newest first |
| GET | `/api/notifications/unread-count` | for the bell |
| PATCH | `/api/notifications/read` | mark all read |
| PATCH | `/api/notifications/:id/read` | mark one read |

**`/api/blocks`**, **`/api/reports`**, **`/api/admin`** — all protected

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/blocks` | block someone; also removes the connection |
| GET | `/api/blocks` | who you have blocked |
| DELETE | `/api/blocks/:userId` | unblock — the old connection does not return |
| POST | `/api/reports` | report, optionally blocking at the same time |
| GET | `/api/admin/reports` | admin only |
| PATCH | `/api/admin/reports/:id` | admin only |

Blocks are **symmetric**: a blocked member is invisible in both directions, in
Discover, connections, conversations, counts and history. They read as `404`
rather than "you are blocked".

**`/api/connections`** — all protected

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/` | send a request (accepts theirs if they asked first) |
| GET | `/` | accepted connections |
| GET | `/counts` | `{ incoming, buddies }` for the navbar badge |
| GET | `/pending` | incoming requests |
| GET | `/sent` | outgoing requests |
| PATCH | `/:id/accept` | recipient only |
| PATCH | `/:id/decline` | recipient only |
| DELETE | `/:id` | withdraw if pending, remove if accepted |

Scoring: identical answer 2 points, same affinity group 1, otherwise 0.
Maximum 14, reported as a percentage. Members who have not finished the quiz are
never ranked — they come back in `newMembers`, newest first.

`GET /health` on the server root returns `{"status":"ok"}`.

Errors are always JSON: `{ status: 'error', message }`, or
`{ errors: [...] }` from express-validator on register.

## Socket.IO

Authenticated. The handshake carries the JWT (`auth.token`); a socket without a
valid one is refused. Each socket joins `user:<id>`, so the server can push to a
person across all their tabs without knowing which conversation is open.

| Event | Direction | Payload |
|-------|-----------|---------|
| `message:send` | client → server | `{ conversationId, body }`, acknowledged |
| `message:new` | server → client | the saved message with its sender |
| `message:read` | client → server | `{ conversationId }` |
| `conversation:updated` | server → client | the conversation, from that viewer's side |
| `typing:start` / `typing:stop` | both | `{ conversationId }` |

The sender is always `socket.userId`, never anything the client sends. Messages
are persisted **before** anything is broadcast, and capped at 20 per 10 seconds
per socket.

## Environment

`server/.env` (gitignored, copy from `.env.example`):

```
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB_NAME=buddyfi
PORT=5000
JWT_SECRET=…
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

`client/.env`:

```
VITE_API_URL=http://localhost:5000
```

`MONGO_DB_NAME` matters. Without it Mongoose falls back to the `test` database,
which on the old Atlas cluster is shared with other projects and already
contains an unrelated `users` collection.

Development runs against **local MongoDB 8.0**, not Atlas. The Windows service
is stopped and needs admin rights to enable, so start it by hand:

```bash
"/c/Program Files/MongoDB/Server/8.0/bin/mongod.exe" --dbpath "$HOME/mongodb-data/buddyfi" --port 27017 --bind_ip 127.0.0.1
```

## Running it

```bash
npm run install:all     # from the repo root
npm run start:server    # API on :5000
npm run start:client    # front end on :5173
npm test                # Playwright suite, starts both servers itself
npm run ci              # lint + build + tests, what CI runs
```

`npm test` uses the `buddyfi_test` database and deletes the accounts it creates
afterwards. `server/scripts/cleanup-test-users.js` refuses to run against a
database whose name does not contain "test".

## What already works

- Register → quiz → welcome → discover → profile → logout, end to end.
- JWT issued on both register and login; protected routes reject missing,
  invalid and expired tokens.
- `show-users` excludes the caller and never returns email addresses.
- CORS is an allowlist driven by `CLIENT_ORIGIN`; a foreign origin gets 403.
- Lint is clean, the production build passes, `npm audit` reports 0
  vulnerabilities on both sides.
- 94 Playwright end-to-end tests and 22 server unit tests, all passing.
- Live notifications, presence across multiple tabs, a weekly digest with a
  working unsubscribe, and per-member privacy switches.
- The quiz lives in the database: adding a question needs no deploy.
- Legal pages, data export and account deletion.
- Initial JavaScript is 140 KB gzipped (was 338 KB) thanks to route splitting.
- Blocking and reporting, an admin moderation queue, rate limiting on every
  auth route, account lockout, and sessions you can actually end.
- Proximity: distance bands on cards, a radius filter backed by a 2dsphere
  index, a Nearest sort, and a per-member sharing switch. Another member's
  exact coordinates are never returned, and anything under 2 km is reported
  only as a band.
- Profile photos, bios and interests, with an allowlist that stops a member
  editing anything but their own editable fields.
- Email verification, password reset and change-password, with old sessions
  revoked on any password change.
- Real one-to-one messaging: persisted history, live delivery, unread counts,
  typing indicators, gated on an accepted connection.
- Compatibility scoring, ranked Discover, match detail breakdown.
- Friend requests: send, accept, decline, withdraw, remove, with server-side
  authorisation on every transition.
- Parallax and scroll animations throughout, all disabled under
  `prefers-reduced-motion`.
- CI runs lint, build, audit and the end-to-end suite on every push and PR.

## Known gaps

These are the phases. In short:

- Chat is one anonymous global room with no history.
- The 7-day token lives in `localStorage`. Sessions are revocable, but the
  cookie-based refresh-token split from phase 07 is still outstanding.

- No rate limiting anywhere. A 7-day JWT in `localStorage` cannot be revoked.
- Quiz questions are hardcoded in a React component.
- Not deployed anywhere: no hosting, no domain, no error tracking, no uptime
  check. See phase 10 for the checklist.
- No PWA yet, and no accessibility audit has been run.
- `hobbies` is still on the user model as a migration fallback.
- The old Atlas credential is still live in git history and still works against
  that cluster. Development no longer uses it, but it has not been rotated.
- All of the above work is still uncommitted in the working tree.
