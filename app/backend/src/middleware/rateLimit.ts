import rateLimit, { type Options } from 'express-rate-limit';
import type { Request } from 'express';
import { appConfig } from '@config/app';

export function createRateLimit(options?: Partial<Options>) {
  return rateLimit({
    windowMs: appConfig.rateLimitWindowMs,
    max: appConfig.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too Many Requests' },
    ...options
  });
}

export const verifyVCRateLimit = createRateLimit({
  keyGenerator: (req: Request) => `${req.user?.id ?? req.ip}-verify`
});
export const confirmRateLimit = createRateLimit({
  keyGenerator: (req: Request) => `${req.user?.id ?? req.ip}-confirm`
});
