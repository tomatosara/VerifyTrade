import type { Request, Response } from 'express';
import { UnauthorizedError } from '@utils/errors';
import { verifyJwt } from '@modules/auth/jwt';
import { getSecurityConfig } from '@config/security';
import { CSRF_COOKIE_NAME, parseRequestCookies, readCsrfHeaderToken } from '@modules/auth/csrf';

type AccessClaims = {
  sub?: string;
  id?: string;
  idNumber?: string;
  role?: string;
  name?: string;
  birthday?: string;
};

export async function expressAuthentication(
  request: Request,
  name: string,
  _scopes?: string[],
  _response?: Response
) {
  void _scopes;
  void _response;

  if (name === 'bearerAuth') {
    const header = request.headers.authorization;
    if (!header) {
      throw new UnauthorizedError();
    }

    const [scheme, token] = header.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedError();
    }

    const claims = verifyJwt<AccessClaims>(token);
    if (!claims) {
      throw new UnauthorizedError();
    }

    (request as any).user = {
      id: claims.id ?? claims.sub,
      idNumber: claims.idNumber ?? claims.sub,
      name: claims.name,
      role: claims.role,
      birthday: claims.birthday
    };

    return request.user;
  }

  if (name === 'refreshTokenCookie') {
    const cookies = parseRequestCookies(request);
    const refresh = cookies.refresh_token;
    if (!refresh) {
      throw new UnauthorizedError();
    }

    const csrfCookie = cookies[CSRF_COOKIE_NAME];
    const csrfHeader = readCsrfHeaderToken(request);
    if (csrfCookie && csrfHeader && csrfCookie !== csrfHeader) {
      throw new UnauthorizedError('Invalid CSRF token');
    }

    const { jwtRefreshSecret } = getSecurityConfig();
    const claims = verifyJwt<AccessClaims & { typ?: string }>(refresh, jwtRefreshSecret);
    if (!claims || claims.typ !== 'refresh' || !claims.sub) {
      throw new UnauthorizedError();
    }

    (request as any).user = {
      id: claims.id ?? claims.sub,
      idNumber: claims.idNumber ?? claims.sub,
      name: claims.name,
      role: claims.role ?? 'user',
      birthday: claims.birthday
    };

    return request.user;
  }

  throw new UnauthorizedError(`Unsupported security scheme: ${name}`);

}
