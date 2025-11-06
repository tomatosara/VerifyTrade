import type { Request, Response } from 'express';
import { UnauthorizedError } from '@utils/errors';
import { verifyJwt } from '@modules/auth/jwt';

export async function expressAuthentication(
  request: Request,
  name: string,
  _scopes?: string[],
  _response?: Response
) {
  if (name !== 'jwt') {
    throw new UnauthorizedError(`Unsupported security scheme: ${name}`);
  }

  const header = request.headers.authorization;
  if (!header) {
    throw new UnauthorizedError();
  }

  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    throw new UnauthorizedError();
  }

  const claims = verifyJwt(token);

  (request as any).user = {
    idNumber: claims.idNumber,
    name: claims.name,
    role: claims.role,
    birthday: claims.birthday
  };

  return request.user;
}
