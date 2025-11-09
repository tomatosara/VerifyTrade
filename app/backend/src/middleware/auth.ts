// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@modules/auth/entity/user.entity';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    sub: string;
    idNumber: string;
    role: UserRole;
    name: string;
    birthday?: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      id: payload.id,
      sub: payload.sub,
      idNumber: payload.idNumber,
      role: payload.role,
      name: payload.name,
      birthday: payload.birthday
    };
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
