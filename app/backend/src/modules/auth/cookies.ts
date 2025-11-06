// src/modules/auth/cookies.ts
import { serialize } from 'cookie';

export function makeRefreshCookie(token: string, basePath = '/api/v1/auth') {
  // dev 環境可先把 secure 設 false；正式請改 true
  const secure = process.env.NODE_ENV === 'production';
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
