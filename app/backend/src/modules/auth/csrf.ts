import { parse as parseCookie, serialize } from 'cookie';
import type { NextFunction, Request, Response } from 'express';
import { appConfig } from '@config/app';
import { secureRandomBytes } from '@utils/crypto-random';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_REQUEST_ID_HEADER_NAME = 'x-csrf-request-id';

// CSRF fix: added per-request nonce replay tracking in-memory.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{19,127}$/;
const REQUEST_ID_TTL_MS = 15 * 60 * 1000; // 15 minutes
const requestIdReplayCache: Map<string, number> = new Map();

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

// CSRF fix: added per-request nonce parsing helpers to mirror frontend headers/body.
export const readRequestIdHeader = (req: Request): string | null => {
  const raw = req.headers[CSRF_REQUEST_ID_HEADER_NAME];
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return typeof raw === 'string' ? raw : null;
};

const readRequestIdFromBody = (req: Request): string | null => {
  const body = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const candidate = (body as Record<string, unknown>).requestId;
    return typeof candidate === 'string' ? candidate : null;
  }
  return null;
};

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

// CSRF fix: added per-request nonce validation plus replay prevention with short TTL.
const cleanupExpiredRequestNonces = (now = Date.now()): void => {
  for (const [id, expiresAt] of requestIdReplayCache.entries()) {
    if (expiresAt <= now) {
      requestIdReplayCache.delete(id);
    }
  }
};

const reserveRequestNonce = (requestId: string, now = Date.now()): boolean => {
  cleanupExpiredRequestNonces(now);
  const existingExpiry = requestIdReplayCache.get(requestId);
  if (existingExpiry && existingExpiry > now) {
    return false;
  }
  requestIdReplayCache.set(requestId, now + REQUEST_ID_TTL_MS);
  return true;
};

// CSRF fix: added per-request nonce validation that must happen before mutating routes.
const validateRequestNonce = (
  req: Request
): { ok: true; requestId: string } | { ok: false; status: number; message: string } => {
  const headerIdRaw = readRequestIdHeader(req);
  const bodyIdRaw = readRequestIdFromBody(req);
  const headerId = headerIdRaw?.trim();
  const bodyId = bodyIdRaw?.trim();

  if (!headerId && !bodyId) {
    return { ok: false, status: 400, message: 'Missing requestId' };
  }

  const invalidHeader = headerId !== undefined && headerId !== null && !REQUEST_ID_PATTERN.test(headerId);
  const invalidBody = bodyId !== undefined && bodyId !== null && !REQUEST_ID_PATTERN.test(bodyId);

  if (invalidHeader || invalidBody) {
    return { ok: false, status: 400, message: 'Malformed requestId' };
  }

  if (headerId && bodyId && headerId !== bodyId) {
    return { ok: false, status: 400, message: 'Mismatched requestId' };
  }

  const requestId = headerId || bodyId;
  if (!requestId) {
    return { ok: false, status: 400, message: 'Missing requestId' };
  }

  if (!reserveRequestNonce(requestId)) {
    return { ok: false, status: 409, message: 'Replayed requestId' };
  }

  return { ok: true, requestId };
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

  // CSRF fix: added per-request nonce validation before CSRF cookie checks.
  const nonceCheck = validateRequestNonce(req);
  if (!nonceCheck.ok) {
    res.status(nonceCheck.status).json({ error: nonceCheck.message });
    return;
  }
  req.requestId = nonceCheck.requestId;

  const cookies = parseRequestCookies(req);
  const csrfCookie = cookies[CSRF_COOKIE_NAME];
  const hasSessionCookie = Boolean(cookies.refresh_token);
  const enforceCsrf = hasSessionCookie || Boolean(csrfCookie);
  // CSRF fix: added per-request nonce + token enforcement whenever the CSRF cookie participates.
  if (!enforceCsrf) {
    return next();
  }

  const originForRequest = requestOrigin(req);
  if (!validateOriginHeaders(req, res, originForRequest)) {
    return;
  }

  const headerToken = readCsrfHeaderToken(req);
  if (!csrfCookie || !headerToken || csrfCookie !== headerToken) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  next();
};
