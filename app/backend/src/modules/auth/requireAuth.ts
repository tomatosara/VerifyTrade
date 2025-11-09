import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '@utils/errors';
import type { AuthenticatedRequest } from '@middleware/auth';
import type { UserRole } from './entity/user.entity';
import { verifyJwt } from './jwt';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const claims = verifyJwt<{
      sub: string;
      role?: UserRole;
      idNumber?: string;
      name?: string;
      birthday?: string;
    }>(token);
    if (!claims?.sub) {
      throw new UnauthorizedError();
    }
    const role = claims.role ?? 'user';
    const typedRequest = req as AuthenticatedRequest;
    typedRequest.user = {
      id: claims.sub,
      sub: claims.sub,
      idNumber: claims.idNumber ?? claims.sub,
      role,
      name: claims.name ?? '',
      birthday: claims.birthday
    };
    next();
  } catch (error) {
    throw new UnauthorizedError();
  }
}

export function requirePlatformRole(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'platform') {
      throw new ForbiddenError('Platform role required');
    }
    next();
  });
}
