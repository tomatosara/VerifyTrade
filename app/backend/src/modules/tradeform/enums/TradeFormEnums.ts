// src/models/enums/TradeFormEnums.ts

export enum TradeFormItemCondition {
  SECOND_HAND = 'SECOND_HAND',
  LIKE_NEW = 'LIKE_NEW',
  BRAND_NEW = 'BRAND_NEW'
}

export enum TradeFormChannel {
  IN_PERSON = 'IN_PERSON',
  CONVENIENCE_STORE_DELIVERY = 'CONVENIENCE_STORE_DELIVERY',
  POST_OFFICE = 'POST_OFFICE',
  COURIER = 'COURIER',
  OTHER = 'OTHER'
}

export enum TradeFormPaymentMethod {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  LINE_PAY = 'LINE_PAY',
  CRYPTO = 'CRYPTO'
}

export enum TradeFormMatchmakingChannel {
  OFFLINE_AGREEMENT = 'OFFLINE_AGREEMENT',
  SOCIAL_PLATFORM = 'SOCIAL_PLATFORM',
  ONLINE_MARKETPLACE = 'ONLINE_MARKETPLACE'
}

export enum TradeFormIdentityRequirement {
  STUDENT_ID = 'STUDENT_ID',
  EMPLOYEE_ID = 'EMPLOYEE_ID',
  DIETITIAN_LICENSE = 'DIETITIAN_LICENSE',
  LAWYER_LICENSE = 'LAWYER_LICENSE',
  PROOF_OF_ORIGIN = 'PROOF_OF_ORIGIN'
}

export enum TradeFormStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  VERIFIED = 'verified',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  DONE = 'done'
}
