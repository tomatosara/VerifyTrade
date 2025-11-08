import type { UserRole } from '@modules/auth/entity/user.entity';
import type {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormMeta,
  TradeFormPaymentMethod,
  TradeFormStatus
} from '@modules/tradeform/entity/trade-form.entity';
import type { TradeAuditAction } from '@modules/tradeform/entity/trade-audit-event.entity';

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
  creatorId: string | null;
  counterpartyId: string | null;
  creatorVerifiedIdentities: string[];
  itemName: string;
  itemDescription: string;
  itemCondition: TradeFormItemCondition;
  amount: string;
  tradeChannel: TradeFormChannel;
  paymentMethod: TradeFormPaymentMethod;
  matchmakingChannel: TradeFormMatchmakingChannel;
  identityRequirements: TradeFormIdentityRequirement[];
  userRating: number;
  status: TradeFormStatus;
  meta: TradeFormMeta;
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
  action: TradeAuditAction;
  at: Date;
  details: Record<string, unknown> | null;
}

export interface TradeSeed {
  key: string;
  record: TradeRecordSeed;
  auditEvents: AuditEventSeed[];
}

export interface SeedSummary {
  profile: SeedProfile;
  users: number;
  tradeForms: number;
  auditEvents: number;
}
