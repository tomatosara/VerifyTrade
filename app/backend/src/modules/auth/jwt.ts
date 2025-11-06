// src/modules/auth/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';

const DEFAULT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signJwt(
  payload: Record<string, any>,
  opts?: { expiresIn?: SignOptions['expiresIn']; secret?: string } // ← 用現成型別
): string {
  const options: SignOptions = {};
  if (opts?.expiresIn !== undefined) {
    options.expiresIn = opts.expiresIn as SignOptions['expiresIn'];
  }
  const secret = (opts?.secret ?? DEFAULT_SECRET) as string;
  return jwt.sign(payload, secret, options);
}

export function verifyJwt<T extends object = any>(
  token: string,
  secret?: string
): T | null {
  try {
    return jwt.verify(token, secret ?? DEFAULT_SECRET) as T;
  } catch {
    return null;
  }
}
