# Phase 02 — Connections — SHIPPED

**Size:** M (about a week) · **Depends on:** 01 · **Blocks:** 03, 07, 08

> Delivered. Two additions beyond the original plan:
> `GET /api/connections/counts` (a cheap two-number endpoint for the navbar
> badge), and sending a request to someone who already asked you now **accepts
> theirs** instead of erroring.

## Goal

Friend requests. A user can send, accept, decline and withdraw a request, and
has a "My buddies" list. Messaging in phase 03 will be gated on an accepted
connection.

## Why

Without this, anyone can message anyone, which is both a product problem (no
sense of progress, nothing to come back for) and a safety problem (unsolicited
messages from strangers, with no way to stop them).

## Design

### Model

`server/models/connectionModel.js`:

```js
const connectionSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'withdrawn'],
    default: 'pending',
  },
  respondedAt: Date,
}, { timestamps: true });

// One connection record per pair, in either direction.
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
```

### Preventing duplicate pairs

The unique index above stops A→B twice, but not A→B plus B→A. Before creating a
request, look for an existing record in **either** direction:

```js
const existing = await Connection.findOne({
  $or: [
    { requester: me, recipient: them },
    { requester: them, recipient: me },
  ],
});
```

If one exists and is `pending` from them to you, accepting is the right action
rather than creating a second request. Handle that explicitly.

### State transitions

| From | Action | By | To |
|------|--------|-----|-----|
| — | send | requester | pending |
| pending | accept | recipient | accepted |
| pending | decline | recipient | declined |
| pending | withdraw | requester | withdrawn |
| accepted | remove | either | deleted |
| declined / withdrawn | send again | requester | pending (reuse the record) |

Only the recipient may accept or decline. Only the requester may withdraw.
Enforce this in the controller, not the UI.

## Server work

`server/controllers/connectionController.js`,
`server/routes/connectionRoutes.js`, mounted at `/api/connections`.

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/connections` | send a request (`{ userId }`) |
| GET | `/api/connections` | accepted connections — "my buddies" |
| GET | `/api/connections/pending` | incoming requests awaiting my response |
| GET | `/api/connections/sent` | my outgoing pending requests |
| PATCH | `/api/connections/:id/accept` | recipient only |
| PATCH | `/api/connections/:id/decline` | recipient only |
| DELETE | `/api/connections/:id` | withdraw if pending, remove if accepted |

Also add a helper other phases will reuse:

```js
// server/utils/areConnected.js
async function areConnected(idA, idB) { … }   // true only for status 'accepted'
```

Extend the phase 01 discover response so each match carries the caller's
relationship to that person:

```json
"connection": { "status": "none" | "pending_out" | "pending_in" | "accepted", "id": "…" }
```

This lets the UI render the right button without a second request per card.

## Client work

- `Connect` button on Discover cards and the match detail page, with four
  states: Connect / Requested / Accept / Buddies.
- New page `/buddies` with three tabs: **Buddies**, **Requests** (incoming, with
  Accept and Decline), **Sent** (with Withdraw).
- Add "Buddies" to the navbar in
  [Navbar.jsx](../../client/src/components/layout/Navbar.jsx), with a count
  badge for pending incoming requests.
- Optimistic UI on Connect, rolled back with an `Alert` if the request fails.

## Tasks

- [x] `connectionModel.js` with the compound unique index and a self-connect guard
- [x] Bidirectional duplicate check in `utils/connections.js`
- [x] Controller with per-action authorisation checks
- [x] Eight routes behind `protect` (the seven planned, plus `/counts`)
- [x] `areConnected` helper, ready for phase 03 to gate messaging
- [x] Discover and match detail carry `connection` status, via one
      `statusMapFor` query rather than one per card
- [x] `ConnectButton` with all four states and optimistic rollback
- [x] `/buddies` page with Buddies / Requests / Sent tabs
- [x] Pending-request badge in the navbar, desktop and mobile
- [x] 10 end-to-end tests in `client/tests/e2e/connections.spec.js`
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] A can send B a request; B sees it under Requests; accepting puts each in
      the other's Buddies list.
- [x] A cannot send two requests to B, in either direction.
- [x] A cannot accept their own outgoing request (403), and neither can a
      third party.
- [x] Declining removes it from B's inbox; A can send again afterwards.
- [x] Removing an accepted connection removes it for both sides.
- [x] Discover shows the correct button state without extra requests per card.
- [x] Buddy lists never contain email addresses.

## Watch out for

- Authorisation must be checked server-side for every transition. "The UI does
  not show the button" is not access control.
- `declined` should not be silently re-sendable in a loop — consider a cooldown,
  or let phase 07's block feature cover the abuse case.
