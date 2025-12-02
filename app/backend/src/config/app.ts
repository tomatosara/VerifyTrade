import './env.bootstrap';
import { z } from 'zod';

const appConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
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
  DEV_TLS_CERT_PATH: z.string().optional(),
  DEV_TLS_KEY_PATH: z.string().optional(),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
  TRUST_PROXY: z.string().optional(),
  CSRF_ALLOWED_ORIGINS: z.string().optional()
});

const rawConfig = appConfigSchema.parse(process.env);

export const env = {
  NODE_ENV: rawConfig.NODE_ENV,
  PORT: rawConfig.PORT,
  HOST: rawConfig.HOST
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

const parseOrigins = (value?: string): Set<string> => {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((origin) => {
        try {
          const parsed = new URL(origin);
          return `${parsed.protocol}//${parsed.host}`;
        } catch {
          return null;
        }
      })
      .filter((origin): origin is string => origin !== null)
  );
};

export const appConfig = {
  nodeEnv: rawConfig.NODE_ENV,
  port: rawConfig.PORT,
  host: rawConfig.HOST,
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
  devHttps: parseBooleanLike(rawConfig.DEV_HTTPS),
  devTlsCertPath: rawConfig.DEV_TLS_CERT_PATH,
  devTlsKeyPath: rawConfig.DEV_TLS_KEY_PATH,
  csrfAllowedOrigins: (() => {
    const configured = parseOrigins(rawConfig.CSRF_ALLOWED_ORIGINS);
    if (configured.size > 0) {
      return configured;
    }
    // Dev-only defaults; production should configure HTTPS origins explicitly.
    return parseOrigins(`http://localhost:${rawConfig.PORT},http://localhost:5173`);
  })()
} as const;

export type AppConfig = typeof appConfig;
