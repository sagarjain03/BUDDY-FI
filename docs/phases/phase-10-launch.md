# Phase 10 — Launch readiness — PARTLY SHIPPED

**Size:** M (about a week) · **Depends on:** 00, 04, 05, 07

> The work that lives in this repository is done: legal pages, account deletion,
> data export, and the bundle. **Everything that needs an account somewhere else
> — hosting, a domain, Sentry, uptime checks — is still yours to do**, and is
> listed unticked below rather than quietly dropped.

## Goal

Get BUDDY-FI deployed, observable, legally presentable, and installable on a
phone.

## Why

Everything so far runs on two laptops. Launching is its own body of work:
hosting, secrets, monitoring, the legal pages the signup form already links to,
and the performance problems the bundle is already showing.

## Deploy

| Piece | Suggestion | Notes |
|-------|------------|-------|
| API | Render / Railway / Fly.io | Needs a persistent process for Socket.IO — not a serverless function |
| Front end | Vercel / Netlify / Cloudflare Pages | Static build, SPA rewrite to `index.html` |
| Database | MongoDB Atlas | Already there. Lock Network Access to the API's egress IPs |
| Images | Cloudinary | From phase 05 |

Checklist:

- [ ] Separate `buddyfi_dev`, `buddyfi_staging`, `buddyfi_prod` databases via
      `MONGO_DB_NAME`.
- [ ] Every secret set in the host's environment UI. Nothing in the repo.
- [ ] A different `JWT_SECRET` per environment.
- [ ] `CLIENT_ORIGIN` set to the real front-end domain — not `*`.
- [ ] `app.set('trust proxy', 1)` so rate limiting sees real client IPs.
- [ ] SPA rewrite configured, or every deep link 404s on refresh.
- [ ] `VITE_API_URL` pointing at the deployed API.
- [ ] CORS verified from the real domain, and verified to *fail* from another.
- [ ] Health check wired to `/health`.
- [ ] Automatic deploys from `main`, with the phase 00 CI gate required first.

## Performance

The production bundle is currently about 1.2 MB of JavaScript (roughly 340 KB
gzipped) in a single chunk, and Vite warns about it on every build. Almost all
of it is three.js, loaded for one decorative laptop on the Welcome page.

- [x] Route-level code splitting with `React.lazy` + `Suspense` in
      [App.jsx](../../client/src/App.jsx). The Welcome page carries three.js, so
      splitting the routes took it out of the initial chunk.
      **Initial JS: 1,201 kB → 408 kB (gzip 338 kB → 140 kB).**
- [ ] `manualChunks` to split the remaining vendor code further.
- [x] `prefers-reduced-motion` is respected throughout — every animation falls
      back to static (`client/src/lib/motion.js`).
- [ ] Compress the images in `client/src/assets/`. Several quiz option images
      are over 1 MB; `diff.png` is over 2 MB. Convert to WebP and resize to what
      is actually displayed.
- [ ] Add `loading="lazy"` to below-the-fold images (already done on Home and
      the quiz grid — check new pages).
- [ ] Target Lighthouse 90+ on performance and accessibility for `/`, `/login`
      and `/discover`.

## Monitoring

- [ ] Error tracking (Sentry or similar) on both client and server, with source
      maps uploaded and **PII scrubbing on** — this app holds emails and
      coordinates.
- [ ] Structured request logging (`pino` or `morgan`) with request ids.
- [ ] Uptime check against `/health` with an alert.
- [ ] Atlas alerts for connection count and disk.
- [ ] A basic metrics view: signups, quiz completions, connections made,
      messages sent, per day.

## Legal and content

The signup form already has "Terms of Service" and "Privacy Policy" checkboxes
that link nowhere. Either build the pages or remove the claim.

- [x] `/terms`, `/privacy` and `/guidelines`, linked from the footer and from
      the signup checkbox, which previously linked nowhere.
- [x] The privacy policy names every field actually stored, what other members
      can see, and what is never shown.
- [x] **Account deletion.** `DELETE /api/auth/me` requires the password and
      removes the member, their messages, conversations, connections,
      notifications, blocks, sessions and uploaded photo. Reports they filed are
      kept but anonymised — moderation history should not be erasable by the
      person who caused it.
- [x] Data export at `GET /api/auth/me/export`, downloadable from the profile.
- [x] Minimum age 13, matching the terms.

## PWA

- [ ] `vite-plugin-pwa` with a manifest and the existing favicon as the icon
      source.
- [ ] Offline shell so the app does not show a browser error page on a flaky
      connection.
- [ ] Web push for new messages, sharing the preference screen from phase 08.
- [ ] Verify "Add to home screen" works on Android and iOS Safari.

## Accessibility pass

The design system already uses a consistent focus ring and semantic elements.
Verify:

- [ ] Every interactive element is reachable and operable by keyboard.
- [ ] The quiz option grid is navigable with arrow keys.
- [ ] Modals and the notification dropdown trap focus and close on Escape.
- [ ] Colour contrast meets AA, particularly `ink-400` and `ink-500` on white.
- [ ] Images have meaningful `alt`, decorative ones have `alt=""`.
- [ ] Screen-reader pass over signup, quiz and chat.

## Done when

- [ ] The app is live on a real domain over HTTPS.
- [ ] A new user can sign up, verify their email, complete the quiz, connect and
      message someone — entirely on production.
- [ ] Deep links work after a refresh.
- [ ] Errors reach the tracker with a usable stack trace and no PII.
- [x] Terms, privacy, guidelines, deletion and export all exist and work.
- [x] Initial JavaScript is 140 KB gzipped, down from 338 KB.
- [ ] Lighthouse performance and accessibility are 90+ on the three key pages.

## After launch

Ideas worth considering once real people are using it — do not build these
before the phases above:

- Group hangouts and events ("who wants to watch this on Friday")
- Icebreaker prompts generated from shared answers
- Mutual-friend signals ("you both know Priya")
- Interest-based rooms replacing the old global chat
- Voice notes in DMs
- Referral invites
- Streaks or badges — use sparingly; gamifying friendship goes wrong easily
