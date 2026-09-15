# Phase 01 — Matching engine — SHIPPED

**Size:** M (about a week) · **Depends on:** phase 00 · **Blocks:** 02, 06

> Delivered. Affinity groups live on each question in
> [quizQuestions.js](../../server/config/quizQuestions.js) rather than a
> separate `affinity.js`, so the grouping sits with the data it describes.

## Goal

Turn Discover from "a list of every user" into "people ranked by how much they
actually have in common with you", and show *why* each person matched.

## Why

The landing page promises matching. The quiz collects seven answers. Nothing
currently reads them. This is the single change that turns the project from a
CRUD demo into the product it claims to be.

## Design

### Scoring

Start simple and explainable. Two users are compared answer by answer:

- Identical answer → **2 points**
- Different answer but in the same affinity group → **1 point**
- Otherwise → **0 points**

Maximum is 14 (7 questions × 2). Compatibility percentage is
`Math.round(score / 14 * 100)`.

Affinity groups let near-misses count. Define them per question, for example:

```js
// server/config/affinity.js
module.exports = {
  // question 2 — ideal weekend
  1: [
    ['Hanging out with friends', 'Exploring new places'],   // outgoing
    ['Binge-watching TV shows', 'Reading a good book'],      // homebody
  ],
  // question 5 — dream vacation
  4: [
    ['Beach Relaxation', 'Cultural Tour'],                   // slow travel
    ['Mountain Trekking', 'City Exploration'],               // active travel
  ],
  // …
};
```

Keys are the zero-based question index. A question with no entry simply scores
0 for non-identical answers.

Keep the algorithm in one pure, testable module — do not scatter it through the
controller.

### Where it runs

At this scale (tens to low thousands of users) computing scores in Node on
request is fine and much simpler than an aggregation pipeline. Fetch candidates,
score in memory, sort, paginate. Revisit only if `/discover` gets slow.

## Server work

Create `server/utils/compatibility.js`:

```js
/**
 * @returns {{ score: number, percent: number, shared: string[] }}
 * `shared` lists the labels of questions where both answered identically.
 */
function compareUsers(a, b) { … }
```

Add `server/controllers/discoverController.js` and
`server/routes/discoverRoutes.js`, mounted at `/api/discover` in `app.js`.

| Method | Route | Query | Returns |
|--------|-------|-------|---------|
| GET | `/api/discover` | `page`, `limit`, `minScore` | matches sorted by percent, descending |
| GET | `/api/discover/:id` | — | one user plus the breakdown against the caller |

Response shape:

```json
{
  "status": "success",
  "results": 12,
  "page": 1,
  "totalPages": 3,
  "data": {
    "matches": [
      {
        "user": { "_id": "…", "name": "Priya Sharma", "age": 23, "gender": "female", "hobbies": {…} },
        "percent": 71,
        "shared": ["Music taste", "Weekend plans", "Social setting"]
      }
    ]
  }
}
```

Rules:

- Exclude the caller (`_id: { $ne: req.user._id }`).
- Exclude users who have not finished the quiz, or return them in a separate
  "new members" bucket — do not rank them at 0% among real matches.
- Never return `email`.
- Default `limit` 12, hard cap 50.

## Client work

- Replace the `/api/auth/show-users` call in
  [ShowUsers.jsx](../../client/src/pages/ShowUsers.jsx) with `/api/discover`.
- Add a compatibility ring or badge to each card. `Compatibility.jsx` already
  renders a conic-gradient ring and takes a `score` prop — reuse it.
- Show the `shared` labels as `.chip`s: "You both picked Jazz".
- Sort control: Best match (default) / Newest.
- Add a `MatchDetail` page at `/discover/:id` showing the full seven-question
  comparison side by side, with a Connect button (wired up in phase 02).
- Keep the loading skeletons and empty state that already exist.

Once `/api/discover` ships, deprecate `GET /api/auth/show-users` — remove it in
the same PR so there is only one way to list people.

## Tasks

- [x] Affinity groups on every question in `server/config/quizQuestions.js`
- [x] `server/utils/compatibility.js` — pure `compareUsers(a, b)`
- [x] 12 unit tests (`npm run test:server`)
- [x] `discoverController.js` + `discoverRoutes.js`, mounted and protected
- [x] Pagination, `minScore` filter, `sort=match|newest`
- [x] `showUsers` removed from `authController.js` and its route deleted
- [x] Discover cards rebuilt with an animated ring and shared-answer chips
- [x] `/discover/:id` detail page with the full seven-question comparison
- [x] Sort and score-filter controls
- [x] 9 end-to-end tests in `client/tests/e2e/discover.spec.js`
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] Discover is sorted by compatibility, highest first.
- [x] Each card shows a percentage and the shared answers.
- [x] Two accounts with identical answers show 100% for each other.
- [x] Two accounts with no overlap show 0%, with copy that reads sensibly.
- [x] A user who has not finished the quiz never appears as a ranked match —
      they go in a `newMembers` bucket, sorted newest first.
- [x] Pagination works; `limit` is capped at 50.
- [x] No email address appears in any `/api/discover` response.

## Watch out for

- `hobbies` is a Mongoose `Map`. Read it with `user.hobbies.get('hobby1')` or
  convert with `Object.fromEntries(user.hobbies)` — plain property access on a
  Map returns `undefined`.
- A user with partial answers must not crash the scorer. Treat a missing answer
  as 0 points, not as a mismatch to throw on.
