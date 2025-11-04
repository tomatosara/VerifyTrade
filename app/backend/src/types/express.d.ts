import type { UserRole } from '@modules/auth/entity/user.entity';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
    }

    interface Request {
      user?: User;
      requestId?: string;
      idempotencyKey?: string;
    }
  }
}

export {};
