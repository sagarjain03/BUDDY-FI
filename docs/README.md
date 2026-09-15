# BUDDY-FI build plan

This folder is the plan for taking BUDDY-FI from "signup and a user list" to a
working friendship app. The work is split into phases. Each phase is a document
with its own scope, schema changes, endpoints, UI, task list and acceptance
criteria.

**Work one phase at a time, in order, and merge it before starting the next.**
Later phases assume the earlier ones exist.

## How to use these docs

1. Read [00-current-state.md](00-current-state.md) first — it describes what is
   already built, so you do not rebuild it by accident.
2. Read [01-conventions.md](01-conventions.md) before writing UI. The design
   system already exists; the fastest way to make the app look inconsistent
   again is to hand-roll a button.
3. Pick the lowest-numbered unfinished phase. Work through its **Tasks**
   checklist, ticking boxes in the file as you go.
4. Before opening a PR, confirm every line in that phase's **Done when** list.
5. Update [00-current-state.md](00-current-state.md) when a phase ships, so the
   next person starts from an accurate picture.

## Phases

| # | Phase | Why it matters | Size |
|---|-------|----------------|------|
| 00 | [Stabilise](phases/phase-00-stabilise.md) ✅ | Local DB, CI, smoke tests. Atlas password still needs rotating | S |
| 01 | [Matching engine](phases/phase-01-matching.md) ✅ | Compatibility scoring and a ranked Discover | M |
| 02 | [Connections](phases/phase-02-connections.md) ✅ | Friend requests, buddies list, navbar badge | M |
| 03 | [Direct messaging](phases/phase-03-messaging.md) ✅ | Persisted one-to-one chat, authenticated sockets, unread counts | L |
| 04 | [Account security](phases/phase-04-account-security.md) ✅ | Email verification, password reset, change password | M |
| 05 | [Richer profiles](phases/phase-05-profiles.md) ✅ | Photos, bio, interests, inclusive gender options | M |
| 06 | [Proximity discovery](phases/phase-06-proximity.md) ✅ | Distance bands, radius filter, sharing off switch | S |
| 07 | [Safety and abuse](phases/phase-07-safety.md) 🟡 | Block, report, rate limiting, real logout. Cookie-based refresh tokens outstanding | M |
| 08 | [Notifications and presence](phases/phase-08-notifications.md) ✅ | Live notifications, presence, weekly digest | M |
| 09 | [Dynamic quiz](phases/phase-09-dynamic-quiz.md) ✅ | Questions in the database; adding one needs no deploy | S |
| 10 | [Launch readiness](phases/phase-10-launch.md) 🟡 | Legal pages, deletion, export, bundle cut 66%. Hosting and monitoring outstanding | M |

Size is rough: **S** is a day or two, **M** is about a week, **L** is two weeks
or more for one person.

## Non-negotiables

Three things must be true before this app is shown to people outside the team.
They are spread across phases 00, 04 and 07, and they are called out here
because they are easy to postpone forever:

- **The Atlas password must be rotated.** The old one was committed to git
  history and is still readable by anyone who can see this repo. Phase 00.
- ~~Email addresses must be verified.~~ Done in phase 04.
- ~~Users must be able to block and report each other.~~ Done in phase 07.
- **The 7-day token still lives in `localStorage`.** An XSS could steal it and
  use it until it expires. The fix is the refresh-token work left open at the
  end of phase 07.

## Suggested order if you are more than one person

Phases 01–03 are the critical path and should belong to one person or pair, in
order. In parallel:

- Phase 04 (account security) is independent of matching and messaging.
- Phase 05 (profiles) only touches the user model and profile screens.
- Phase 09 (dynamic quiz) is small and self-contained.

Phases 06, 07, 08 and 10 depend on earlier work and should wait.
