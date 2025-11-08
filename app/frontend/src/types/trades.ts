// src/types/trade.ts
export type TradeStatus =
  | 'draft'
  | 'pending'
  | 'verified'
  | 'confirmed'
  | 'cancelled'
  | 'failed'
  | 'done';

export interface TradeSummary {
  uid: string;
  itemName: string;
  amount: string;
  status: TradeStatus;
  tradeChannel: string;
  paymentMethod: string;
  createdAt: string;
  finalizedAt: string | null;
  creatorName: string | null;
  counterpartyName: string | null;
  stars?: number | null;
}

export type TradeAuditAction =
  | 'create'
  | 'verifyVC'
  | 'confirm'
  | 'cancel'
  | 'finalize'
  | 'fail'
  | 'retry';

export interface TradeAuditEvent {
  id: string;
  action: TradeAuditAction;
  at: string;
  actorId: string | null;
  actorName: string | null;
  details: Record<string, unknown> | null;
}

export interface TradeDetail {
  uid: string;
  itemName: string;
  itemDescription: string;
  amount: string;
  itemCondition: string;
  status: TradeStatus;

  creatorId: string | null;
  creatorName: string | null;
  counterpartyId: string | null;
  counterpartyName: string | null;

  tradeChannel: string;
  paymentMethod: string;
  matchmakingChannel: string;
  identityRequirements: string[];
  userRating: number;

  meta: Record<string, unknown>;
  confirmedByUser1: boolean;
  confirmedByUser2: boolean;

  vcVerifiedAt: string | null;
  uidExpiresAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;

  auditEvents: TradeAuditEvent[];
}
