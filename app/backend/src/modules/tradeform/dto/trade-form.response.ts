import {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod,
  TradeFormStatus
} from '../enums/TradeFormEnums';
import {TradeFormMeta} from '../entity/trade-form.entity' 

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
  vcVerifiedAt: Date | null;
  uidExpiresAt: Date | null;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeFormPublicResponse {
  uid: string;
  status: TradeFormStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type TradeFormViewMode = 'participant' | 'limited';

export interface TradeFormViewResponse {
  view: TradeFormViewMode;
  trade: TradeFormResponse | TradeFormPublicResponse;
}
