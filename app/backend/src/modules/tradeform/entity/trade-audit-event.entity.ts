import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuditAction, TradeFormEntity } from './tradeform.entity';

@Entity({ name: 'trade_audit_events' })
@Index('IDX_trade_audit_trade_uid', ['tradeUid'])
@Index('IDX_trade_audit_actor', ['actorId'])
@Index('IDX_trade_audit_action', ['action'])
export class TradeAuditEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, name: 'trade_uid' })
  tradeUid!: string;

  @ManyToOne(() => TradeFormEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trade_uid', referencedColumnName: 'uid' })
  tradeForm?: TradeFormEntity;

  @Column({ type: 'uuid', name: 'actor_id' })
  actorId!: string;

  @Column({
    type: 'enum',
    enum: ['create', 'verifyVC', 'confirm', 'cancel', 'finalize', 'fail', 'retry']
  })
  action!: AuditAction;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  at!: Date;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;
}
