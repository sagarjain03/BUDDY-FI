# BUDDY-FI

A friend-matching app: users sign up, answer a short personality quiz, and browse
other members. React + Vite front end, Express + MongoDB API.

**Building on this?** Start with [docs/README.md](docs/README.md) — the work is
broken into numbered phases, each with its own scope, schema, endpoints and
acceptance criteria. [docs/00-current-state.md](docs/00-current-state.md)
describes what already exists, and
[docs/01-conventions.md](docs/01-conventions.md) covers the design system and
code patterns to follow.

## Layout

| Path      | What it is                                    |
| --------- | --------------------------------------------- |
| `client/` | React 18 + Vite + Tailwind front end           |
| `server/` | Express API, Mongoose models, Socket.IO chat   |

## Setup

```bash
npm run install:all
```

Then create the env files from the examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in `server/.env`:

- `MONGO_URI` — your MongoDB connection string
- `MONGO_DB_NAME` — database name (set this; a URI without a database falls back
  to `test`, which on a shared cluster collides with other projects)
- `JWT_SECRET` — a long random string used to sign login tokens
- `CLIENT_ORIGIN` — comma-separated origins allowed to call the API

`server/.env` is gitignored and must never be committed.

## Running

```bash
npm run start:server   # API on http://localhost:5000
npm run start:client   # front end on http://localhost:5173
```

## API

All routes are under `/api/auth`. Everything except `register` and `login`
requires an `Authorization: Bearer <token>` header.

| Method | Route              | Auth | Purpose                             |
| ------ | ------------------ | ---- | ----------------------------------- |
| POST   | `/register`        | no   | Create an account, returns a token  |
| POST   | `/login`           | no   | Log in, returns a token             |
| GET    | `/me`              | yes  | The logged-in user's own profile    |
| POST   | `/submit-answers`  | yes  | Save quiz answers                   |
| GET    | `/show-users`      | yes  | Other users, without their emails   |
| POST   | `/update-location` | yes  | Save the user's coordinates         |

`GET /health` on the server root returns `{"status":"ok"}`.
