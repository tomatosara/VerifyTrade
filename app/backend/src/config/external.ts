import './env.bootstrap';
import { z } from 'zod';

const externalConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERIFIER_BASE: z.string().url().optional(),
  VERIFIER_TOKEN: z.string().optional(),
  ISSUER_BASE: z.string().url().optional(),
  ISSUER_TOKEN: z.string().optional()
});

const parsed = externalConfigSchema.parse(process.env);
const isProd = parsed.NODE_ENV === 'production';

const ensureHttps = (url: string | undefined, name: string): string | undefined => {
  if (!url) {
    return undefined;
  }

  if (isProd && !url.startsWith('https://')) {
    throw new Error(`${name} must use HTTPS in production to avoid insecure transport`);
  }

  return url;
};

export const externalServicesConfig = {
  nodeEnv: parsed.NODE_ENV,
  verifierBase: ensureHttps(parsed.VERIFIER_BASE, 'VERIFIER_BASE'),
  verifierToken: parsed.VERIFIER_TOKEN,
  issuerBase: ensureHttps(parsed.ISSUER_BASE, 'ISSUER_BASE'),
  issuerToken: parsed.ISSUER_TOKEN
} as const;

export type ExternalServicesConfig = typeof externalServicesConfig;
