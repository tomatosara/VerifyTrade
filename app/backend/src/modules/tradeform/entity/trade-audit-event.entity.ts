import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { TradeFormEntity } from './trade-form.entity';

export enum TradeAuditAction {
  CREATE = 'create',
  VERIFY_VC = 'verifyVC',
  CONFIRM = 'confirm',
  CANCEL = 'cancel',
  FINALIZE = 'finalize',
  FAIL = 'fail',
  RETRY = 'retry'
}

@Entity({ name: 'trade_audit_events' })
export class TradeAuditEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, name: 'trade_uid' })
  tradeUid!: string;

  @ManyToOne(() => TradeFormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trade_uid', referencedColumnName: 'uid' })
  trade?: TradeFormEntity;

  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actorId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor?: UserEntity | null;

  @Column({
    type: 'enum',
    enum: TradeAuditAction,
    enumName: 'trade_audit_events_action_enum'
  })
  action!: TradeAuditAction;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'at' })
  at!: Date;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;
}
