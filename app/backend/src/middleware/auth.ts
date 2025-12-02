// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@modules/auth/entity/user.entity';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '@database/data-source';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { validate as validateUuid } from 'uuid';
import { getSecurityConfig } from '@config/security';

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

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { jwtSecret } = getSecurityConfig();
    const payload = jwt.verify(token, jwtSecret) as any;
    const userRepo = AppDataSource.getRepository(UserEntity);

    const isValidUuid = typeof payload.id === 'string' && validateUuid(payload.id);
    let user: UserEntity | null = null;

    if (isValidUuid) {
      user = await userRepo.findOne({ where: { id: payload.id } });
    }

    if (!user && payload.idNumber) {
      user = await userRepo.findOne({ where: { idNumber: payload.idNumber } });
    }

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = {
      id: user.id,
      sub: payload.sub,
      idNumber: user.idNumber,
      role: payload.role,
      name: payload.name ?? user.name,
      birthday: payload.birthday ?? user.birthday
    };
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
