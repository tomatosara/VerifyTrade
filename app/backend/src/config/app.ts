import './env';
import { z } from 'zod';

const appConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  PLATFORM_JWT_SECRET: z.string().min(10).optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  SHARE_URL_BASE: z
    .string()
    .url()
    .default('https://app.example.com/join'),
  ALLOWED_META_KEYS: z
    .string()
    .default('chain_tx_hash'),
  SWAGGER_PATH: z.string().default('/docs'),
  BASE_PATH: z.string().default('/'),
  DEV_HTTPS: z.string().default('false'),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
  TRUST_PROXY: z.string().optional()
});

const rawConfig = appConfigSchema.parse(process.env);

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
  jwtSecret: rawConfig.JWT_SECRET,
  platformJwtSecret: rawConfig.PLATFORM_JWT_SECRET ?? rawConfig.JWT_SECRET,
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
