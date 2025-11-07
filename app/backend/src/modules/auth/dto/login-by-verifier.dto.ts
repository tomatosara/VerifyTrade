// src/modules/auth/dto/login-by-verifier.dto.ts
import { z } from 'zod';

export const LoginByVerifierRequestSchema = z.object({
  transactionId: z.string().min(1),
});

export type LoginByVerifierRequest = {
  transactionId: string;
}

export type LoginResponse = {
  accessToken: string;
  expiresIn: string; // e.g. '15m'
};

export type RefreshResponse = {
  accessToken: string;
  expiresIn: string; // e.g. '15m'
};

export type LogoutResponse = { success: true };
