# VerifyTrade Monorepo

Digital identity trading platform that issues and verifies VC-backed trade forms. The monorepo contains a TypeScript/Express API and a React + Vite client, all managed via pnpm workspaces.

## Monorepo Layout

- `app/backend` — REST API (Express + TypeORM + TSOA), migrations, seeds, OpenAPI spec.
- `app/frontend` — React 19 + Vite (Rolldown build) with Tailwind v4 and motion-first UI.
- `docs/` — How-to guides and HTTP request examples.
- `docker-compose.yml` / `docker-compose.db.yml` — Local containers for API + Postgres.
- `dev.sh` — Convenience script to start frontend and backend together.

## Tech Stack

- Node.js 20+, TypeScript, pnpm workspaces
- Express, TypeORM, TSOA/OpenAPI, Jest + Testcontainers
- React 19, Vite (Rolldown), Tailwind CSS v4, motion/animation libraries
- Docker Compose for local Postgres and API

## Prerequisites

- Node.js 20+ with Corepack enabled (`corepack enable`)
- pnpm 10.x (bootstrapped by Corepack)
- Docker (optional, recommended for local Postgres)

## Setup

```bash
corepack enable
pnpm install
cp app/backend/.env.example app/backend/.env  # update secrets, DB settings, URLs
```

- Backend envs live in `app/backend/.env` (see that README for full details).
- Frontend can point to the API via `VITE_API_BASE_URL` (defaults to `http://localhost:3000/api/v1`).

## Run Locally

Backend (with optional Postgres helper):
```bash
pnpm --filter @verifytrade/backend dev:compose:up   # start Postgres via docker-compose.db.yml (optional)
pnpm --filter @verifytrade/backend typeorm:migrate:run
pnpm --filter @verifytrade/backend db:seed          # sample data
pnpm --filter @verifytrade/backend dev              # start API on :3000
```

Frontend:
```bash
pnpm --filter frontend dev   # serves on http://localhost:5173
```

Stop the helper DB container when done:
```bash
pnpm --filter @verifytrade/backend dev:compose:down
```

## Docker Compose

- Full stack: `docker compose up -d` (runs backend + Postgres; loads env from `app/backend/.env`).
- Database only: `docker compose -f docker-compose.db.yml up -d`
- Change forwarded DB port with `HOST_DB_PORT` if 5432 is busy.

## Common Scripts

- OpenAPI (generate spec + routes): `pnpm --filter @verifytrade/backend openapi`
- Migrations: `pnpm --filter @verifytrade/backend typeorm:migrate:run`
- Seed database: `pnpm --filter @verifytrade/backend db:seed`
- Reset DB (revert → migrate → seed): `pnpm --filter @verifytrade/backend db:reset`
- Tests (backend): `pnpm --filter @verifytrade/backend test`
- Lint: `pnpm --filter @verifytrade/backend lint` / `pnpm --filter frontend lint`

## Testing & Quality

- Backend: Jest + Supertest (`pnpm --filter @verifytrade/backend test`; Docker required for Testcontainers).
- Linting: ESLint configurations per app.

## Documentation

- Backend: `app/backend/README.md` (full API/dev/deploy details; also `README.zh-TW.md`)
- Frontend: `app/frontend/README.md`
- DB setup: `docs/db-local-dev.md`
- Sample HTTP calls: `docs/api-examples.http`

Refer to the backend README for environment variables, security requirements, and API behavior. This root file stays focused on wiring the monorepo and local workflows.
