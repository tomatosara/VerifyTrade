// src/types/tradeForm.ts

export type TradeFormItemCondition = 'new' | 'used_like_new' | 'used';
export type TradeFormChannel = 'p2p' | 'escrow';
export type TradeFormPaymentMethod = 'bank_transfer' | 'cash';
export type TradeFormMatchmakingChannel = 'in_app' | 'line' | 'telegram';
export type TradeFormIdentityRequirement = string;
export type TradeFormStatus =
  | 'draft'
  | 'pending'
  | 'verified'
  | 'confirmed'
  | 'cancelled'
  | 'failed'
  | 'done';

export type TradeFormMeta = Record<string, unknown>;

export interface TradeFormCreate {
  uid: string;
  creatorId: string;
  creatorVerifiedIdentities?: string[];
  itemName: string;
  itemDescription: string;
  itemCondition: TradeFormItemCondition;
  amount: string;
  tradeChannel: TradeFormChannel;
  paymentMethod: TradeFormPaymentMethod;
  matchmakingChannel: TradeFormMatchmakingChannel;
  identityRequirements: TradeFormIdentityRequirement[];
}

export type TradeFormDraft = Omit<TradeFormCreate, "uid" | "creatorId">;

export interface TradeFormErrors {
  itemName?: string;
  itemDescription?: string;
  itemCondition?: string;
  amount?: string;
  tradeChannel?: string;
  paymentMethod?: string;
  matchmakingChannel?: string;
  identityRequirements?: string;
}

export interface TradeFormResponse {
  id: number;
  uid: string;
  creatorId: string;
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
  vcVerifiedAt: string | null;
  uidExpiresAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const emptyTradeForm: TradeFormDraft = {
  creatorVerifiedIdentities: [],
  itemName: '',
  itemDescription: '',
  itemCondition: 'new',
  amount: '',
  tradeChannel: 'p2p',
  paymentMethod: 'cash',
  matchmakingChannel: 'in_app',
  identityRequirements: [],
};

export const emptyTradeFormErrors: TradeFormErrors = {};

export interface TradeFormPublicResponse {
  uid: string;
  creatorId: string;
  status: TradeFormStatus;
  createdAt: string;
  updatedAt: string;
}

export type TradeFormViewMode = 'participant' | 'limited';

export interface TradeFormViewResponse {
  view: TradeFormViewMode;
  trade: TradeFormResponse | TradeFormPublicResponse;
}

export interface TradeFormComfirm {
  counterpartyId: string;
}

