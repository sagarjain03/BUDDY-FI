# Phase 00 — Stabilise

**Size:** S (a day or two) · **Depends on:** nothing · **Blocks:** everything

## Goal

Close out the security incident, get the current refactor committed, and put a
CI check in place so the next ten phases cannot silently break the build.

## Why

The repo's Atlas connection string was committed to git and is still in history.
Until the password is rotated, anyone who can read this repository — including
anyone who ever cloned it — has write access to the production database. Nothing
else in this plan matters more than that.

The working tree also currently holds a large uncommitted refactor (security
fixes + UI rebuild). Leaving it uncommitted risks losing it.

## Tasks

### Move development off Atlas — DONE

Development now runs against a local MongoDB 8.0 instead of Atlas, so the
compromised Atlas credential is no longer used day to day.

- [x] Local `mongod` on `127.0.0.1:27017`, data directory `~/mongodb-data/buddyfi`
- [x] Existing `buddyfi` users copied from Atlas to local
- [x] `server/.env` points at `mongodb://127.0.0.1:27017`; the Atlas string is
      commented out in place and also kept in `server/.env.atlas.backup`
      (gitignored)
- [x] `server/.gitignore` widened to `.env.*` with `!.env.example`

The Windows "MongoDB" service exists but is stopped and starting it needs
administrator rights. Until it is enabled, start the database manually:

```bash
"/c/Program Files/MongoDB/Server/8.0/bin/mongod.exe" --dbpath "$HOME/mongodb-data/buddyfi" --port 27017 --bind_ip 127.0.0.1
```

To start it as a service instead, run `net start MongoDB` from an
administrator terminal once, and set the service to Automatic.

### Still outstanding: the Atlas credential itself

Moving to localhost stops *this* project using the leaked password. It does not
make the password safe. That Atlas cluster still hosts other projects
(`captains`, `rides`, `battles`, `urls` collections) and anyone who can read
this repository's git history can still connect to all of them.

- [ ] In MongoDB Atlas → Database Access, change the password for that database
      user, or delete the user if nothing needs it any more.
- [ ] In Atlas → Network Access, replace any `0.0.0.0/0` entry with specific IPs.
- [ ] Update any other project that used that credential.

Optional but worth it: purge the secret from history with
`git filter-repo --path server/.env --invert-paths`, then force-push. This
rewrites history for everyone, so agree it with collaborators first. **Rotating
the password is mandatory; rewriting history is not a substitute for it.**

### Commit the current work

Deferred by request — the work is still in the working tree.

- [ ] Review `git status` — the deletion of ~1500 tracked `node_modules` files
      and `server/.env` is intentional.
- [ ] Commit in logical chunks: (1) gitignore + untracking, (2) server security
      fixes, (3) client API layer, (4) design system + UI rebuild, (5) docs,
      (6) CI + tests.
- [ ] Open a PR, or push to `main` if the team is working that way.

### Add CI — DONE

- [x] `.github/workflows/ci.yml` with three jobs: **lint-and-build**, **audit**
      (fails on high or critical in either workspace), and **e2e** (Playwright
      against a `mongo:7` service container).
- [x] Root scripts: `npm test` and `npm run ci`.
- [ ] Make the check required on `main` — needs repository settings access.

### Add a smoke test — DONE

- [x] `@playwright/test` in `client/`, config at `client/playwright.config.js`
      (starts both servers itself via `webServer`).
- [x] Six specs in `client/tests/e2e/signup-flow.spec.js`:
      full signup → quiz → profile shows "7 of 7 questions answered";
      password-mismatch validation; protected routes redirect when logged out;
      login → logout clears the token; wrong password is rejected; Discover
      shows another member and never their email.
- [x] Runs against `buddyfi_test`, never the real database.
- [x] `server/scripts/cleanup-test-users.js` deletes `pwtest-*` accounts after
      each run, and **refuses to run against a database whose name does not
      contain "test"** unless explicitly overridden.
- [x] Wired into CI.

Run locally with `npm test` from the repo root.

## Done when

- [x] The app runs without touching Atlas.
- [x] The smoke test passes locally against a throwaway database.
- [x] Lint, build and audit all pass.
- [ ] The Atlas password is rotated or the user deleted.
- [ ] `git status` is clean.
- [ ] CI has actually run on GitHub (needs the branch pushed).
- [ ] The CI check is required on `main`.

## Notes

The `dcrypt` dependency that used to sit in the root `package.json` was a
typo-squat of `bcrypt` and has been removed. If you ever see it come back in a
lockfile, treat it as a supply-chain problem, not a typo.
