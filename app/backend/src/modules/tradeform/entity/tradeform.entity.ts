import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';

export const tradeStatusValues = [
  'draft',
  'pending',
  'verified',
  'confirmed',
  'cancelled',
  'failed',
  'done'
] as const;

export type TradeFormStatus = (typeof tradeStatusValues)[number];

export const auditActionValues = [
  'create',
  'verifyVC',
  'confirm',
  'cancel',
  'finalize',
  'fail',
  'retry'
] as const;

export type AuditAction = (typeof auditActionValues)[number];

export interface AuditEvent {
  id: string;
  tradeUid: string;
  actorId: string;
  action: AuditAction;
  at: string;
  details?: Record<string, unknown> | null;
}

@Entity({ name: 'trade_forms' })
@Index('IDX_trade_forms_status_active', ['status'])
export class TradeFormEntity {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  uid!: string;

  @Column({ type: 'uuid', name: 'creator_id' })
  creatorId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'counterparty_id' })
  counterpartyId!: string | null;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  amount!: string | null;

  @Column({
    type: 'enum',
    enum: tradeStatusValues,
    default: 'pending'
  })
  status!: TradeFormStatus;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  meta!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'[]'" , name: 'audit_log'})
  auditLog!: AuditEvent[];

  @Column({ type: 'boolean', default: false, name: 'confirmed_by_user1' })
  confirmedByUser1!: boolean;

  @Column({ type: 'boolean', default: false, name: 'confirmed_by_user2' })
  confirmedByUser2!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'vc_verified_at' })
  vcVerifiedAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'uid_expires_at' })
  uidExpiresAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'finalized_at' })
  finalizedAt!: Date | null;

  @Column({ type: 'integer', default: 0, name: 'finalize_attempts' })
  finalizeAttempts!: number;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'finalize_failed_at' })
  finalizeFailedAt!: Date | null;

  @Column({ type: 'text', nullable: true, name: 'finalize_error' })
  finalizeError!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
