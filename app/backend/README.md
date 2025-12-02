# VerifyTrade Backend

TypeScript/Express API that powers VerifyTrade’s digital identity trading flows. Exposes REST endpoints for trade form creation, VC verification, confirmation, and status audit trails. This service lives in the monorepo as `@verifytrade/backend`.

Read this in [繁體中文](./README.zh-TW.md).

## Responsibilities

- REST API for managing trade forms and confirmations
- VC verification and metadata capture for both parties
- OpenAPI 3.1 spec generation via TSOA
- PostgreSQL persistence with migrations and seed utilities
- Health probes and rate limiting for production use

## Tech Stack

- Node.js 20+, TypeScript, pnpm workspaces
- Express 4, TSOA, OpenAPI 3.1
- TypeORM 0.3 with PostgreSQL 16
- class-validator/class-transformer, zod-based config parsing
- JWT auth (user + platform), Pino logging, express-rate-limit
- Jest + Supertest + Testcontainers for integration tests

## Folder Structure

```text
src/
  app.ts          # Express app wiring, middleware, Swagger
  server.ts       # Entrypoint, DB init/retry, migration auto-run
  config/         # Env bootstrap and config parsing
  database/       # TypeORM data source, migrations, seeds, CLI
  docs/           # Swagger UI helpers and OpenAPI tweaks
  http/           # TSOA routes/auth binding
  middleware/     # Error handler, logging, rate limit, idempotency
  modules/        # auth, tradeform, trade, issuer, verifier, vc
  routes/         # Health endpoints
  utils/          # Logger, errors, URL builder
openapi.json      # Generated spec (rebuild with pnpm openapi)
tsoa.json         # TSOA config
jest.config.js    # Test runner config
```

## Prerequisites

- Node.js 20+ with `corepack enable`
- pnpm 10.x
- Docker (required for Testcontainers and optional local Postgres)

## Setup

```bash
pnpm install                   # from repo root
cp app/backend/.env.example app/backend/.env
# update JWT secrets, DB creds, SHARE_URL_BASE, and any VC sandbox tokens
pnpm env:check                 # forwards to @verifytrade/backend env:check
```

The service loads envs from `.env` (or `.env.test` when `NODE_ENV=test`).

### Key Environment Variables (see `.env.example` for full list)

| Name | Purpose |
| --- | --- |
| `NODE_ENV`, `PORT`, `HOST`, `BASE_PATH`, `DEV_HTTPS`, `TRUST_PROXY` | Server runtime and proxy settings. |
| `JWT_SECRET`, `PLATFORM_JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` | JWT signing/validation. Production requires strong secrets. |
| `SWAGGER_PATH`, `API_BASE_URL`, `SWAGGER_TITLE`, `SWAGGER_VERSION` | OpenAPI/Swagger exposure. |
| `CSRF_ALLOWED_ORIGINS` | Comma-separated frontend origins allowed by CSRF Origin/Referer checks. |
| `DATABASE_URL` or `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` | PostgreSQL connectivity. |
| `COMPOSE_DB_HOST`, `COMPOSE_DB_PORT` | Defaults used when running with Docker Compose. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Rate limiting knobs. |
| `SHARE_URL_BASE`, `ALLOWED_META_KEYS`, `PERSIST_STRATEGY`, `UID_TTL_MINUTES`, `VC_MIN_CRITERIA` | Trade and VC policy behavior. |
| `VERIFIER_BASE`, `VERIFIER_TOKEN`, `ISSUER_BASE`, `ISSUER_TOKEN`, `VP_IDCARD`, `VP_TRADEFORM` | External VC sandbox integration; replace with your own credentials. |

Never commit real secrets. Rotate any sample values before production.

## Secret Management

- JWT secrets (`JWT_SECRET`, `PLATFORM_JWT_SECRET`, `JWT_REFRESH_SECRET`) and TLS key paths must come from environment variables or your secret manager; no keys are hardcoded in the codebase.
- Local HTTPS for dev reads cert/key files from `DEV_TLS_CERT_PATH` and `DEV_TLS_KEY_PATH`; keep those files in ignored locations such as `app/backend/certs/`.
- Test-only self-signed certificates live at `app/backend/src/test/fixtures/certs/*.pem` and are never used in production.
- `.env` files and key/cert material are intentionally git-ignored; provision real values per environment before starting the server.

## Run Locally

```bash
pnpm --filter @verifytrade/backend dev:compose:up   # optional: start Postgres helper
pnpm --filter @verifytrade/backend typeorm:migrate:run
pnpm --filter @verifytrade/backend db:seed          # sample data
pnpm --filter @verifytrade/backend dev              # tsx watch on http://localhost:3000
```

Stop the helper DB:
```bash
pnpm --filter @verifytrade/backend dev:compose:down
```

## Docker Compose

- Full stack from repo root: `docker compose up backend` (depends on `db`)
- Database only: `docker compose -f ../../docker-compose.db.yml up -d` (or run via `dev:compose:up`)
- Override forwarded DB port with `HOST_DB_PORT` if 5432 is occupied.

## Database Tasks

- Run migrations: `pnpm --filter @verifytrade/backend typeorm:migrate:run`
- Revert last migration: `pnpm --filter @verifytrade/backend typeorm:migrate:revert`
- Reset DB (revert → migrate → seed): `pnpm --filter @verifytrade/backend db:reset`
- Generate migration: `pnpm --filter @verifytrade/backend migration:generate --name=AddFeature`
- Seed data: `pnpm --filter @verifytrade/backend db:seed` (set `SEED_PROFILE` to switch profiles)

Migrations also run automatically on server startup (`src/server.ts`).

## API Docs & Health

- Swagger UI: `${API_BASE_URL}${SWAGGER_PATH}` (default `http://localhost:3000/docs`)
- Live spec: `GET /openapi.json`
- Regenerate routes/spec: `pnpm --filter @verifytrade/backend openapi`
- Health: `GET /healthz` (liveness), `GET /ready` (DB readiness)

## Authentication

- Access token: JWT (~15m) issued by `POST /api/v1/auth/login-by-verifier`; send as `Authorization: Bearer <token>` on protected routes.
- Refresh token: HttpOnly `refresh_token` cookie (~7d) scoped to `/api/v1/auth`, signed with `JWT_REFRESH_SECRET`; use `POST /api/v1/auth/refresh` to mint a new access token and keep the cookie fresh.
- CSRF pairing: `GET /api/v1/auth/csrf` issues a `csrf_token` cookie; echo it in `x-csrf-token` alongside the refresh cookie for unsafe requests (enforced by middleware).
- Protected APIs: trade/trades/auth `me`/`logout` require the bearer access token; login, verifier/issuer flows, health checks, docs, and CSRF issuance remain public.
- Roles: `role` claim (e.g., `user`, `platform`) is embedded in both tokens; `requirePlatformRole` enforces platform-only access when used.

## CSRF Protection

- Express middleware `csrfProtectionMiddleware` enforces a double-submit pair (`csrf_token` cookie + `X-CSRF-Token` header) on unsafe HTTP methods when a `refresh_token` session cookie is present.
- The middleware also validates `Origin`/`Referer` against `CSRF_ALLOWED_ORIGINS` (or the API host) and trusts proxy headers when `TRUST_PROXY` is configured.
- CSRF tokens are issued by `GET /api/v1/auth/csrf` and stored in a non-HttpOnly cookie with `SameSite` and `Secure` flags; refresh/access lifetimes remain short (access ~15m, refresh ~7d).
- XSS would bypass CSRF, so keep templates free of unsafe HTML and tighten CSP as needed.

## Testing & Quality

- Tests: `pnpm --filter @verifytrade/backend test` (Docker required for Testcontainers)
- Lint: `pnpm --filter @verifytrade/backend lint`
- Build: `pnpm --filter @verifytrade/backend build`
- Start compiled bundle: `pnpm --filter @verifytrade/backend start`

## Deploy Notes

1. `pnpm --filter @verifytrade/backend build`
2. Apply migrations (`typeorm:migrate:run`) or rely on startup auto-run.
3. Set production envs: strong JWT secrets, Postgres URL, `NODE_ENV=production`, `API_BASE_URL`, `SWAGGER_PATH`, `TRUST_PROXY`.
4. Tune `DB_INIT_*` retry knobs if your database takes longer to accept connections.

## Troubleshooting

- Cannot reach Postgres: ensure container is healthy (`dev:compose:up`) or credentials match `DATABASE_URL`.
- Missing `JWT_SECRET`: required in production; set a strong value.
- Swagger blocked behind HTTPS proxy: set `DEV_HTTPS=true` locally and configure `TRUST_PROXY` for forwarded headers.
- Rate limit or idempotency conflicts: adjust `RATE_LIMIT_*` or ensure unique `Idempotency-Key` per request.
