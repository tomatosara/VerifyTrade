import { randomBytes } from 'crypto';
import { parse as parseCookie, serialize } from 'cookie';
import type { NextFunction, Request, Response } from 'express';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const isStateChangingMethod = (method: string): boolean =>
  !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());

const resolveSecureFlag = () => process.env.NODE_ENV === 'production';

export const generateCsrfToken = (): string => randomBytes(32).toString('hex');

export const makeCsrfCookie = (token: string, basePath = '/api/v1'): string =>
  serialize(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: resolveSecureFlag(),
    sameSite: resolveSecureFlag() ? 'strict' : ('lax' as const),
    path: basePath,
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

export const clearCsrfCookie = (basePath = '/api/v1'): string =>
  serialize(CSRF_COOKIE_NAME, '', {
    httpOnly: false,
    secure: resolveSecureFlag(),
    sameSite: resolveSecureFlag() ? 'strict' : ('lax' as const),
    path: basePath,
    maxAge: 0
  });

export const parseRequestCookies = (req: Request): Record<string, string | undefined> =>
  parseCookie(req.headers.cookie ?? '') as Record<string, string | undefined>;

const readHeaderToken = (req: Request): string | null => {
  const raw = req.headers[CSRF_HEADER_NAME];
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return typeof raw === 'string' ? raw : null;
};

export const csrfProtectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!isStateChangingMethod(req.method)) {
    return next();
  }

  const cookies = parseRequestCookies(req);
  // Only enforce CSRF when a session cookie is present (cookie-based auth flows).
  if (!cookies.refresh_token) {
    return next();
  }

  const csrfCookie = cookies[CSRF_COOKIE_NAME];
  const headerToken = readHeaderToken(req);
  if (!csrfCookie || !headerToken || csrfCookie !== headerToken) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  next();
};
