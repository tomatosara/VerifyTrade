import { parse as parseCookie, serialize } from 'cookie';
import type { NextFunction, Request, Response } from 'express';
import { appConfig } from '@config/app';
import { secureRandomBytes } from '@utils/crypto-random';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const isStateChangingMethod = (method: string): boolean =>
  !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());

const resolveSecureFlag = () => process.env.NODE_ENV === 'production';

export const generateCsrfToken = (): string =>
  secureRandomBytes(32).toString('hex'); // cryptographically secure per Fortify guidance

// HttpOnly must remain false so the browser can read it and echo it back in the double-submit header.
export const makeCsrfCookie = (token: string, basePath = '/api/v1'): string =>
  serialize(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: resolveSecureFlag(), // secure keeps the CSRF token HTTPS-only in production
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

export const readCsrfHeaderToken = (req: Request): string | null => {
  const raw = req.headers[CSRF_HEADER_NAME];
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return typeof raw === 'string' ? raw : null;
};

const firstHeaderValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === 'string' ? value : null;
};

const normalizeOrigin = (raw: string | string[] | undefined): string | null => {
  const value = firstHeaderValue(raw);
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
};

const requestOrigin = (req: Request): string | null => {
  // Respect reverse proxy headers when trust proxy is enabled.
  const forwardedProto = firstHeaderValue(req.headers['x-forwarded-proto']);
  const forwardedHost = firstHeaderValue(req.headers['x-forwarded-host']);
  const proto = forwardedProto?.split(',')[0]?.trim() || req.protocol;
  const host =
    forwardedHost?.split(',')[0]?.trim() ||
    firstHeaderValue(req.headers.host) ||
    req.hostname ||
    null;

  if (!proto || !host) {
    return null;
  }

  return `${proto}://${host}`;
};

const isAllowedOrigin = (origin: string | null, reqOrigin: string | null): boolean => {
  if (!origin) return false;
  if (reqOrigin && origin === reqOrigin) {
    return true;
  }
  return appConfig.csrfAllowedOrigins.has(origin);
};

const validateOriginHeaders = (
  req: Request,
  res: Response,
  reqOrigin: string | null
): boolean => {
  const originHeader = normalizeOrigin(req.headers.origin);
  if (req.headers.origin !== undefined) {
    if (!originHeader || !isAllowedOrigin(originHeader, reqOrigin)) {
      res.status(403).json({ error: 'Forbidden: origin not allowed' });
      return false;
    }
    return true;
  }

  const refererOrigin = normalizeOrigin(req.headers.referer);
  if (req.headers.referer !== undefined) {
    if (!refererOrigin || !isAllowedOrigin(refererOrigin, reqOrigin)) {
      res.status(403).json({ error: 'Forbidden: referer not allowed' });
      return false;
    }
  }

  return true;
};

export const csrfProtectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Double-submit cookie + Origin/Referer enforcement for cookie-backed sessions.
  // We rely on the refresh_token lifetime (7 days) to scope CSRF validity to the active session.
  if (!isStateChangingMethod(req.method)) {
    return next();
  }

  const cookies = parseRequestCookies(req);
  // Only enforce CSRF when a session cookie is present (cookie-based auth flows).
  if (!cookies.refresh_token) {
    return next();
  }

  const originForRequest = requestOrigin(req);
  if (!validateOriginHeaders(req, res, originForRequest)) {
    return;
  }

  const csrfCookie = cookies[CSRF_COOKIE_NAME];
  const headerToken = readCsrfHeaderToken(req);
  if (!csrfCookie || !headerToken || csrfCookie !== headerToken) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  next();
};
