# Movie Watchlist API

## Intro

This repo proposes improvements to [PedroTech](https://www.youtube.com/@PedroTechnologies)'s [Backend Complete Course | NodeJS, ExpressJS, JWT, PostgreSQL, Prisma](https://www.youtube.com/watch?v=g09PoiCob4Y). The video is a solid introduction to the topic, but some of its design choices and concepts can be done better. The course also stops at the backend, so I built a frontend on top of it to help other learners see how the whole flow fits together.

Live full-stack demo: <https://movie-watchlist-api-drab.vercel.app/>

> Note: this repo focuses on improving the designs covered by the course. Anything outside the course's scope, or not central to it, is kept intentionally light. Readers are welcome to fill in the rest.
>
> The original JavaScript version I wrote while following the course is kept in [`legacy-js/`](legacy-js/), so it can be compared file by file with `src/`.

## Tech Stack

### Language

- TypeScript (main code, `src/` and `web/`)
- JavaScript (course version, `legacy-js/`)

### Backend

- Node.js 24, Express 5
- Prisma (ORM)
- Zod (request / env validation, also generates the OpenAPI document)
- jsonwebtoken (JWT), bcrypt
- Vitest + Supertest (integration tests)

### Frontend

- React 19, Vite, Tailwind CSS
- TanStack Query, openapi-fetch (types generated from `openapi.json`)

### Database

- PostgreSQL

### Platform

- Neon (managed PostgreSQL)
- Vercel (API and frontend deployed as one project; the course deploys to a Hostinger VPS with PM2 + Nginx)
- GitHub Actions (CI: lint, typecheck, test, build)

## Getting Started

### Prerequisites

- Node.js 24 (see `.nvmrc`; `package.json` requires `>=22`)
- A PostgreSQL database. The easiest option, same as the course, is a free [Neon](https://neon.tech) project. Copy its connection string
- Docker (only needed for running the tests)

### 1. Install the backend

```bash
git clone <repo-url>
cd backend-practice
nvm use            # switch to Node 24, skip if you don't use nvm
npm install        # postinstall runs prisma generate
cp .env.example .env
```

Open `.env` and fill in at least these three values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (copy it from Neon's connect page) |
| `JWT_SECRET` | At least 32 characters. Checked at startup, the app refuses to start if it is shorter |
| `SEED_DEMO_PASSWORD` | Password for the demo account `demo@example.com`, at least 8 characters, used by `db:seed` |

To generate a random secret:

```bash
openssl rand -base64 48
```

The other variables (`ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `CORS_ORIGINS`, ...) work with their defaults.

### 2. Create the tables and demo data

```bash
npm run db:migrate   # apply prisma/migrations
npm run db:seed      # create the demo account and 15 movies (safe to re-run)
```

### 3. Start the API

```bash
npm run dev
```

- Health check: <http://localhost:8080/api/health>
- Swagger UI: <http://localhost:8080/api/docs> (you can log in and try every endpoint from the page)
- OpenAPI JSON: <http://localhost:8080/api/openapi.json>

### 4. Start the frontend (optional)

```bash
cd web
npm install
cp .env.example .env   # set VITE_DEMO_PASSWORD to the same value as SEED_DEMO_PASSWORD to show the "Log in as demo" button
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to `localhost:8080`, so the frontend and the API share one origin and cookies need no extra setup.

### 5. Run the tests

The tests hit a real PostgreSQL running in Docker (port 5433, data kept in memory). No database call is mocked.

```bash
npm run test:db      # start the test Postgres
npm test
npm run test:coverage
docker compose down  # stop the test database
```

## Improvements

### 1. JWT design

At [1:22:25](https://www.youtube.com/watch?v=g09PoiCob4Y&t=4945s) the course sets the JWT `expiresIn` to 7 days and puts the token in an HttpOnly cookie **and** in the response body. Logging out ([1:28:49](https://www.youtube.com/watch?v=g09PoiCob4Y&t=5329s)) only clears the browser cookie. The problems:

- With the token in the body, any script on the page can read it, so the HttpOnly flag protects nothing
- A single token valid for 7 days cannot be revoked. If it is stolen it works for a whole week, and logging out does not stop it
- The middleware ([1:58:36](https://www.youtube.com/watch?v=g09PoiCob4Y&t=7116s)) queries the DB on every request to confirm the user still exists. That gives up the main advantage of a JWT, verification without a DB lookup, and it only catches "account deleted", not a leaked token

What this repo does instead:

- Access token valid for 15 minutes, refresh token for 7 days. Both travel only in HttpOnly, `SameSite=Strict` cookies; the response body never contains a token
- A new `RefreshToken` table stores only SHA-256 hashes. Each refresh token is rotated on use. If an already-used token shows up again it is treated as leaked and the whole token family is revoked
- Logout revokes the refresh token on the server instead of only clearing the cookie
- Access token verification only checks the signature and expiry, no DB lookup. `GET /api/auth/me` fetches the user itself; every other route only needs the user id from the token. If an account is deleted there is at most a 15-minute window, after which refresh fails because the refresh tokens were cascade-deleted with the user
- `jwt.verify` pins `algorithms`, `issuer` and `audience`; `JWT_SECRET` length is validated with Zod at startup

### 2. Movie schema redesign

At [0:48:08](https://www.youtube.com/watch?v=g09PoiCob4Y&t=2888s) the course defines genre as `String[]`, cramming several values into one column, which violates 1NF. This repo splits it into `Genre` (unique name) and a `MovieGenre` junction table (many-to-many). Movies can now be filtered by genre through an index, the same genre cannot exist in several spellings, and `GET /api/genres` can list them.

### 3. Reading cookies: missing `cookie-parser`

At [1:55:37](https://www.youtube.com/watch?v=g09PoiCob4Y&t=6937s) the course's middleware falls back to `req.cookies.jwt` when there is no `Authorization` header, but `cookie-parser` is never installed anywhere in the video. `req.cookies` is therefore always `undefined`, and the cookie path never actually works.

This repo adds `cookie-parser` and keeps the same order as the course: check the `Authorization: Bearer` header first, then fall back to the cookie. Both paths really work. The browser frontend uses the HttpOnly cookie; when testing with Swagger UI or Postman you can take `access_token` from the login response's `Set-Cookie` header and send it as a Bearer token.

### 4. Read endpoints the course never built

The course's `movieRoutes` only contains a placeholder hello route ([1:37:15](https://www.youtube.com/watch?v=g09PoiCob4Y&t=5835s)), and the watchlist only has POST / DELETE / PUT with no way to list anything. This repo adds:

- `GET /api/movies`: pagination, `search`, `genre`, `year`, `sort`, `order`
- `GET /api/movies/:id`, `GET /api/genres`
- `GET /api/watchlist`: the current user's list, filterable by `status`
- `GET /api/watchlist/ids`: every `{ id, movieId, status }`, used by the frontend to tell whether a movie is already on the list

### 5. Engineering setup

- TypeScript strict mode, layered as `routes → controller → service → Prisma`. The course mixes business logic into the controllers
- OpenAPI document generated from the same Zod schemas used for validation, Swagger UI at `/api/docs`
- GitHub Actions CI, ESLint, Prettier

## Limitations

- **Signup is for demonstration only.** It validates the input format but there is no email verification, password reset, or similar flow
- **Tokens are only issued through cookies.** The API accepts `Authorization: Bearer`, but the login response body does not contain the token, so non-browser clients have to read it from `Set-Cookie` themselves. Serving a mobile app would need a separate way to hand out tokens
