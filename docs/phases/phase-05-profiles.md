# Phase 05 — Richer profiles — SHIPPED

**Size:** M (about a week) · **Depends on:** phase 00 · **Blocks:** 10

> Delivered. Notes:
> - **No image host needed to develop.** `IMAGE_STORE=local` writes to
>   `server/uploads` and serves it at `/uploads`. Set the three Cloudinary
>   variables and it switches automatically.
> - The **file signature** decides the type, not the MIME the client claims. A
>   PDF renamed `.jpg` is refused.
> - Removing a photo uses `$unset`. Assigning `undefined` to a nested path
>   leaves `{}` behind, which reads as "has a photo" everywhere downstream.
>
> **Known limitation:** the local store does not resize. Cloudinary applies a
> 512×512 face-crop, so production images are small; local dev serves whatever
> was uploaded, up to 5 MB. Fine for development, worth knowing before you
> demo a grid on a slow connection.

## Goal

Profile photos, a short bio, free-text interests, and a gender field that does
not exclude people. Make the profile editable.

## Why

Seven multiple-choice answers is thin. People need something to open a
conversation with, and most will not connect with an initials circle. The
profile page is also read-only today — there is no way to fix a typo in your own
name.

## Design

### Model changes

```js
avatar: {
  url:      String,
  publicId: String,   // provider handle, needed to delete the old one
},
bio:       { type: String, maxlength: 240, trim: true },
interests: [{ type: String, trim: true, maxlength: 30 }],   // cap the array at 8
gender: {
  type: String,
  enum: ['female', 'male', 'non-binary', 'other', 'prefer-not-to-say'],
  required: true,
},
```

The `gender` enum is currently `['male', 'female']`. Widening an enum is safe —
existing documents stay valid. Do it now; it is a one-line change today and a
data migration later.

### Image upload

Use `multer` with `memoryStorage` and stream straight to Cloudinary. Do not
write uploads to the server's disk — it does not survive a redeploy on most
hosts.

Limits, enforced server-side:

- max 5 MB
- `image/jpeg`, `image/png`, `image/webp` only
- verify the actual file signature, not just the client-supplied MIME type
- resize to 512×512 on upload (Cloudinary transform) so you are not serving
  4 MB originals in a grid

Delete the previous image by `publicId` after a successful replacement.

New env vars:

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Moderation

Photo upload on a social app needs a plan for abuse. Minimum viable version:

- A report button on every profile (phase 07 builds the reporting pipeline).
- An `avatar.status` field (`pending` / `approved` / `removed`) if you want
  review before display. If that is too much process for now, at least make
  removing an image a one-click admin action.

Do not ship uploads with no removal path.

## Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| PATCH | `/api/auth/me` | update `name`, `bio`, `interests`, `gender`, `age` |
| POST | `/api/auth/me/avatar` | multipart upload, returns the new URL |
| DELETE | `/api/auth/me/avatar` | revert to the initials avatar |

`PATCH /api/auth/me` must ignore `email`, `password`, `isVerified` and anything
else not in an explicit allowlist. Do not pass `req.body` to `findByIdAndUpdate`
directly — that is how a user grants themselves fields you did not intend.

```js
const ALLOWED = ['name', 'bio', 'interests', 'gender', 'age'];
const updates = Object.fromEntries(
  Object.entries(req.body).filter(([key]) => ALLOWED.includes(key))
);
```

Include `avatar`, `bio` and `interests` in the fields returned by Discover and
by the connections list.

## Client work

- Extend [Avatar.jsx](../../client/src/components/ui/Avatar.jsx) to render
  `avatar.url` when present and fall back to the existing initials circle. The
  fallback stays — it is what new users see, and it must look deliberate.
- `/profile/edit` page: name, age, gender select, bio with a character counter,
  interest chips with add/remove, avatar upload with local preview.
- Upload progress state and a clear error when the file is too large or the
  wrong type.
- Show bio and interests on Discover cards and on the match detail page.
- Gender select uses the five options; render the stored value as a readable
  label, not the raw slug.

## Tasks

- [x] `gender` widened to five options; signup uses a select
- [x] `avatar`, `bio` (240 chars) and `interests` (max 8) on the model
- [x] `server/utils/imageStore.js` with local and Cloudinary backends
- [x] `multer` memory storage, 5 MB cap, magic-byte type check
- [x] Three endpoints, with a strict allowlist on PATCH
- [x] The replaced image is deleted, only after the new one is recorded
- [x] `Avatar` renders a photo when there is one, initials otherwise
- [x] `/profile/edit` page with photo, bio counter and interest chips
- [x] Bio, interests and photos on Discover, Buddies, match detail and Chat
- [x] `genderLabel` renders slugs as readable text everywhere
- [x] 10 end-to-end tests in `client/tests/e2e/profile.spec.js`
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] A user can upload a photo and see it immediately across the app.
- [x] Replacing a photo removes the old file — the old URL 404s afterwards.
- [x] An oversized file and a `.pdf` renamed to `.jpg` are both rejected with a
      clear message.
- [x] `PATCH /api/auth/me` with `isVerified`, `role`, `email`, `password` or
      `_id` in the body changes none of them, and the old password still works.
- [x] Bio over 240 characters is rejected server-side; 20 interests are capped
      to 8 rather than erroring.
- [x] All five gender options register and render as readable labels; anything
      else is refused.
- [x] Removing a photo leaves no empty object behind.

## Watch out for

- The signup form currently renders gender as two radio buttons. Five options
  need a select or a wrapping chip group, or the mobile layout will break.
- `Avatar` is used at five sizes. Test the photo path at `sm` and `xl`.
