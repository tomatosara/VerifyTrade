// src/modules/auth/cookies.ts
import { serialize } from 'cookie';

// Refresh cookies stay HttpOnly/SameSite so session riding relies on the CSRF double-submit check.
export function makeRefreshCookie(token: string, basePath = '/api/v1/auth') {
  const secure = process.env.NODE_ENV === 'production';
  // secure ties refresh cookies to HTTPS-only transport in production.
  return serialize('refresh_token', token, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'strict' : ('lax' as const),
    path: basePath,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearRefreshCookie(basePath = '/api/v1/auth') {
  const secure = process.env.NODE_ENV === 'production';
  return serialize('refresh_token', '', {
    httpOnly: true,
    secure,
    sameSite: secure ? 'strict' : ('lax' as const),
    path: basePath,
    maxAge: 0,
  });
}
