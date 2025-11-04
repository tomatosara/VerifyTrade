import { z } from 'zod';
import type { UserRole } from '../entity/user.entity';

export interface DevTokenRequest {
  userId: string;
  role?: UserRole;
  email?: string;
  name?: string;
}

export const DevTokenRequestSchema: z.ZodType<DevTokenRequest> = z
  .object({
    userId: z.string().uuid('userId must be a valid UUID'),
    role: z.enum(['user', 'platform']).default('user').optional(),
    email: z.string().email().optional(),
    name: z.string().optional()
  })
  .strict();

export interface DevTokenResponse {
  token: string;
  expiresIn: string;
  role: UserRole;
}
