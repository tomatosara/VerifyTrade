# VerifyTrade Monorepo

VerifyTrade is a digital identity trading platform with a TypeScript backend that issues and verifies VC-backed trade forms plus a React + Vite front-end experience. This repository groups every service, developer doc, and Docker definition into a single pnpm workspace.

## Repository Layout

- `app/backend` – Express + TypeORM API with TSOA-generated OpenAPI docs, migrations, and seed scripts.
- `app/frontend` – React 19 + Vite client (Rolldown build) with Tailwind v4 and motion-driven UI.
- `docs/` – How-to guides such as `db-local-dev.md` and `seeding.md`, plus HTTP samples.
- `docker-compose.yml` / `docker-compose.db.yml` – Backend + Postgres stack for local use.

## Prerequisites

- Node.js 20+ with `corepack` (pnpm 10.20.0 is locked through `packageManager`).
- pnpm installed via `corepack enable`.
- Docker Desktop (optional but recommended for the Postgres service).
- PostgreSQL 16 instance if you are not using Docker Compose.

## Quick Start

1. Install dependencies once for the entire workspace:
   ```bash
   corepack enable
   pnpm install
   ```
2. Configure the backend environment:
   ```bash
   cp app/backend/.env.example app/backend/.env
   # adjust DB credentials, JWT secrets, and SHARE_URL_BASE as needed
   ```
3. Start PostgreSQL (choose one):
   - **Docker Compose:** `docker compose -f docker-compose.db.yml up -d`
   - **Host instance:** Follow `docs/db-local-dev.md` for the expected ports and credentials.
4. Run the backend API:
   ```bash
   pnpm --filter @verifytrade/backend dev:api
   ```
   Swagger UI is available at `http://localhost:3000/docs` and health checks at `/health`.
   ps. if database do not work well,  change `app/backend/src/database/data-source.ts` synchronize to true.
5. Run the React front-end:
   ```bash
   pnpm --filter frontend dev
   ```
   Vite serves on `http://localhost:5173` by default; proxy API calls to `localhost:3000`.

## Useful Commands

| Goal | Command |
| --- | --- |
| Generate & apply OpenAPI routes | `pnpm --filter @verifytrade/backend openapi` |
| Run backend tests (Jest + Testcontainers) | `pnpm --filter @verifytrade/backend test` |
| Apply migrations | `pnpm --filter @verifytrade/backend typeorm:migrate:run` |
| Seed dev data (idempotent) | `pnpm --filter @verifytrade/backend db:seed` |
| Reset DB (revert → migrate → seed) | `pnpm --filter @verifytrade/backend db:reset` |
| Lint backend / frontend | `pnpm --filter @verifytrade/backend lint`, `pnpm --filter frontend lint` |

## Docker Workflows

- Full stack (Node container + Postgres):
  ```bash
  docker compose up -d
  ```
  The backend container runs `pnpm --filter @verifytrade/backend dev:api` and watches the repo volume.
- Database only: `docker compose -f docker-compose.db.yml up -d`
- Shut down and remove volumes: `docker compose -f docker-compose.db.yml down -v`

Compose respects `HOST_DB_PORT` for forwarded ports and loads secrets from `app/backend/.env`.

## Documentation & Resources

- Backend deep dive: `app/backend/README.md` (+ `README.zh-TW.md`).
- Database setup: `docs/db-local-dev.md`
- Seeding guide: `docs/seeding.md`
- Sample HTTP calls: `docs/api-examples.http`
- GEMINI design notes: `app/backend/GEMINI.md`, `app/frontend/GEMINI.md`

Keep backend docs as the source of truth for environment variables, module layout, and security considerations. This root README focuses on wiring both apps together—refer to the service-specific files when you need implementation details.
