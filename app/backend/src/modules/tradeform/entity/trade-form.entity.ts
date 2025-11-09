import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { UserEntity } from '@modules/auth/entity/user.entity';
import {
  TradeFormStatus,
  TradeFormChannel,
  TradeFormPaymentMethod,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormIdentityRequirement
} from '../enums/TradeFormEnums';
import { TradeRatingEntity } from '@modules/trade/entity/trade-rating.entity';


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
export class TradeFormEntity {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'varchar', length: 128, unique: true })
  uid!: string;

  @Column({ type: 'varchar', length: 64, name: 'creator_id' })
  creatorId!: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id', referencedColumnName: 'idNumber' })
  creator?: UserEntity | null;

  @Column({ type: 'varchar', length: 64, name: 'counterparty_id', nullable: true })
  counterpartyId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'counterparty_id', referencedColumnName: 'idNumber' })
  counterparty?: UserEntity | null;

  @Column({
    type: 'jsonb',
    name: 'creator_verified_identities',
    default: () => "'[]'"
  })
  creatorVerifiedIdentities!: string[];

  @Column({ type: 'varchar', length: 255, name: 'item_name' })
  itemName!: string;

  @Column({ type: 'text', name: 'item_description' })
  itemDescription!: string;

  @Column({ type: 'varchar', length: 32, name: 'item_condition' })
  itemCondition!: TradeFormItemCondition;

  @Column({ type: 'numeric', precision: 36, scale: 18 })
  amount!: string;

  @Column({ type: 'varchar', length: 64, name: 'trade_channel' })
  tradeChannel!: TradeFormChannel;

  @Column({ type: 'varchar', length: 64, name: 'payment_method' })
  paymentMethod!: TradeFormPaymentMethod;

  @Column({ type: 'varchar', length: 64, name: 'matchmaking_channel' })
  matchmakingChannel!: TradeFormMatchmakingChannel;

  @Column({
    type: 'text',
    array: true,
    name: 'identity_requirements',
    default: () => "'{}'"
  })
  identityRequirements!: TradeFormIdentityRequirement[];

  @Column({
    type: 'integer',
    name: 'user_rating',
    default: 0
  })
  userRating!: number;

  @Column({
    type: 'enum',
    enum: TradeFormStatus,
    enumName: 'trade_forms_status_enum',
    default: TradeFormStatus.PENDING
  })
  status!: TradeFormStatus;

  @Column({
    type: 'jsonb',
    default: () => "'{}'"
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

  @OneToMany(() => TradeRatingEntity, (rating) => rating.trade)
  ratings!: TradeRatingEntity[];

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
