# VerifyTrade Backend

[![Node.js >=20](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933)](https://nodejs.org/)
[![pnpm workspace](https://img.shields.io/badge/pnpm-10.x-F69220)](https://pnpm.io/)

> Digital identity trading API built with TypeScript, Express, TypeORM, and TSOA.

Read this in [繁體中文](./README.zh-TW.md).

## Overview

The VerifyTrade backend powers the trading and verification flows behind the platform. It exposes RESTful APIs for managing trade forms, verifies verifiable-credential (VC) claims, enforces rate limits and idempotency, and serves an OpenAPI 3.1 specification for client integrations. The service is built with TypeScript on Express, TypeORM for PostgreSQL, and TSOA for schema-driven routing.

## Tech Stack

- Node.js 20+, pnpm workspaces, TSX watch mode
- Express 4 with TSOA-generated controllers and OpenAPI 3.1 spec
- TypeORM 0.3 targeting PostgreSQL 16, with migrations and seed utilities
- Validation via class-validator/class-transformer and zod-based config parsing
- Authentication with JSON Web Tokens (jsonwebtoken) and optional platform secret
- Pino structured logging with request IDs, rate limiting, and idempotency middleware
- Testing with Jest, Supertest, and Testcontainers for ephemeral Postgres
- Tooling: ESLint, dotenv/dotenv-expand, ts-node-compatible CLI scripts

## Project Structure

```text
src/
  app.ts                    # Express app wiring, middleware, Swagger registration
  server.ts                 # Process entrypoint, DB init with retries, startup banner
  config/                   # Environment-driven configuration modules
  database/
    data-source.ts          # TypeORM DataSource factory
    migrations/             # Versioned schema migrations
    seed/                   # Seed runner and helpers (clearing tables, sample data)
  docs/                     # OpenAPI customization and Swagger UI helpers
  http/                     # TSOA authentication adapter and generated routes
  middleware/               # Error, logging, rate limit, idempotency, request ID middleware
  modules/
    auth/                   # JWT helpers, dev-token controller, user entity
    tradeform/              # Trade form entities, DTOs, service, controller, repository
    vc/                     # VC policy evaluation helper
  routes/health.ts          # Liveness and database health endpoints
  utils/                    # Error hierarchy, logger, URL builder
openapi.json                # Generated OpenAPI document (kept in sync via pnpm openapi)
tsoa.json                   # TSOA configuration (controllers, base path, routes directory)
jest.config.ts              # Test runner configuration
```

## Environment Variables

The service loads environment variables from `.env` (or `.env.test` when `NODE_ENV=test`) via `src/config/env.bootstrap.ts`. Copy `app/backend/.env` as a template and update values before deploying.

### Core application & security

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Controls Express mode and feature gates (dev token endpoint is disabled in production). |
| `PORT` | No | `3000` | HTTP port for the API server. |
| `HOST` | No | `0.0.0.0` | Bind address; set to `127.0.0.1` to restrict to localhost. |
| `BASE_PATH` | No | `/` | Optional prefix appended in front of `/api/v1` routes when reverse-proxying. |
| `DEV_HTTPS` | No | `false` | When `true`, generated public URLs in the startup banner use `https://`. |
| `TRUST_PROXY` | Conditional | `0` | Accepts `true`, `false`, a number, or IP string to configure Express `trust proxy`. |
| `JWT_SECRET` | Yes (prod) | `dev-only-insecure-secret-change-me` | Symmetric signing key for user JWTs; the server aborts in production if missing. |
| `PLATFORM_JWT_SECRET` | No | inherits `JWT_SECRET` | Optional second signing key used to validate platform-issued tokens. |
| `JWT_ISSUER` | No | — | Optional issuer claim required during token verification. |
| `JWT_AUDIENCE` | No | — | Optional audience claim required during token verification. |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Window (ms) for `express-rate-limit` applied to sensitive endpoints. |
| `RATE_LIMIT_MAX` | No | `20` | Maximum number of requests per window per actor/IP. |
| `ALLOWED_META_KEYS` | No | `chain_tx_hash,vc_user2` | Comma-separated list of metadata keys preserved on trade records. |
| `SHARE_URL_BASE` | No | `https://app.example.com/join` | Used when composing external share URLs sent to participants. |

### Documentation

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `SWAGGER_PATH` | No | `/docs` | Mount path for Swagger UI (also controls the CSP override in dev). |
| `API_BASE_URL` | No | `http://localhost:3000` | Absolute URL injected into `servers` inside the OpenAPI document. |
| `SWAGGER_TITLE` | No | `Trading Platform API` | UI title for Swagger. |
| `SWAGGER_VERSION` | No | `1.0.0` | Displayed API version in Swagger. |

### Database connectivity

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | No | derived from discrete fields | PostgreSQL connection URL (overrides host/user/password settings when present). |
| `DB_HOST` | No | `localhost` | Database host name. |
| `DB_PORT` | No | `5432` | Database port. |
| `DB_USER` | No | `app` | Database user. |
| `DB_PASSWORD` | No | `app` | Database password. |
| `DB_NAME` | No | `app_db` | Database name. |
| `COMPOSE_DB_HOST` | No | `db` | Host used automatically when running against the bundled Docker Compose file. |
| `COMPOSE_DB_PORT` | No | `5432` | Port used automatically with Docker Compose. |
| `DB_SCHEMA` | No | `public` | Schema TypeORM targets when generating and running migrations. |
| `DB_SEARCH_PATH` | No | matches `DB_SCHEMA` | Optional Postgres search path override. |

### Feature flags & VC policy

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PERSIST_STRATEGY` | No | `db` | Value recorded in audit logs after finalize (`db`, `chain`, or `db+chain`). |
| `UID_TTL_MINUTES` | No | `60` | How long a trade UID remains valid before VC verification is rejected. |
| `VC_MIN_CRITERIA` | No | `{}` | JSON string describing required VC claims; see `src/modules/vc/validateVC.ts`. |
| `CHAIN_RPC_URL` | No | — | Optional RPC endpoint for future on-chain persistence. |
| `CHAIN_WALLET_KEY` | Sensitive | — | Optional signing key for chain strategies (store securely). |
| `LOG_LEVEL` | No | `info` | Pino logger level (`info`, `debug`, `error`). |
| `REQUIRE_VC_FOR_CREATOR` | No | `false` | Reserved flag to force creators through VC verification. |

### Operational tuning

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DB_INIT_MAX_ATTEMPTS` | No | `10` | Number of connection retries before startup fails. |
| `DB_INIT_RETRY_DELAY_MS` | No | `3000` | Base delay (ms) multiplied by retry attempt when waiting for Postgres. |
| `DOTENV_CONFIG_PATH` | No | `.env` | Path override for the dotenv loader. |
| `SEED_PROFILE` | No | `dev` | Optional profile hint for seed scripts (currently informational). |

> **Security reminder:** Never reuse the sample secrets in production. Generate strong random values for `JWT_SECRET`, `PLATFORM_JWT_SECRET`, and database credentials.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0 with Corepack enabled (`corepack enable`)
- pnpm 10.x (automatically bootstrapped by Corepack)
- Docker (for local Postgres or when running Jest Testcontainers)

### Install dependencies

From the monorepo root:

```bash
pnpm install
```

### Configure environment

1. Copy `app/backend/.env` to a local variant (e.g. `.env.local`) and adjust secrets.
2. Ensure `JWT_SECRET`, database credentials, and any custom URLs are set.
3. Validate that the service can read your configuration:

```bash
pnpm env:check
# → forwards to pnpm --filter @verifytrade/backend env:check
```

### Local development (without Docker Compose)

```bash
pnpm --filter @verifytrade/backend dev:compose:up   # optional: start Postgres via docker-compose.db.yml
pnpm --filter @verifytrade/backend typeorm:migrate:run
pnpm --filter @verifytrade/backend db:seed          # inserts sample users and trade forms
pnpm --filter @verifytrade/backend dev              # watch mode (tsx) with auto-reload
```

The server listens on `http://localhost:3000` by default and logs the resolved Swagger URL on startup.

To stop the helper database container:

```bash
pnpm --filter @verifytrade/backend dev:compose:down
```

### Docker Compose

A convenience `docker-compose.yml` runs both Postgres and the backend inside containers:

```bash
docker compose up db          # optional: keep DB running in the background
docker compose up backend
```

The backend container mounts the repo, installs dependencies with pnpm, and executes `pnpm --filter @verifytrade/backend dev:api`. Modify `docker-compose.yml` if you need to pass additional environment variables.

### Database migrations & seeds

- Run pending migrations: `pnpm --filter @verifytrade/backend typeorm:migrate:run`
- Revert last migration: `pnpm --filter @verifytrade/backend typeorm:migrate:revert`
- Revert everything, rerun, and reseed: `pnpm --filter @verifytrade/backend db:reset`
- Generate a new migration: `pnpm --filter @verifytrade/backend migration:generate --name=AddSomeFeature`
- Seed data (dev defaults): `pnpm --filter @verifytrade/backend db:seed`
- Seed with a custom profile (uses `SEED_PROFILE`): `SEED_PROFILE=test pnpm --filter @verifytrade/backend db:seed`

The `src/server.ts` entrypoint also runs migrations automatically on boot, making cold starts tolerant while still supporting explicit CLI usage in CI/CD.

## API Documentation

- OpenAPI spec: `openapi.json` (generated by TSOA)
- Regenerate routes + spec: `pnpm --filter @verifytrade/backend openapi`
- Print the live spec via running server: `pnpm --filter @verifytrade/backend openapi:print`
- Swagger UI: available at `${API_BASE_URL}${SWAGGER_PATH}` (default `http://localhost:3000/docs`)
- Raw spec endpoint: `GET /openapi.json` (servers list is resolved per request)

Swagger UI is served with strict CSP in production and a relaxed policy in local development to avoid Safari upgrade-insecure-request issues.

## Health Checks

The backend exposes unauthenticated probes for orchestrators and on-call diagnostics. All checks complete within a few milliseconds when healthy, skip heavy allocations, and run under a 400 ms timeout so they never block the event loop.

### `GET /healthz` (alias: `/health`)

- Confirms the process is running and the event loop is responsive.
- Returns `{ "status": "ok", "uptimeSec": <number>, "version": "<package version>" }` without touching the database or other dependencies.
- Bypasses authentication, CORS restrictions, and rate limiting.

```bash
curl -i http://localhost:${PORT:-3000}/healthz
```

Typical `200 OK` response:

```json
{
  "status": "ok",
  "uptimeSec": 12.34,
  "version": "0.1.0"
}
```

### `GET /ready`

- Ensures this instance can serve traffic by issuing `SELECT 1` through TypeORM with a 400 ms PostgreSQL statement timeout (future dependencies will appear under `checks`).
- Returns `200 OK` when every check passes and `503 Service Unavailable` with details when any check fails.
- Automatically flips to `503` when the service begins shutdown and closes the shared TypeORM data source.

```bash
curl -i http://localhost:${PORT:-3000}/ready
http --timeout=2 GET :${PORT:-3000}/ready
```

Healthy response:

```json
{
  "status": "ok",
  "checks": {
    "db": { "ok": true }
  }
}
```

Degraded response (example):

```json
{
  "status": "degraded",
  "checks": {
    "db": { "ok": false, "reason": "timeout" }
  }
}
```

### Deployment probes

Docker Compose (`docker-compose.yml`):

```yaml
healthcheck:
  test: ["CMD", "curl", "-fsS", "http://localhost:3000/healthz"]
  interval: 10s
  timeout: 2s
  retries: 3
```

Kubernetes:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Troubleshooting readiness failures

- Confirm the PostgreSQL instance is reachable, credentials are correct, and migrations have been applied.
- Check for log entries such as `readiness check failed` (includes `requestId`) to identify the dependency that timed out.
- Make sure the service can reach required networks (VPN, VPC, security groups) and that connection limits are not exceeded.
- Retry locally with `curl -v` or `http --timeout=2` against `/ready` to confirm the failure reproduces outside of the load balancer.

## Authentication

All business APIs require `Authorization: Bearer <JWT>` headers.

For local development, request a short-lived JWT via the dev token endpoint (disabled when `NODE_ENV=production`):

```bash
curl -X POST http://localhost:3000/api/v1/auth/dev-token \
  -H 'Content-Type: application/json' \
  -d '{
        "userId": "8c0cf2f6-4050-4c6d-9a53-1b38eb8f2e28",
        "role": "user",
        "email": "amy.chen@example.com",
        "name": "Amy Chen"
      }'
```

```bash
http POST :3000/api/v1/auth/dev-token \
  userId=8c0cf2f6-4050-4c6d-9a53-1b38eb8f2e28 \
  role=user \
  email=amy.chen@example.com \
  name='Amy Chen'
```

Store the returned `token` and pass it in subsequent requests:

```bash
export VERIFYTRADE_TOKEN="<JWT from dev-token>"
curl http://localhost:3000/api/v1/tradeforms/uid/demo-trade-uid \
  -H "Authorization: Bearer ${VERIFYTRADE_TOKEN}"
```

Platform services may authenticate with platform-signed JWTs when `PLATFORM_JWT_SECRET` differs from `JWT_SECRET`.

## API Reference

### TradeForm endpoints

| Method | Path | Summary | Auth | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/tradeforms` | Create a trade form | Bearer | Body must satisfy `CreateTradeFormDto`; returns 201 with full record. |
| `GET` | `/api/v1/tradeforms/{uid}` | Retrieve by share UID | Bearer | Participants receive the full payload, others see the limited view. Alias of `/api/v1/tradeforms/uid/{uid}`. |
| `PUT` | `/api/v1/tradeforms/{uid}` | Assign counterparty | Bearer | Path uses the public trade UID; body requires an existing user `counterpartyId` and sets status to `confirmed`. |
| `DELETE` | `/api/v1/tradeforms/{id}` | Delete a trade form | Bearer | Responds with `204 No Content`. |
| `POST` | `/api/v1/tradeforms/{uid}/confirm` | Confirm participation | Bearer | Requires authenticated participant; finalizes trade once both sides confirm. |

Sample create request:

```bash
curl -X POST http://localhost:3000/api/v1/tradeforms \
  -H "Authorization: Bearer ${VERIFYTRADE_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
        "creatorVerifiedIdentities": ["StudentID", "CompanyEmail"],
        "itemName": "iPad Pro 11\"",
        "itemDescription": "盒裝完整，含原廠鍵盤",
        "itemCondition": "LIKE_NEW",
        "amount": "22000",
        "tradeChannel": "IN_PERSON",
        "paymentMethod": "BANK_TRANSFER",
        "matchmakingChannel": "SOCIAL_PLATFORM",
        "identityRequirements": ["STUDENT_ID", "PROOF_OF_ORIGIN"],
        "userRating": 5
      }'
```

```bash
http POST :3000/api/v1/tradeforms \
  Authorization:"Bearer ${VERIFYTRADE_TOKEN}" \
  creatorVerifiedIdentities:='["StudentID","CompanyEmail"]' \
  itemName='"iPad Pro 11\""' \
  itemDescription='盒裝完整，含原廠鍵盤' \
  itemCondition=LIKE_NEW \
  amount=22000 \
  tradeChannel=IN_PERSON \
  paymentMethod=BANK_TRANSFER \
  matchmakingChannel=SOCIAL_PLATFORM \
  identityRequirements:='["STUDENT_ID","PROOF_OF_ORIGIN"]' \
  userRating:=5
```

### Authentication endpoints

| Method | Path | Summary | Auth | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/dev-token` | Issue a local development JWT | Public (disabled in prod) | Body must contain a UUID `userId`; optional `role`, `email`, `name`. Responds with `{ token, expiresIn, role }`. |

### Health endpoints

| Method | Path | Summary | Auth | Notes |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | Basic liveness probe | None | Returns `{ "status": "ok" }`. |
| `GET` | `/health/db` | Database readiness probe | None | Checks the TypeORM connection; returns 503 with error details if unavailable. |

Refer to Swagger UI for the complete schema (DTO definitions, enum values, and example payloads).

## Error Handling

All errors flow through `src/middleware/errorHandler.ts`, producing JSON responses shaped as:

```json
{
  "error": "Validation failed",
  "details": {
    "...": "..."
  },
  "requestId": "3f685b60-..."
}
```

Key status codes:

- `401 Unauthorized` when the bearer token is missing or invalid.
- `403 Forbidden` for dev-token access in production or role-restricted actions.
- `404 Not Found` when a trade form is missing.
- `409 Conflict` for idempotency violations or conflicting confirmations.
- `410 Gone` when a trade UID has expired.
- `422 Unprocessable Entity` for DTO/class-validator/zod validation failures.
- `429 Too Many Requests` when rate limits are exceeded.
- `500 Internal Server Error` for unexpected failures (includes `requestId` for log correlation).

## Testing

```bash
pnpm --filter @verifytrade/backend test
```

- Uses Jest with `ts-jest` and Supertest.
- Some tests spin up ephemeral PostgreSQL instances via `@testcontainers/postgresql`; ensure Docker is running and your user can access the Docker socket.
- Coverage reports are written to `app/backend/coverage/`.

## Code Quality

- Lint: `pnpm --filter @verifytrade/backend lint`
- Format: enforced through ESLint + Prettier config
- Type-check & build: `pnpm --filter @verifytrade/backend build` (outputs `dist/`)
- Start compiled bundle: `pnpm --filter @verifytrade/backend start` (runs `node dist/server.js`)

## Deployment Notes

1. Build the project: `pnpm --filter @verifytrade/backend build`
2. Ensure migrations are applied (either rely on the startup auto-run or execute `pnpm --filter @verifytrade/backend typeorm:migrate:run` during deploy).
3. Set production environment:
   - `NODE_ENV=production`
   - Provide strong `JWT_SECRET` / `PLATFORM_JWT_SECRET`
   - Point `DATABASE_URL` or discrete DB variables to your managed Postgres
   - Set `API_BASE_URL` and `SWAGGER_PATH` to match the deployed hostname/path
4. Behind reverse proxies, configure `TRUST_PROXY` to preserve client IPs.
5. Customize retry knobs (`DB_INIT_*`) when databases take longer than 30 seconds to accept connections.

## Troubleshooting

- **Cannot connect to Postgres:** Confirm the DB container is healthy (`pnpm --filter @verifytrade/backend dev:compose:up`), verify `DB_HOST`/`DATABASE_URL`, and check logs for SSL or authentication errors.
- **Server exits complaining about `JWT_SECRET`:** The key is mandatory in production; set a secure value before starting.
- **Frequent 429 responses:** Increase `RATE_LIMIT_MAX` or widen `RATE_LIMIT_WINDOW_MS` for your environment.
- **Idempotency conflicts (409):** Ensure `Idempotency-Key` headers are unique per logical operation and routed to the same actor.
- **Swagger assets blocked:** When hosting under HTTPS with a proxy, set `DEV_HTTPS=true` (for local) and ensure the proxy forwards `X-Forwarded-*` headers with `TRUST_PROXY` configured.
- **Dev token returns 403:** Confirm `NODE_ENV` is not set to `production` and the server is restarted after changing env vars.

## License & Credits

- **License:** Not specified. Contact the VerifyTrade maintainers for usage terms.
- **Credits:** VerifyTrade engineering team and contributors.
