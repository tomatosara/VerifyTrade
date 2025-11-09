// src/models/enums/TradeFormEnums.ts

export enum TradeFormItemCondition {
  NEW = 'new',
  USED_LIKE_NEW = 'used_like_new',
  USED = 'used'
}

export enum TradeFormChannel {
  P2P = 'p2p',
  ESCROW = 'escrow'
}

export enum TradeFormPaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash'
}

export enum TradeFormMatchmakingChannel {
  IN_APP = 'in_app',
  LINE = 'line',
  TELEGRAM = 'telegram'
}

export type TradeFormIdentityRequirement = string;

export const IDENTITY_REQUIREMENT_PATTERN = /^[a-z0-9_]+$/;

export enum TradeFormStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  VERIFIED = 'verified',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  DONE = 'done'
}
