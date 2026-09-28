# Koppa API (Phase 1)

Public-first cafe discovery + verified visits + XP + weekly leaderboard.

Stack: Node 20, Express, TypeScript, Prisma, PostgreSQL. Media URLs stored after Cloudinary upload (binaries never in Postgres).

## Run locally

```bash
cp .env.example .env
docker compose up -d

npm install
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Host `5432` is already another Postgres on this machine (`attendify` is `5433`, `jobscarp` is `5434`). Koppa Compose publishes **5435**. `DATABASE_URL` must use `localhost:5435`.

- API: `http://localhost:3000/api/v1`
- Health: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

Guest browse needs no token. Register/login only for visit, review, suggest, profile, preferences, recommendations.

Never send `verified`, `xp`, `distance`, or `rank` from the client. Backend computes all four.

## Cloudinary

Upload from the web app (or signed upload later). Persist `cloudinary_url` + `public_id` on:

- `POST /api/v1/admin/cafes/:id/media`
- `POST /api/v1/cafes/:id/visits` (`media` object)

## Tests

```bash
npm test
```

Geo + visit-radius tests run without Postgres. Full HTTP/XP tests need `DATABASE_URL`.

## Phase 1 out of scope

Vendor accounts, rewards, redemption, WebSockets, ML recommendations.
