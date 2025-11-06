// src/modules/auth/middleware/jwt-auth.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '@modules/auth/jwt';

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
    console.log("JWT Auth Middleware Invoked");
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ error: 'No token' });

  const payload = verifyJwt<any>(token);
  console.log("JWT payload:", payload);
  if (!payload?.sub) return res.status(401).json({ error: 'Invalid token' });

  (req as any).user = payload;
  next();
  
}
