import './env.bootstrap';
import { z } from 'zod';

const appConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long').optional(),
  PLATFORM_JWT_SECRET: z.string().min(10).optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  SHARE_URL_BASE: z
    .string()
    .url()
    .default('https://app.example.com/join'),
  ALLOWED_META_KEYS: z
    .string()
    .default('chain_tx_hash,vc_user2'),
  SWAGGER_PATH: z.string().default('/docs'),
  BASE_PATH: z.string().default('/'),
  DEV_HTTPS: z.string().default('false'),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
  TRUST_PROXY: z.string().optional()
});

const rawConfig = appConfigSchema.parse(process.env);

const DEV_JWT_FALLBACK = 'dev-only-insecure-secret-change-me';
const isProduction = rawConfig.NODE_ENV === 'production';

if (isProduction && !rawConfig.JWT_SECRET) {
  throw new Error('Missing required env var JWT_SECRET in production.');
}

const resolvedJwtSecret =
  !isProduction && rawConfig.JWT_SECRET === undefined
    ? DEV_JWT_FALLBACK
    : (rawConfig.JWT_SECRET as string);

const resolvedPlatformJwtSecret = rawConfig.PLATFORM_JWT_SECRET ?? resolvedJwtSecret;

if (!process.env.JWT_SECRET && resolvedJwtSecret) {
  process.env.JWT_SECRET = resolvedJwtSecret;
}

export const env = {
  NODE_ENV: rawConfig.NODE_ENV,
  PORT: rawConfig.PORT,
  HOST: rawConfig.HOST,
  JWT_SECRET: resolvedJwtSecret,
  PLATFORM_JWT_SECRET: resolvedPlatformJwtSecret
} as const;

const parseTrustProxy = (value?: string): boolean | number | string => {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return value;
};

const normalizeBasePath = (value: string): string => {
  if (!value || value === '/') {
    return '/';
  }

  const trimmed = value.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed ? `/${trimmed}` : '/';
};

const normalizeSwaggerPath = (value: string): string => {
  const ensured = value.startsWith('/') ? value : `/${value}`;
  const trimmed = ensured.replace(/\/+$/, '');
  return trimmed || '/docs';
};

const parseBooleanLike = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
};

export const appConfig = {
  nodeEnv: rawConfig.NODE_ENV,
  port: rawConfig.PORT,
  host: rawConfig.HOST,
  jwtSecret: resolvedJwtSecret,
  platformJwtSecret: resolvedPlatformJwtSecret,
  rateLimitWindowMs: rawConfig.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: rawConfig.RATE_LIMIT_MAX,
  shareUrlBase: rawConfig.SHARE_URL_BASE,
  allowedMetaKeys: new Set(
    rawConfig.ALLOWED_META_KEYS.split(',').map((key) => key.trim()).filter(Boolean)
  ),
  jwtIssuer: rawConfig.JWT_ISSUER,
  jwtAudience: rawConfig.JWT_AUDIENCE,
  trustProxy: parseTrustProxy(rawConfig.TRUST_PROXY),
  swaggerPath: normalizeSwaggerPath(rawConfig.SWAGGER_PATH),
  basePath: normalizeBasePath(rawConfig.BASE_PATH),
  devHttps: parseBooleanLike(rawConfig.DEV_HTTPS)
} as const;

export type AppConfig = typeof appConfig;
