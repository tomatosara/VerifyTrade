# Database Seeding

The backend ships with an idempotent TypeORM-based seed program that mirrors the current entities, DTOs, and validation constraints. Use it to populate realistic fixtures for local development or deterministic test data for automation.

## Prerequisites
- Install dependencies with `pnpm install`.
- Ensure PostgreSQL is running (see `docs/db-local-dev.md`) and the credentials in `app/backend/.env` point at the instance you want to seed.
- Apply migrations first (`pnpm --filter @verifytrade/backend db:migrate`) so the schema matches the entities.

## Running the Seed Script
- Development profile (default):
  ```bash
  pnpm --filter @verifytrade/backend db:seed
  ```
  Seeds three users (`user`, `user`, `platform` roles), seven trade forms that cover every lifecycle status, confirmations, and matching audit events. Signed JWTs for the dev users and the seeded trade UIDs are printed to the console for quick API smoke tests.
- Test profile (deterministic fixtures):
  ```bash
  pnpm --filter @verifytrade/backend db:seed:test
  ```
  Seeds three users and two trades with stable UUIDs/UIDs so automated tests can assert on exact identifiers. This profile is also used by `src/database/seed/seed.test.ts`.

You can override the profile explicitly:
```bash
pnpm --filter @verifytrade/backend db:seed -- --profile=test
```
or by setting `SEED_PROFILE=test` before running the command.

The script is safe to re-run. Users are upserted by email, trade forms by UID, audit events by ID, and confirmations by `(tradeUid, actorId)`.

## Inspecting Seeded Data
- Quick counts:
  ```bash
  pnpm --filter @verifytrade/backend typeorm query "SELECT status, COUNT(*) FROM trade_forms GROUP BY status ORDER BY status"
  ```
- Open a psql session:
  ```bash
  psql "$DATABASE_URL"
  ```
- From the API, try:
  - `GET /api/v1/tradeforms/{uid}`
  - `GET /api/v1/tradeforms/{uid}/audit`
  using one of the printed JWTs in the `Authorization` header.

## Common Issues
- **Unique constraint errors**: Ensure you are targeting the right database and that migrations have run. The seed script removes stale audit events and confirmations for the seeded trade UIDs, so conflicting legacy rows usually indicate a mismatched UID or manual edits.
- **Validation errors**: Double-check `SHARE_URL_BASE`, JWT secrets, and allowed meta keys in `.env`; the seed data respects the same validation logic that the API uses.
- **Database connection failures**: Confirm `DATABASE_URL` or discrete `DB_*` settings are reachable from where you run the command, especially when mixing local and Docker Compose environments.
