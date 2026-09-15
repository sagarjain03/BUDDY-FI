# Phase 06 — Proximity discovery — SHIPPED

**Size:** S (a day or two) · **Depends on:** 01, 05

> Delivered. Two things the plan did not anticipate:
> - **A single malformed location stops the 2dsphere index from building**, and
>   without that index every `$near` query errors. The migration now clears
>   unusable coordinates rather than skipping them, and reports loudly with a
>   non-zero exit if the index still cannot be built.
> - Distance is computed in Node (haversine, `utils/geo.js`) for display, while
>   `$near` does the *filtering* in the database. That keeps the index doing the
>   expensive work without fighting the in-memory compatibility scoring.
>
> The migration has been run against `buddyfi`: one document moved, index built.

## Goal

Use the coordinates you already collect. Filter and sort Discover by distance,
and show "12 km away" on each card.

## Why

[Location.jsx](../../client/src/pages/Location.jsx) saves latitude and longitude,
the landing page promises "friends nearby", and nothing reads the data. This is
the cheapest large win left — the collection already happens.

## Design

### Migrate to GeoJSON

The current shape cannot be indexed for geo queries:

```js
location: { longitude: Number, latitude: Number }
```

MongoDB needs GeoJSON with a `2dsphere` index:

```js
location: {
  type:        { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: undefined },  // [longitude, latitude]
  updatedAt:   Date,
},
```

```js
userSchema.index({ location: '2dsphere' });
```

**Coordinate order is `[longitude, latitude]`.** Reversing it is the classic
bug: your users end up in the wrong hemisphere and everything silently returns
nothing.

### Migration script

Write `server/scripts/migrate-location.js` as a one-off:

```js
// { longitude, latitude } -> { type: 'Point', coordinates: [longitude, latitude] }
```

Run it once against each environment, log how many documents changed, and make
it safe to re-run (skip documents already in the new shape).

### Query

```js
const matches = await User.find({
  _id: { $ne: req.user._id },
  location: {
    $near: {
      $geometry: req.user.location,
      $maxDistance: radiusKm * 1000,   // metres
    },
  },
});
```

`$near` returns results already sorted nearest-first. If you want compatibility
to remain the primary sort, use `$geoNear` in an aggregation with
`distanceField`, then sort by percentage in Node.

Users with no saved location must not disappear from Discover — fall back to the
unfiltered query when the caller has no location, and put location-less
candidates in a separate bucket rather than dropping them.

## Privacy

This is location data about real people. Rules:

- Never return raw coordinates for anyone but the caller.
- Return a rounded distance (`12 km`), not a position.
- Round distances under 2 km to "under 2 km" rather than "0.3 km" — precise
  short distances let someone triangulate a home address.
- Give users an off switch: a `shareLocation` boolean that removes them from
  proximity results and hides distance on their card.
- Show when the location was last updated, and let the user clear it.

## Endpoints

Extend phase 01's discover endpoint rather than adding a new one:

```
GET /api/discover?radius=50&sort=distance|match
```

Each match gains `distanceKm: number | null`.

Add:

| Method | Route | Purpose |
|--------|-------|---------|
| DELETE | `/api/auth/me/location` | clear the stored location |
| PATCH | `/api/auth/me` | already exists; add `shareLocation` to the allowlist |

## Client work

- Distance chip on Discover cards: "12 km away", or nothing when unknown.
- Radius slider in the Discover header: 5 / 25 / 50 / 100 km / Anywhere.
- Sort toggle: Best match / Nearest.
- On the Location page: show the last-updated time, a "Stop sharing" button, and
  a clear sentence about what is stored and who sees it.

## Tasks

- [x] GeoJSON schema with a `2dsphere` index
- [x] `updateLocation` writes the new shape through `toPoint()`
- [x] Idempotent migration script, run against `buddyfi` and verified twice
- [x] `radius` and `sort=match|distance|newest` on `/api/discover`
- [x] A banded `distance` on each match — never raw coordinates
- [x] `shareLocation` flag honoured in queries and in the distance helper
- [x] `DELETE /api/auth/me/location`
- [x] Distance chip, radius filter, Nearest sort
- [x] Location page: coordinates, last updated, sharing toggle, forget button,
      and a plain-words explanation of what other people can see
- [x] 11 geo unit tests and 12 end-to-end tests
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] Delhi to Mumbai reads ~1150 km, which is what it really is — the test
      asserts the range, so a swapped coordinate pair fails the build.
- [x] The radius filter excludes people outside it, and widening brings them
      back.
- [x] A caller with no location keeps seeing everyone; a radius without a
      position is ignored rather than emptying the list.
- [x] Turning off sharing removes the member from proximity results and hides
      their distance, while leaving them browsable.
- [x] No endpoint returns another member's coordinates — asserted against the
      raw response body, not just the parsed shape.
- [x] Anything under 2 km reports only "Under 2 km".
- [x] Re-running the migration changes nothing and still exits 0.

## Watch out for

- `$near` cannot be combined with certain aggregation stages. If you need both
  distance and a compatibility sort, use `$geoNear` — and it must be the first
  stage in the pipeline.
- The `2dsphere` index must exist before `$near` runs, or the query errors.
