import jwt from 'jsonwebtoken';
import { appConfig } from '@config/app';
import type { UserRole } from './entity/user.entity';

export interface JwtClaims {
  sub: string;
  role: UserRole;
  email?: string;
  name?: string;
  iss?: string;
  aud?: string;
}

const jwtOptions = {
  issuer: appConfig.jwtIssuer,
  audience: appConfig.jwtAudience,
  expiresIn: '1h'
} as const;

export function signJwt(claims: JwtClaims): string {
  return jwt.sign(claims, appConfig.jwtSecret, jwtOptions);
}

export function signPlatformJwt(claims: JwtClaims): string {
  return jwt.sign(claims, appConfig.platformJwtSecret, jwtOptions);
}

export function verifyJwt(token: string): JwtClaims {
  try {
    return jwt.verify(token, appConfig.jwtSecret, {
      issuer: appConfig.jwtIssuer,
      audience: appConfig.jwtAudience
    }) as JwtClaims;
  } catch (err) {
    if (appConfig.platformJwtSecret !== appConfig.jwtSecret) {
      try {
        return jwt.verify(token, appConfig.platformJwtSecret, {
          issuer: appConfig.jwtIssuer,
          audience: appConfig.jwtAudience
        }) as JwtClaims;
      } catch {
        throw err;
      }
    }
    throw err;
  }
}
