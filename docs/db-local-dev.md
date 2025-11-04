# Local Database Development

This backend uses PostgreSQL via TypeORM. The configuration is shared between local development and Docker Compose, so switching between running the API on your host and inside containers only requires updating environment variables.

## Environment Setup

1. Copy `app/backend/.env.example` to `app/backend/.env` and tailor any secrets.
2. For host-based development, start with:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=app
   DB_PASSWORD=app
   DB_NAME=app_db
   ```
3. When running inside Docker Compose, uncomment the compose vars and use:
   ```
   COMPOSE_DB_HOST=db
   COMPOSE_DB_PORT=5432
   ```
4. If port `5432` is busy on your machine, set `HOST_DB_PORT=5433` (or any free port) before starting Compose. The compose file will forward `${HOST_DB_PORT:-5432}` to the container.

> You can still supply a single `DATABASE_URL` instead of discrete variables if preferred; the backend will derive host/port/user settings from it automatically.

## Docker Compose Commands

- Start PostgreSQL:
  ```bash
  docker compose -f docker-compose.db.yml up -d
  ```
- Stop and remove volumes:
  ```bash
  docker compose -f docker-compose.db.yml down -v
  ```

The `db` service exposes a healthcheck (`pg_isready`) and persists data in the `db_data` named volume.

### Optional: pgAdmin 4

Uncomment the `pgadmin` service in `docker-compose.db.yml` and set:
```
export PGADMIN_DEFAULT_EMAIL=dev@example.com
export PGADMIN_DEFAULT_PASSWORD=super-secret
```
Then re-run `docker compose up -d`. Access pgAdmin at http://localhost:5050 and register the `db` server using host `db` and the credentials above.

## Backend Commands

- Run the API locally (host machine):
  ```bash
  pnpm --filter @verifytrade/backend run dev:api
  ```
- Generate a new migration:
  ```bash
  pnpm --filter @verifytrade/backend run db:generate --name migration-name
  ```

## Seeding & Migrations

- Apply pending migrations (the seed script also runs this automatically):
  ```bash
  pnpm --filter @verifytrade/backend run typeorm:migrate:run
  ```
- Revert migrations (pass `-- --all` to drop back to an empty schema):
  ```bash
  pnpm --filter @verifytrade/backend run typeorm:migrate:revert -- --all
  ```
- Seed development data (idempotent; safe to run multiple times):
  ```bash
  pnpm --filter @verifytrade/backend run db:seed
  ```
- Reset the database (revert all migrations, re-apply, seed):
  ```bash
  pnpm --filter @verifytrade/backend run db:reset
  ```

## Health Check

With the API running, confirm database connectivity:
```bash
curl http://localhost:3000/health/db
```
A healthy database responds with:
```json
{ "ok": true }
```

If the response reports `ok: false`, inspect the backend logs. The server logs the resolved database host, port, and database name during startup to make diagnosing configuration issues straightforward.
