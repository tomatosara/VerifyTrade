// src/modules/auth/middleware/jwt-auth.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '@modules/auth/jwt';

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  console.log("JWT Auth Middleware Invoked");

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader.startsWith('JWT ')
    ? authHeader.slice(4)
    : authHeader; // fallback，直接當 token 用
    console.log("Authorization header:", req.headers.authorization);
    console.log("Token extracted:", token);

  const payload = verifyJwt<any>(token);
  console.log("JWT payload:", payload);
  if (!payload?.sub) return res.status(401).json({ error: 'Invalid token' });

  (req as any).user = payload;
  next();
}
