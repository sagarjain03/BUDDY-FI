# Conventions

Read this before writing UI or adding an endpoint. The app already has a design
system and a set of patterns; following them is what keeps it looking like one
product instead of nine.

## Front end

### Never hand-roll a button, input or card

Use the shared primitives in [components/ui/](../client/src/components/ui/):

```jsx
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';

<Button to="/login" variant="outline" size="lg">Log in</Button>
<Input label="Email" type="email" error={fieldErrors.email} />
<Alert tone="error">{error}</Alert>
```

`Button` variants: `primary`, `secondary`, `outline`, `ghost`, `onDark`.
Sizes: `md` (default), `lg`. Passing `to` renders a router `Link`, `href`
renders an `<a>`, neither renders a `<button>`.

If you need a new variant, add it to `Button.jsx` and to the `.btn-*` classes in
[index.css](../client/src/index.css). Do not add one-off Tailwind strings at a
call site.

### Page layout

Signed-in pages use `AppShell` — it supplies the sticky navbar, the page header
and the footer:

```jsx
<AppShell title="Discover" subtitle="…" actions={<Button …/>} width="narrow">
  {children}
</AppShell>
```

Logged-out auth pages use `AuthLayout` (brand panel + form column).
Marketing pages use `MarketingNav` + `Footer` directly.

### Design tokens

Defined in [tailwind.config.js](../client/tailwind.config.js). Use them; do not
introduce raw hex values in components.

| Token | Use |
|-------|-----|
| `brand-500` / `brand-600` | primary actions, active states, accents |
| `ink-900` / `ink-950` | headings, dark surfaces |
| `ink-500` / `ink-400` | secondary and tertiary text |
| `ink-100` / `ink-50` | borders and page background |
| `accent-500` | success, "connected", positive status |
| `font-display` (Sora) | headings only |
| `font-sans` (Inter) | everything else |
| `shadow-soft` / `shadow-lift` / `shadow-glow` | cards / hover / primary button |

Component classes available from `index.css`: `.container-page`, `.section`,
`.btn` + variants, `.card`, `.card-interactive`, `.field-label`, `.field-input`,
`.field-error`, `.chip`, `.eyebrow`, `.skeleton`.

### Every async screen needs four states

Loading, error, empty, and content. Use `.skeleton` for loading, `Alert` for
error, `EmptyState` for empty. A screen that only renders the happy path is not
finished.

### Rules that already bit us once

- A **single-use request inside a `useEffect`** fires twice under React 18
  StrictMode. Guard it with a ref, or it will consume its own token — see
  `VerifyEmail.jsx`.
- Never hand `req.body` to an update. Use an explicit allowlist, as
  `profileController.js` does, or callers grant themselves fields you did not
  intend.
- Internal navigation uses router `Link` / `NavLink`, never `<a href="/x">` —
  an `<a>` does a full page reload and throws away app state.
- Import images (`import bg from '../assets/bg.png'`) — never
  `url('/src/assets/…')`. The `/src` path works in dev and 404s in production.
- Import paths are case-sensitive on Linux even though Windows forgives them.
  `'./SignUpForm'` and `'./signUpForm'` are different files on the deploy host.
- Coordinates are `[longitude, latitude]`, GeoJSON order. Read and write them
  through `utils/geo.js` rather than indexing the array by hand.
- Do not put `overflow: hidden` on `html` or `body`.
- Every page must work at 390px wide with no horizontal scroll.

## Back end

### File layout

Route → controller → model. Middleware in `middlewares/`, pure helpers in
`utils/`. A new feature normally means: one model, one controller, one route
file mounted in `app.js`.

### Response shape

Success:

```js
res.status(200).json({ status: 'success', data: { … } });
```

Failure:

```js
res.status(400).json({ status: 'error', message: 'Human readable' });
```

`apiFetch` on the client throws `new Error(message)` for any non-2xx, so the
`message` string is what the user sees. Write it accordingly.

Never leak `err.message` from an unexpected 500 — log it server-side, return a
generic message. `authController.js` already does this.

### Auth

```js
const { protect } = require('../middlewares/authMiddleware');
router.use(protect);          // everything below needs a valid token
```

`protect` puts the full Mongoose user document on `req.user`. Derive identity
from `req.user._id`, **never** from an id or email in the request body — that
was the original bug in `submit-answers` and `update-location`.

### Saving a document loaded by `protect`

`password` has `select: false`, so a document fetched by `protect` has no
password field and a plain `.save()` would fail required-field validation:

```js
await user.save({ validateModifiedOnly: true });
```

### Validation

Use `express-validator` in the route file, not hand-written `if` checks in the
controller:

```js
check('email', 'Please include a valid email').isEmail().normalizeEmail(),
```

Then `validationResult(req)` at the top of the controller.

## Git

- `node_modules/` and `.env` are gitignored. Keep it that way.
- Never commit a secret. If one lands in a commit, rotate it — deleting the file
  does not remove it from history.
- One phase per branch, one PR per phase.

## Definition of done for any phase

- [ ] `npm run lint:client` is clean
- [ ] `npm run build:client` succeeds
- [ ] `npm audit` reports 0 vulnerabilities in `client/` and `server/`
- [ ] Every new screen works at 1440px and 390px with no horizontal scroll
- [ ] Every new screen has loading, error and empty states
- [ ] No new console errors in the browser
- [ ] Every new list endpoint applies `blockedIdsFor` from `utils/blocks.js`
- [ ] [00-current-state.md](00-current-state.md) updated to match reality
