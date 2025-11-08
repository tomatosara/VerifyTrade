# VerifyTrade Monorepo

This workspace hosts the VerifyTrade backend (Express + TypeORM) and frontend (React + Vite).  The backend exposes JWT authentication, user/trade/transaction APIs, verifier utilities, and an OpenAPI specification.  The frontend now consumes those APIs directly via a shared client and renders live data for login, trade creation, VC verification, and transaction history.

## Requirements
- Node.js 20.19+ (or 22.12+) and pnpm 10.20+
- Docker (optional) for Postgres via `docker-compose.db.yml`

## Quick Start
```bash
pnpm install

# start Postgres (optional)
pnpm run dev:compose:up --filter @verifytrade/backend

# backend API + Swagger
env $(cat app/backend/.env.example | xargs) pnpm --filter @verifytrade/backend dev

# frontend (uses VITE_API_BASE_URL)
pnpm --filter frontend dev
```
Swagger UI is served at `http://localhost:3000/docs` after the backend boots.

## Environment Variables
- Copy `app/backend/.env.example` to `app/backend/.env` and adjust `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CORS_ORIGINS` (comma‑separated list of allowed origins).
- The frontend dev server reads `app/frontend/.env.development.local` (committed) for `VITE_API_BASE_URL` (defaults to `http://localhost:3000/api/v1`).
- Backend auth uses bearer tokens (`Authorization: Bearer <JWT>`) plus an HttpOnly `refresh_token` cookie that is rotated via `POST /api/v1/auth/refresh`.

## API Overview
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/v1/auth/login-by-verifier` | Exchange verifier transaction for `{ token, user }` + refresh cookie |
| GET | `/api/v1/auth/me` | Current session profile |
| GET | `/api/v1/users` / `/api/v1/users/{id}` | List or fetch platform users |
| GET/POST | `/api/v1/tradeforms` | List or create trade forms |
| GET | `/api/v1/tradeforms/{id}` / `/api/v1/tradeforms/uid/{uid}` | Fetch by numeric id or public UID view |
| POST | `/api/v1/tradeforms/{uid}/verify-vc` | Submit VC proof; 403 responses include `details.missing_claims` |
| POST | `/api/v1/tradeforms/{uid}/confirm` | Confirm as creator/counterparty |
| GET/POST | `/api/v1/transactions` | Actor-scoped view of trades + alias create endpoint |
| GET | `/api/v1/transactions/{uid}` | Transaction detail (role + full trade) |
| GET | `/api/v1/users` | Paginated user directory |
| POST | `/api/v1/verifier/result` | Poll QR login result |
| GET | `/health` | Returns `{ ok: true, ... }` for readiness probes |

All authenticated routes require the bearer token issued by `/auth/login-by-verifier`.

## Frontend Integration
The frontend consumes the API through `src/lib/apiClient.ts`, which wraps `fetch`, injects the JWT, and retries once via `/auth/refresh` on 401s.

```ts
import { tradeformsApi } from "@/lib/apiClient";

const list = await tradeformsApi.list({ paymentMethod: "BANK_TRANSFER" });
const created = await tradeformsApi.create({
  itemName: "二手筆電",
  itemDescription: "i5/16GB/512GB",
  itemCondition: "SECOND_HAND",
  amount: "12000",
  tradeChannel: "IN_PERSON",
  paymentMethod: "CASH_ON_DELIVERY",
  matchmakingChannel: "OFFLINE_AGREEMENT",
  identityRequirements: ["STUDENT_ID"],
  userRating: 4,
});
```

## Developer Notes
- CORS now respects `CORS_ORIGINS` with credential support; set it to your frontend origin (e.g., `http://localhost:5173`).
- `/health` returns `{ ok: true, uptimeSec, version }` and `/ready` keeps detailed dependency checks.
- New controllers:
  - `UsersController` for `/api/v1/users`
  - `TransactionController` for transaction-centric views of trades
- Swagger (`app/backend/openapi.json`) and `src/http/routes.ts` were regenerated via `pnpm --filter @verifytrade/backend openapi`.
- Tests: `pnpm --filter @verifytrade/backend test -- routes/health.spec.ts`
- Frontend build was attempted but fails under Node 22.11.0 because Vite requires Node 20.19+ or 22.12+. Run the build with a supported Node version if you need a production bundle.

Additional deep-dive notes are documented in `INTEGRATION_NOTES.md`.
