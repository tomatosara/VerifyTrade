// // src/modules/trade/dto/trade-detail.dto.ts
// import {
//   TradeFormMeta
// } from '@modules/tradeform/entity/trade-form.entity';

// import {
//   TradeFormStatus,
//   TradeFormChannel,
//   TradeFormPaymentMethod,
//   TradeFormMatchmakingChannel,
//   TradeFormItemCondition,
//   TradeFormIdentityRequirement,
// } from '@modules/tradeform/enums/TradeFormEnums'
// import { TradeAuditEventDto } from './trade-audit-event.dto';

// export class TradeDetailDto {
//   uid!: string;

//   // basic
//   itemName!: string;
//   itemDescription!: string;
//   amount!: string;
//   itemCondition!: TradeFormItemCondition;
//   status!: TradeFormStatus;

//   // parties
//   creatorId!: string | null;
//   creatorName!: string | null;
//   counterpartyId!: string | null;
//   counterpartyName!: string | null;

//   // trade config
//   tradeChannel!: TradeFormChannel;
//   paymentMethod!: TradeFormPaymentMethod;
//   matchmakingChannel!: TradeFormMatchmakingChannel;
//   identityRequirements!: TradeFormIdentityRequirement[];
//   userRating!: number;

//   // meta
//   meta!: TradeFormMeta;

//   // flags
//   confirmedByUser1!: boolean;
//   confirmedByUser2!: boolean;

//   // timestamps
//   vcVerifiedAt!: string | null;
//   uidExpiresAt!: string | null;
//   finalizedAt!: string | null;
//   createdAt!: string;
//   updatedAt!: string;

//   // history
//   auditEvents!: TradeAuditEventDto[];
// }


// src/modules/trade/dto/trade-detail.dto.ts

import { TradeAuditEventDto } from './trade-audit-event.dto';

/**
 * API 專用 enum / union types
 *（不要再從 entity 或其他 enums import，避免 tsoa 解析問題）
 */

export type TradeFormStatusDto =
  | 'draft'
  | 'pending'
  | 'verified'
  | 'confirmed'
  | 'cancelled'
  | 'failed'
  | 'done';

export type TradeFormItemConditionDto = 'new' | 'used_like_new' | 'used';

export type TradeFormChannelDto = 'p2p' | 'escrow';

export type TradeFormPaymentMethodDto = 'bank_transfer' | 'cash';

export type TradeFormMatchmakingChannelDto = 'in_app' | 'line' | 'telegram';

export type TradeFormIdentityRequirementDto = string;

export class TradeDetailDto {
  uid!: string;

  // basic
  itemName!: string;
  itemDescription!: string;
  amount!: string;
  itemCondition!: TradeFormItemConditionDto;
  status!: TradeFormStatusDto;

  // parties
  creatorId!: string | null;
  creatorName!: string | null;
  counterpartyId!: string | null;
  counterpartyName!: string | null;

  // trade config
  tradeChannel!: TradeFormChannelDto;
  paymentMethod!: TradeFormPaymentMethodDto;
  matchmakingChannel!: TradeFormMatchmakingChannelDto;
  identityRequirements!: TradeFormIdentityRequirementDto[];
  userRating!: number;

  // meta：tsoa 對 Record<> 支援有坑，直接用 any / object
  meta!: any;

  // flags
  confirmedByUser1!: boolean;
  confirmedByUser2!: boolean;

  // timestamps (ISO string)
  vcVerifiedAt!: string | null;
  uidExpiresAt!: string | null;
  finalizedAt!: string | null;
  createdAt!: string;
  updatedAt!: string;

  // history
  auditEvents!: TradeAuditEventDto[];
}
