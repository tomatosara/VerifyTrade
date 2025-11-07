import type { TradeFormStatus } from '../enums/TradeFormEnums';
import type { TradeFormResponse } from './trade-form.response';

export interface VerifyVcRequestDto {
  vcProof: unknown;
}

export interface VerifyVcResponseDto {
  valid: boolean;
  reason?: string;
  code?: string;
  matched?: {
    claims: string[];
    issuer?: string;
    credentialType?: string;
    level?: number;
    expiresAt?: string;
  };
  status: TradeFormStatus;
  trade?: TradeFormResponse;
}

export interface ConfirmTradeResponseDto {
  trade: TradeFormResponse;
}
