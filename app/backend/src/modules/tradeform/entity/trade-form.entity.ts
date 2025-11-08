import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { UserEntity } from '@modules/auth/entity/user.entity';

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

export interface TradeFormIdentityRequirementsMeta {
  requiredClaims?: string[];
  allowedIssuers?: string[];
  credentialTypes?: string[];
  minLevel?: number;
  [key: string]: unknown;
}

export interface TradeFormVCUser2Meta {
  valid: boolean;
  at: string;
  claimsMatched?: string[];
  issuer?: string;
  credentialType?: string;
  level?: number;
  reason?: string;
  expiresAt?: string;
  rawRef?: string;
  [key: string]: unknown;
}

export type TradeFormMeta = {
  identity_requirements?: TradeFormIdentityRequirementsMeta;
  vc_user2?: TradeFormVCUser2Meta;
  [key: string]: unknown;
};

@Entity({ name: 'trade_forms' })
@Check('CHK_trade_forms_user_rating_range', '"user_rating" BETWEEN 1 AND 5')
export class TradeFormEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('UQ_trade_forms_uid_unique', { unique: true })
  @Column({ type: 'varchar', length: 32, unique: true })
  uid!: string;

  @Index('IDX_trade_forms_creator_id')
  @Column({ type: 'uuid', name: 'creator_id', nullable: true })
  creatorId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id' })
  creator?: UserEntity | null;

  @Index('IDX_trade_forms_counterparty_id')
  @Column({ type: 'uuid', name: 'counterparty_id', nullable: true })
  counterpartyId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'counterparty_id' })
  counterparty?: UserEntity | null;

  @Column({
    type: 'jsonb',
    name: 'creator_verified_identities',
    default: () => "'[]'::jsonb"
  })
  creatorVerifiedIdentities!: string[];

  @Column({ type: 'varchar', length: 160, name: 'item_name' })
  itemName!: string;

  @Column({ type: 'text', name: 'item_description' })
  itemDescription!: string;

  @Index('IDX_trade_forms_item_condition')
  @Column({
    type: 'enum',
    enum: TradeFormItemCondition,
    enumName: 'trade_forms_item_condition_enum',
    name: 'item_condition'
  })
  itemCondition!: TradeFormItemCondition;

  @Column({ type: 'varchar', length: 64 })
  amount!: string;

  @Index('IDX_trade_forms_trade_channel')
  @Column({
    type: 'enum',
    enum: TradeFormChannel,
    enumName: 'trade_forms_channel_enum',
    name: 'trade_channel'
  })
  tradeChannel!: TradeFormChannel;

  @Index('IDX_trade_forms_payment_method')
  @Column({
    type: 'enum',
    enum: TradeFormPaymentMethod,
    enumName: 'trade_forms_payment_method_enum',
    name: 'payment_method'
  })
  paymentMethod!: TradeFormPaymentMethod;

  @Column({
    type: 'enum',
    enum: TradeFormMatchmakingChannel,
    enumName: 'trade_forms_matchmaking_channel_enum',
    name: 'matchmaking_channel'
  })
  matchmakingChannel!: TradeFormMatchmakingChannel;

  @Column({
    type: 'enum',
    enum: TradeFormIdentityRequirement,
    array: true,
    enumName: 'trade_forms_identity_requirement_enum',
    name: 'identity_requirements',
    default: () => "'{}'::\"public\".\"trade_forms_identity_requirement_enum\"[]"
  })
  identityRequirements!: TradeFormIdentityRequirement[];

  @Column({
    type: 'integer',
    name: 'user_rating'
  })
  userRating!: number;

  @Index('IDX_trade_forms_status_pending')
  @Column({
    type: 'enum',
    enum: TradeFormStatus,
    enumName: 'trade_forms_status_enum',
    default: TradeFormStatus.PENDING
  })
  status!: TradeFormStatus;

  @Column({
    type: 'jsonb',
    default: () => "'{}'::jsonb"
  })
  meta!: TradeFormMeta;

  @Column({ type: 'boolean', name: 'confirmed_by_user1', default: false })
  confirmedByUser1!: boolean;

  @Column({ type: 'boolean', name: 'confirmed_by_user2', default: false })
  confirmedByUser2!: boolean;

  @Column({ type: 'timestamp with time zone', name: 'vc_verified_at', nullable: true })
  vcVerifiedAt!: Date | null;

  @Column({ type: 'timestamp with time zone', name: 'uid_expires_at', nullable: true })
  uidExpiresAt!: Date | null;

  @Column({ type: 'timestamp with time zone', name: 'finalized_at', nullable: true })
  finalizedAt!: Date | null;

  @Column({ type: 'integer', name: 'finalize_attempts', default: 0 })
  finalizeAttempts!: number;

  @Column({ type: 'timestamp with time zone', name: 'finalize_failed_at', nullable: true })
  finalizeFailedAt!: Date | null;

  @Column({ type: 'text', name: 'finalize_error', nullable: true })
  finalizeError!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}

export type TradeFormEnums =
  | TradeFormItemCondition
  | TradeFormChannel
  | TradeFormPaymentMethod
  | TradeFormMatchmakingChannel
  | TradeFormIdentityRequirement
  | TradeFormStatus;
