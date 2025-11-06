import './env.bootstrap';
import { z } from 'zod';

const dbEnvSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().positive().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  COMPOSE_DB_HOST: z.string().optional(),
  COMPOSE_DB_PORT: z.coerce.number().int().positive().optional()
});

const raw = dbEnvSchema.parse(process.env);

const fallbackHost = 'localhost';
const fallbackPort = 5432;
const fallbackUser = 'app';
const fallbackPassword = 'app';
const fallbackDatabase = 'app_db';

const resolvedHost = raw.DB_HOST ?? raw.COMPOSE_DB_HOST ?? fallbackHost;
const resolvedPort = raw.DB_PORT ?? raw.COMPOSE_DB_PORT ?? fallbackPort;
const resolvedUser = raw.DB_USER ?? fallbackUser;
const resolvedPassword = raw.DB_PASSWORD ?? fallbackPassword;
const resolvedDatabase = raw.DB_NAME ?? fallbackDatabase;

const databaseUrl =
  raw.DATABASE_URL ??
  `postgres://${encodeURIComponent(resolvedUser)}:${encodeURIComponent(
    resolvedPassword
  )}@${resolvedHost}:${resolvedPort}/${resolvedDatabase}`;

function inferConnectionInfo(urlString: string) {
  try {
    const url = new URL(urlString);
    return {
      host: url.hostname,
      port: Number(url.port || resolvedPort),
      database: url.pathname.replace(/^\//, '') || resolvedDatabase
    };
  } catch {
    return {
      host: resolvedHost,
      port: resolvedPort,
      database: resolvedDatabase
    };
  }
}

export const dbConfig = {
  host: resolvedHost,
  port: resolvedPort,
  user: resolvedUser,
  password: resolvedPassword,
  database: resolvedDatabase,
  databaseUrl,
  connectionInfo: inferConnectionInfo(databaseUrl)
} as const;

export type DbConfig = typeof dbConfig;
