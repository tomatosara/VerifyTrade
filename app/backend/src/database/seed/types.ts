import type { AuditAction, AuditEvent, TradeFormStatus } from '@modules/tradeform/entity/tradeform.entity';
import type { TradeConfirmationRole } from '@modules/tradeform/entity/trade-confirmation.entity';
import type { UserRole } from '@modules/auth/entity/user.entity';

export type SeedProfile = 'dev' | 'test';

export interface UserSeed {
  key: string;
  id: string;
  idNumber: string;
  birthday: string;
  address: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeRecordSeed {
  uid: string;
  creatorId: string;
  counterpartyId: string | null;
  title: string;
  description: string;
  amount: string | null;
  status: TradeFormStatus;
  meta: Record<string, unknown>;
  auditLog: AuditEvent[];
  confirmedByUser1: boolean;
  confirmedByUser2: boolean;
  vcVerifiedAt: Date | null;
  uidExpiresAt: Date | null;
  finalizedAt: Date | null;
  finalizeAttempts: number;
  finalizeFailedAt: Date | null;
  finalizeError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEventSeed {
  id: string;
  tradeUid: string;
  actorId: string;
  action: AuditAction;
  at: Date;
  details: Record<string, unknown> | null;
}

export interface ConfirmationSeed {
  id: string;
  tradeUid: string;
  actorId: string;
  role: TradeConfirmationRole;
  confirmedAt: Date;
}

export interface TradeSeed {
  key: string;
  record: TradeRecordSeed;
  auditEvents: AuditEventSeed[];
  confirmations: ConfirmationSeed[];
}

export interface SeedSummary {
  profile: SeedProfile;
  users: number;
  tradeForms: number;
  auditEvents: number;
  confirmations: number;
}
