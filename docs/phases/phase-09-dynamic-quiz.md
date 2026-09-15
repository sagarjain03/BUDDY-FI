# Phase 09 — Dynamic quiz — SHIPPED

**Size:** S (a day or two) · **Depends on:** 01

> Delivered, and the migration has been run against `buddyfi` (65 members) and
> `buddyfi_test`.
>
> `hobbies` is **still on the model on purpose.** The matcher reads `answers`
> when present and falls back to the legacy positional map otherwise, so nobody
> is unscoreable mid-rollout. Drop the field in a follow-up once the new answers
> have been watched in the wild — there is a unit test asserting the fallback,
> which should be deleted at the same time.

## Goal

Move the quiz out of the React bundle and into the database, and store answers
against real question ids instead of positional `hobby1`…`hobby7` keys.

## Why

Today the questions, the option labels and the option images all live in
[QuestionPage.jsx](../../client/src/components/Questionpage/QuestionPage.jsx),
and answers are saved as `hobby1`…`hobby7` where the number is just the array
index. Consequences:

- Adding or reordering a question silently corrupts every existing answer.
- The label→image map is a second source of truth that can drift from the
  options list. It already had: the music question offered `'Jazz'` while the
  image map keyed it as `'Classical Music'`, so that option rendered with no
  artwork.
- Shipping a new question needs a front-end deploy.
- The phase 01 matcher has to know the positional convention too.

This is small, and doing it before the quiz grows is much cheaper than after.

## Design

### Models

`server/models/questionModel.js`:

```js
{
  key:      { type: String, required: true, unique: true },   // 'movie-genre'
  prompt:   { type: String, required: true },
  helpText: String,
  order:    { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  options: [{
    value:    { type: String, required: true },   // 'jazz'
    label:    { type: String, required: true },   // 'Jazz'
    imageUrl: String,
    group:    String,                             // affinity group, see phase 01
  }],
}
```

Answers move onto the user:

```js
answers: [{
  question:  { type: ObjectId, ref: 'Question', required: true },
  value:     { type: String, required: true },    // matches an option's `value`
  answeredAt: Date,
}],
```

Keeping the affinity `group` on the option means phase 01's
`server/config/affinity.js` can be deleted — the grouping lives with the data it
describes.

### Images

The option artwork currently lives in `client/src/assets/` and is imported. Move
those files to the same image host used for avatars in phase 05, and store the
URL on the option. That is what makes adding a question a data change rather
than a deploy.

### Migration

`server/scripts/migrate-quiz.js`, idempotent:

1. Insert the seven current questions with their options, in the current order,
   with `key` values you choose.
2. For every user with a `hobbies` map, read `hobby1`…`hobby7` in order, resolve
   each label to a question and option `value`, and write the `answers` array.
3. Log how many users were migrated and how many labels failed to resolve.
   Investigate any failures before deleting anything.
4. Leave `hobbies` in place for one release, then drop it in a follow-up.

Do not delete `hobbies` in the same PR that adds `answers`. If the migration has
a bug you want the original data still there.

## Endpoints

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/questions` | yes | active questions, ordered, with options |
| POST | `/api/auth/answers` | yes | `{ answers: [{ questionId, value }] }` |
| GET | `/api/auth/answers` | yes | the caller's answers, populated |

`POST /api/auth/answers` replaces `POST /api/auth/submit-answers`. Validate that
each `questionId` exists and that each `value` is one of that question's options
— otherwise a user can store arbitrary strings and skew matching.

Accept partial submissions so users can answer newly added questions later
without redoing the whole quiz.

## Client work

- `QuestionPage.jsx` fetches `/api/questions` instead of holding a constant.
  Loading skeleton while it fetches; `Alert` if it fails.
- Progress, step dots and the Finish button already derive from
  `questions.length`, so they keep working with any number of questions.
- Profile's `TRAIT_META` array in
  [UserProfile.jsx](../../client/src/pages/UserProfile.jsx) is another
  positional list — replace it with the populated question prompts.
- Discover card labels (`HOBBY_LABELS` in
  [ShowUsers.jsx](../../client/src/pages/ShowUsers.jsx)) likewise.
- "Answer new questions" prompt on the profile when active questions exist that
  the user has not answered.

## Tasks

- [x] `questionModel.js`, `answers` array on the user model
- [x] Seed and migration in one idempotent script, with a report of anything
      it could not resolve and a non-zero exit when that happens
- [x] Three endpoints, with option-value validation
- [x] `QuestionPage` fetches questions, pre-fills existing answers, and has
      loading and error states
- [x] `TRAIT_META` and `HOBBY_LABELS` replaced by the real question labels
- [x] Matcher reads `answers` and the option `group`, with a legacy fallback
- [x] Questions cached in process for a minute; `QUESTION_CACHE_MS` shortens it
      for tests
- [x] The test suite seeds the quiz itself, so a fresh database works
- [x] 5 end-to-end tests, including one that adds a question straight to the
      database and finds it in the quiz
- [ ] Option images still come from the bundle for the original seven
      (`lib/quizImages.js`); new questions should set `imageUrl`
- [ ] Follow-up: drop `hobbies` from the model
- [x] Update [00-current-state.md](../00-current-state.md)

## Done when

- [x] Adding an eighth question in the database makes it appear in the quiz with
      no front-end deploy — asserted by a test that does exactly that.
- [x] Every existing member's answers survived the migration: 65 of 65 on the
      real database, nothing unresolved.
- [x] Re-running the migration changes nothing.
- [x] An answer whose value is not an option on that question is rejected, and
      so is an unknown question id.
- [x] Matching produces the same scores for legacy and migrated members — there
      is a unit test comparing the two paths directly.
- [x] A partial submission adds to previous answers rather than replacing them.

## Watch out for

- Verify matching results before and after on the same two accounts. A silent
  change in scores means the migration mapped something wrong.
- Reordering questions must now be an `order` change only — never renumber keys.
