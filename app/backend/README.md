# VerifyTrade Backend

## Table of Contents
- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Database & Migrations](#database--migrations)
- [API Overview](#api-overview)
- [Endpoints](#endpoints)
  - [POST /api/v1/auth/dev-token](#post-apiv1authdev-token)
  - [POST /api/v1/tradeforms](#post-apiv1tradeforms)
  - [GET /api/v1/tradeforms/{uid}](#get-apiv1tradeformsuid)
  - [POST /api/v1/tradeforms/{uid}/verify-vc](#post-apiv1tradeformsuidverify-vc)
  - [POST /api/v1/tradeforms/{uid}/confirm](#post-apiv1tradeformsuidconfirm)
  - [POST /api/v1/tradeforms/{uid}/cancel](#post-apiv1tradeformsuidcancel)
  - [POST /api/v1/tradeforms/{uid}/finalize](#post-apiv1tradeformsuidfinalize)
  - [POST /api/v1/tradeforms/{uid}/finalize/retry](#post-apiv1tradeformsuidfinalizeretry)
  - [GET /api/v1/tradeforms/{uid}/audit](#get-apiv1tradeformsuidaudit)
  - [GET /api/v1/me/tradeforms](#get-apiv1metradeforms)
  - [GET /health](#get-health)
  - [GET /health/db](#get-healthdb)
- [Auth Guide](#auth-guide)
- [Local Dev Recipes](#local-dev-recipes)
- [Changelog Note](#changelog-note)

## Project Overview

VerifyTrade backend orchestrates the lifecycle of digital trade forms, including credential verification, bilateral confirmations, audit logging, and platform-controlled finalization. The service exposes a JSON REST API, issues signed JWTs for local development, and persists state to PostgreSQL with automatic migrations on boot.

**Tech stack**
- Runtime: Node.js 20 (pnpm workspaces)
- Framework: Express 4 + TSOA-generated routes (TypeScript)
- ORM/validation: TypeORM 0.3 with Zod DTO guards
- Database: PostgreSQL 16 (see `docker-compose.db.yml`)

## Quick Start

**Prerequisites**
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose (for PostgreSQL/Testcontainers)

**Install & run**

```bash
pnpm install
pnpm --filter backend build    # optional: compile TypeScript before running in prod mode
pnpm --filter backend dev      # starts src/server.ts with tsx in watch mode
```

**Environment variables**

Create `app/backend/.env` (or export them in your shell). Only `JWT_SECRET` is strictly required; the rest override sensible defaults.

```env
# Required
JWT_SECRET=change-me-for-local-dev

# Optional overrides
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgres://app:app@localhost:5432/app_db
PLATFORM_JWT_SECRET=platform-secret-change-me
JWT_ISSUER=verifytrade
JWT_AUDIENCE=verifytrade-users
BASE_PATH=/
SWAGGER_PATH=/docs
API_BASE_URL=http://localhost:3000
DEV_HTTPS=false
TRUST_PROXY=0

# Rate limiting & share links
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=20
SHARE_URL_BASE=https://app.example.com/join
ALLOWED_META_KEYS=chain_tx_hash

# Feature flags
PERSIST_STRATEGY=db                  # db | chain | db+chain
UID_TTL_MINUTES=60
VC_MIN_CRITERIA={}
CHAIN_RPC_URL=
CHAIN_WALLET_KEY=
REQUIRE_VC_FOR_CREATOR=false

# Database credentials (used when DATABASE_URL is unset)
DB_HOST=localhost
DB_PORT=5432
DB_USER=app
DB_PASSWORD=app
DB_NAME=app_db

# Seed & local tooling
SEED_PROFILE=dev
```

## Database & Migrations

**Start PostgreSQL**

```bash
pnpm --filter backend dev:compose:up
# Uses docker-compose.db.yml (Postgres 16) and forwards ${HOST_DB_PORT:-5432}
```

Stop and remove containers/volumes when done:

```bash
pnpm --filter backend dev:compose:down
```

**Apply migrations & seed data**

```bash
pnpm --filter backend migration:run     # runs TypeORM migrations once
pnpm --filter backend db:seed           # inserts dev profile data & prints JWTs
pnpm --filter backend db:seed:test      # optional: loads deterministic test fixtures
```

Migrations are also executed automatically on server startup (`AppDataSource.runMigrations` in `src/server.ts`), but running them manually helps surface errors earlier.

**Schema highlights**
- `users` — participant accounts with unique emails, role (`user` or `platform`), and optional password hashes.
- `trade_forms` — core trade records with status progression, share UID, metadata, and confirmation flags.
- `trade_audit_events` — immutable audit timeline linked to both trade and actor.
- `trade_confirmations` — per-user confirmation records keyed by `(trade_uid, actor_id)`.
- `idempotency_keys` — cached responses for POST endpoints that accept the `Idempotency-Key` header.

**Troubleshooting**
- `ECONNREFUSED` or `database not ready`: ensure Docker is running and the DB port is free. Override the host port with `HOST_DB_PORT=5433 pnpm --filter backend dev:compose:up` or adjust `DB_HOST`/`DB_PORT` when running Postgres elsewhere.
- Stale data after schema changes: run `pnpm --filter backend dev:compose:down` to drop the volume and rerun migrations + seed.

## API Overview

- **Base URL**: `http://localhost:3000/api/v1` (prefix respects `BASE_PATH` from `.env`)
- **Auth scheme**: `Authorization: Bearer <JWT>` signed with `JWT_SECRET` (platform-only actions require a `platform` role token)
- **Swagger UI**: `http://localhost:3000/docs` (configurable via `SWAGGER_PATH`)
- **OpenAPI spec**: `http://localhost:3000/openapi.json` or the checked-in `openapi.json`; regenerate with `pnpm --filter backend openapi`

**Global conventions**
- Pagination: `page` (default `1`) and `page_size` (default `20`, max `100`) query params.
- Filtering: `status` (`draft|pending|verified|confirmed|cancelled|failed|done`), `created_from`, and `created_to` (ISO-8601 timestamps).
- Dates/times: RFC 3339 UTC strings (e.g. `2024-05-07T09:30:00.000Z`).
- Idempotency: POST endpoints accept `Idempotency-Key`; repeated calls with the same key return the cached response.
- Rate limiting: credential verification and confirmations share a per-user window (`RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`); responses include standard `RateLimit-*` headers and return `429` with `{"error":"Too Many Requests"}`.
- Correlation: outbound errors include `requestId`. You can supply `X-Request-Id` or `X-Correlation-Id` to reuse your own trace identifier.

**Error format**

```json
{
  "error": "Validation Failed",
  "details": {
    "...": "..."
  },
  "requestId": "4b8668ae-305f-4b2d-b50a-e77f5cd218aa"
}
```

## Endpoints

Examples assume `BASE_URL` points to the backend origin (for example, `http://localhost:3000`) and that `USER_TOKEN`, `PLATFORM_TOKEN`, and `REQUEST_ID` environment variables hold suitable values where required.

### POST /api/v1/auth/dev-token

- **Summary**: Issue a short-lived JWT for local development (disabled when `NODE_ENV=production`).
- **Auth**: None
- **Query Params**: None
- **Path Params**: None
- **Request Body**

  ```json
  {
    "userId": "5d466f8d-67fd-4eef-90d4-1f7502c4d1f2",
    "role": "user",
    "email": "alice.rivers@verifytrade.dev",
    "name": "Alice Rivers"
  }
  ```

  - `userId` (string, required, UUID) — subject claim for the token.
  - `role` (string, optional) — `user` (default) or `platform`.
  - `email` (string, optional, must be valid email).
  - `name` (string, optional).

- **Responses**
  - `201 Created`

    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "1h",
      "role": "user"
    }
    ```

  - `403 Forbidden` — `{"error":"Dev token endpoint disabled in production","requestId":"..."}` (when `NODE_ENV=production`).

- **Curl Example**

  ```bash
  curl -X POST "$BASE_URL/api/v1/auth/dev-token" \
    -H "Content-Type: application/json" \
    -d '{"userId":"'"$USER_ID"'","role":"user","email":"'"$USER_EMAIL"'","name":"'"$USER_NAME"'"}'
  ```

- **Notes**: Tokens expire after 1 hour. Use `role: "platform"` to mint a platform token when exercising finalize endpoints.

### POST /api/v1/tradeforms

- **Summary**: Create a draft trade form and receive the shareable UID.
- **Auth**: `Authorization: Bearer <JWT>` (user role)
- **Query Params**: None
- **Path Params**: None
- **Request Body**

  ```json
  {
    "title": "USDT OTC escrow",
    "description": "P2P escrow with VC verification",
    "amount": "1000.00"
  }
  ```

  - `title` (string, required, 3-160 chars).
  - `description` (string, required, 3-4000 chars).
  - `amount` (string, optional) — decimal string with up to 8 fractional digits.

- **Responses**
  - `201 Created`

    ```json
    {
      "uid": "dQ7rFZc1o7g0uX9A1c2b",
      "status": "pending",
      "shareUrl": "https://app.example.com/join/dQ7rFZc1o7g0uX9A1c2b"
    }
    ```

  - `401 Unauthorized` — missing/invalid bearer token.
  - `422 Validation Failed` — payload rejected by Zod schema.

- **Curl Example**

  ```bash
  curl -X POST "$BASE_URL/api/v1/tradeforms" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $REQUEST_ID" \
    -d '{"title":"USDT OTC escrow","description":"P2P escrow with VC verification","amount":"1000.00"}'
  ```

- **Notes**: Supplying `Idempotency-Key` caches the 201 response for 24h per user and route.

### GET /api/v1/tradeforms/{uid}

- **Summary**: Retrieve a trade form visible to the caller (full view for participants, minimal status otherwise).
- **Auth**: `Authorization: Bearer <JWT>` (user role)
- **Query Params**: None
- **Path Params**

  | name | type | required | description |
  | --- | --- | --- | --- |
  | uid | string | yes | Trade UID returned during creation or shared with the counterparty. |

- **Responses**
  - `200 OK`

    ```json
    {
      "uid": "dQ7rFZc1o7g0uX9A1c2b",
      "title": "USDT OTC escrow",
      "description": "P2P escrow with VC verification",
      "amount": "1000.00",
      "status": "verified",
      "creatorId": "35ad1c74-53f5-4fc2-849e-2e120a6a6ba9",
      "counterpartyId": "1fb3ac97-3a92-49aa-8bdb-051a1aec2ae9",
      "meta": {},
      "createdAt": "2024-06-01T12:00:00.000Z",
      "updatedAt": "2024-06-01T12:30:00.000Z",
      "auditLog": [
        {
          "id": "5a9d0bf4-4135-4ca8-8b46-25b8d0f32c4f",
          "tradeUid": "dQ7rFZc1o7g0uX9A1c2b",
          "actorId": "35ad1c74-53f5-4fc2-849e-2e120a6a6ba9",
          "action": "create",
          "at": "2024-06-01T12:00:00.000Z",
          "details": {
            "title": "USDT OTC escrow"
          }
        }
      ]
    }
    ```

  - `401 Unauthorized` — bearer token missing/invalid.
  - `404 Not Found` — trade UID does not exist or caller has no access.
  - `410 Gone` — trade UID expired (`uid_expires_at` exceeded).

- **Curl Example**

  ```bash
  curl "$BASE_URL/api/v1/tradeforms/$TRADE_UID" \
    -H "Authorization: Bearer $USER_TOKEN"
  ```

- **Notes**: Non-participants receive the minimal payload `{ "uid": "...", "status": "..." }` when the trade still exists but is not shared with them.

### POST /api/v1/tradeforms/{uid}/verify-vc

- **Summary**: Validate a verifiable credential against policy and update the trade status.
- **Auth**: `Authorization: Bearer <JWT>` (user role)
- **Query Params**: None
- **Path Params**

  | name | type | required | description |
  | --- | --- | --- | --- |
  | uid | string | yes | Trade UID to verify. |

- **Request Body**

  ```json
  {
    "credential": {
      "proof": "base64-credential",
      "issuer": "did:web:issuer.example"
    }
  }
  ```

  - `credential` (object, optional) — arbitrary credential payload stored temporarily for validation.

- **Responses**
  - `200 OK`

    ```json
    {
      "valid": true,
      "status": "verified"
    }
    ```

  - `401 Unauthorized` — bearer token missing/invalid.
  - `404 Not Found` — trade not found or not accessible.
  - `409 Conflict` — credential already verified, VC invalid, or trade not ready for verification.

- **Curl Example**

  ```bash
  curl -X POST "$BASE_URL/api/v1/tradeforms/$TRADE_UID/verify-vc" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $REQUEST_ID" \
    -d '{"credential":{"proof":"sample-proof","issuer":"did:web:issuer.example"}}'
  ```

- **Notes**: Endpoint is rate-limited per user (default 20 attempts/minute). Use unique `Idempotency-Key` when retrying to avoid `409 Conflict`.

### POST /api/v1/tradeforms/{uid}/confirm

- **Summary**: Record confirmation from either participant; triggers finalization once both roles agree.
- **Auth**: `Authorization: Bearer <JWT>` (user role)
- **Query Params**: None
- **Path Params**

  | name | type | required | description |
  | --- | --- | --- | --- |
  | uid | string | yes | Trade UID to confirm. |

- **Request Body**

  ```json
  {
    "role": "user1"
  }
  ```

  - `role` (string, required) — `user1` (creator) or `user2` (counterparty).

- **Responses**
  - `200 OK`

    ```json
    {
      "status": "confirmed",
      "finalizeTriggered": true
    }
    ```

  - `401 Unauthorized` — bearer token missing/invalid.
  - `403 Forbidden` — caller lacks permission (e.g., wrong participant).
  - `404 Not Found` — trade missing.
  - `409 Conflict` — confirmation already recorded or trade in invalid state.

- **Curl Example**

  ```bash
  curl -X POST "$BASE_URL/api/v1/tradeforms/$TRADE_UID/confirm" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $REQUEST_ID" \
    -d '{"role":"user1"}'
  ```

- **Notes**: Reusing an `Idempotency-Key` before the first request finishes returns `409 Conflict`. Successful confirmation may asynchronously begin finalization depending on `PERSIST_STRATEGY`.

### POST /api/v1/tradeforms/{uid}/cancel

- **Summary**: Cancel an in-progress trade with an optional reason.
- **Auth**: `Authorization: Bearer <JWT>` (user role)
- **Query Params**: None
- **Path Params**

  | name | type | required | description |
  | --- | --- | --- | --- |
  | uid | string | yes | Trade UID to cancel. |

- **Request Body**

  ```json
  {
    "reason": "Counterparty requested new price"
  }
  ```

  - `reason` (string, optional, ≤500 chars) — cancellation justification.

- **Responses**
  - `200 OK`

    ```json
    {
      "status": "cancelled"
    }
    ```

  - `401 Unauthorized`
  - `403 Forbidden` — caller is not the creator or associated participant.
  - `404 Not Found`
  - `409 Conflict` — trade already finalized/failed/cancelled.

- **Curl Example**

  ```bash
  curl -X POST "$BASE_URL/api/v1/tradeforms/$TRADE_UID/cancel" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $REQUEST_ID" \
    -d '{"reason":"Counterparty requested new price"}'
  ```

- **Notes**: Cancellation appends an audit event and is idempotent when repeating the same `Idempotency-Key`.

### POST /api/v1/tradeforms/{uid}/finalize

- **Summary**: Force finalization for a confirmed trade (platform-only).
- **Auth**: `Authorization: Bearer <JWT>` (platform role required)
- **Query Params**: None
- **Path Params**

  | name | type | required | description |
  | --- | --- | --- | --- |
  | uid | string | yes | Trade UID to finalize. |

- **Request Body**: None

- **Responses**
  - `200 OK`

    ```json
    {
      "status": "done",
      "meta": {
        "finalizedBy": "platform"
      }
    }
    ```

  - `401 Unauthorized`
  - `403 Forbidden` — token role is not `platform`.
  - `404 Not Found`
  - `409 Conflict` — trade not in `confirmed`/`failed` state or already finalized.

- **Curl Example**

  ```bash
  curl -X POST "$BASE_URL/api/v1/tradeforms/$TRADE_UID/finalize" \
    -H "Authorization: Bearer $PLATFORM_TOKEN" \
    -H "Idempotency-Key: $REQUEST_ID"
  ```

- **Notes**: Finalization strategy obeys `PERSIST_STRATEGY`. Missing chain configuration causes the trade to transition to `failed` with an error message in the response.

### POST /api/v1/tradeforms/{uid}/finalize/retry

- **Summary**: Retry a failed finalization attempt (platform-only).
- **Auth**: `Authorization: Bearer <JWT>` (platform role)
- **Query Params**: None
- **Path Params**

  | name | type | required | description |
  | --- | --- | --- | --- |
  | uid | string | yes | Trade UID to retry. |

- **Request Body**: None

- **Responses**
  - `200 OK`

    ```json
    {
      "status": "failed",
      "meta": {
        "finalizedBy": "platform",
        "retry": true
      },
      "error": "Chain configuration missing"
    }
    ```

  - `401 Unauthorized`
  - `403 Forbidden`
  - `404 Not Found`

- **Curl Example**

  ```bash
  curl -X POST "$BASE_URL/api/v1/tradeforms/$TRADE_UID/finalize/retry" \
    -H "Authorization: Bearer $PLATFORM_TOKEN" \
    -H "Idempotency-Key: $REQUEST_ID"
  ```

- **Notes**: Safe to repeat with the same `Idempotency-Key`; helpful for compensating actions after configuring chain services.

### GET /api/v1/tradeforms/{uid}/audit

- **Summary**: Fetch the audit trail for a trade (creation, verification, confirmations, retries).
- **Auth**: `Authorization: Bearer <JWT>` (user role)
- **Query Params**: None
- **Path Params**

  | name | type | required | description |
  | --- | --- | --- | --- |
  | uid | string | yes | Trade UID to inspect. |

- **Responses**
  - `200 OK`

    ```json
    [
      {
        "id": "5a9d0bf4-4135-4ca8-8b46-25b8d0f32c4f",
        "tradeUid": "dQ7rFZc1o7g0uX9A1c2b",
        "actorId": "35ad1c74-53f5-4fc2-849e-2e120a6a6ba9",
        "action": "create",
        "at": "2024-06-01T12:00:00.000Z",
        "details": {
          "title": "USDT OTC escrow"
        }
      }
    ]
    ```

  - `401 Unauthorized`
  - `403 Forbidden` — caller is not part of the trade.
  - `404 Not Found`

- **Curl Example**

  ```bash
  curl "$BASE_URL/api/v1/tradeforms/$TRADE_UID/audit" \
    -H "Authorization: Bearer $USER_TOKEN"
  ```

- **Notes**: Audit events include retries/failures performed by platform users and mirror the `trade_audit_events` table.

### GET /api/v1/me/tradeforms

- **Summary**: List the caller’s trade forms with pagination and status filters.
- **Auth**: `Authorization: Bearer <JWT>` (user role)
- **Query Params**

  | name | type | required | default | description |
  | --- | --- | --- | --- | --- |
  | status | string | no | — | Filter by trade status (`draft`…`done`). |
  | created_from | string | no | — | ISO-8601 timestamp (inclusive). |
  | created_to | string | no | — | ISO-8601 timestamp (inclusive). |
  | page | integer | no | 1 | Page number (>=1). |
  | page_size | integer | no | 20 | Page size (1-100). |

- **Path Params**: None

- **Responses**
  - `200 OK`

    ```json
    {
      "data": [
        {
          "uid": "dQ7rFZc1o7g0uX9A1c2b",
          "title": "USDT OTC escrow",
          "description": "P2P escrow with VC verification",
          "amount": "1000.00",
          "status": "pending",
          "creatorId": "35ad1c74-53f5-4fc2-849e-2e120a6a6ba9",
          "counterpartyId": null,
          "meta": {},
          "createdAt": "2024-06-01T12:00:00.000Z",
          "updatedAt": "2024-06-01T12:00:00.000Z",
          "auditLog": [],
          "shareUrl": "https://app.example.com/join/dQ7rFZc1o7g0uX9A1c2b"
        }
      ],
      "page": 1,
      "pageSize": 20,
      "total": 1
    }
    ```

  - `401 Unauthorized`

- **Curl Example**

  ```bash
  curl "$BASE_URL/api/v1/me/tradeforms?page=1&page_size=20&status=pending" \
    -H "Authorization: Bearer $USER_TOKEN"
  ```

- **Notes**: `created_from`/`created_to` are converted to `Date` objects server-side; pass ISO timestamps to avoid parsing failures. Pagination metadata mirrors the `Paged<T>` structure used across list endpoints.

### GET /health

- **Summary**: Lightweight service liveness check.
- **Auth**: None
- **Query Params**: None
- **Path Params**: None

- **Responses**
  - `200 OK` — `{"status":"ok"}`

- **Curl Example**

  ```bash
  curl "$BASE_URL/health"
  ```

- **Notes**: Endpoint is mounted outside `/api/v1` (path `/health`). Useful for container orchestrators.

### GET /health/db

- **Summary**: Database readiness probe that executes `SELECT 1`.
- **Auth**: None
- **Query Params**: None
- **Path Params**: None

- **Responses**
  - `200 OK` — `{"ok":true}`
  - `503 Service Unavailable` — `{"ok":false,"error":"database not ready"}` or underlying connection error message.

- **Curl Example**

  ```bash
  curl "$BASE_URL/health/db"
  ```

- **Notes**: Returns `503` until the TypeORM data source initializes. Logs detailed failures under the `verifytrade-backend` logger.

## Auth Guide

1. Seed local fixtures (optional but convenient):

   ```bash
   pnpm --filter backend db:seed
   ```

   The command prints user IDs, roles, and ready-to-use JWTs for `alice`, `bob`, and `platform`.

2. Generate ad-hoc tokens:

   ```bash
   USER_ID=$(uuidgen)
   curl -X POST "$BASE_URL/api/v1/auth/dev-token" \
     -H "Content-Type: application/json" \
     -d '{"userId":"'"$USER_ID"'","role":"user","email":"user@example.com","name":"Example User"}'
   ```

3. Platform-only flows: supply `"role":"platform"` and ensure `PLATFORM_JWT_SECRET` is set (defaults to `JWT_SECRET`).

4. Tokens expire after `1h`; request a new token or rerun the seed script to refresh.

**Store local tokens safely**

```env
# .env.local (never commit)
USER_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PLATFORM_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BASE_URL=http://localhost:3000
```

## Local Dev Recipes

- **Reset DB and reseed**: `pnpm --filter backend dev:compose:down && pnpm --filter backend dev:compose:up && pnpm --filter backend migration:run && pnpm --filter backend db:seed`
- **Change DB port**: `HOST_DB_PORT=5433 pnpm --filter backend dev:compose:up` (updates the forwarded host port while retaining container port 5432).
- **Point the app at a remote Postgres**: set `DATABASE_URL=postgres://user:pass@host:5432/dbname` in `.env` and skip Docker.
- **Run Jest suite**: `pnpm --filter backend test` (requires Docker for Testcontainers; ensure port 5432 is free).
- **Regenerate OpenAPI & routes**: `pnpm --filter backend openapi` after modifying controllers or DTOs.

## Changelog Note

Auto-updated on 2025-11-04 based on the current controllers, TypeORM schema, and `openapi.json` (`pnpm --filter backend openapi`).
