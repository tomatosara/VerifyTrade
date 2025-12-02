import './env.bootstrap';
import { z } from 'zod';

const securityEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be provided via env'),
  PLATFORM_JWT_SECRET: z.string().min(10).optional(),
  JWT_REFRESH_SECRET: z.string().min(10).optional()
});

export const getSecurityConfig = () => {
  const raw = securityEnvSchema.parse(process.env);
  const isProduction = raw.NODE_ENV === 'production';

  const jwtSecret = raw.JWT_SECRET;
  const platformJwtSecret = raw.PLATFORM_JWT_SECRET ?? jwtSecret;
  const jwtRefreshSecret = raw.JWT_REFRESH_SECRET ?? jwtSecret;

  if (isProduction && !raw.JWT_REFRESH_SECRET) {
    throw new Error('Missing required env var JWT_REFRESH_SECRET in production.');
  }

  return {
    jwtSecret,
    platformJwtSecret,
    jwtRefreshSecret
  } as const;
};
