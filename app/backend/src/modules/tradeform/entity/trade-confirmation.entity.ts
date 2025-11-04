import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type TradeConfirmationRole = 'user1' | 'user2';

@Entity({ name: 'trade_confirmations' })
@Index('UQ_trade_confirm_unique_actor', ['tradeUid', 'actorId'], { unique: true })
@Index('IDX_trade_confirm_trade_uid', ['tradeUid'])
export class TradeConfirmationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, name: 'trade_uid' })
  tradeUid!: string;

  @Column({ type: 'uuid', name: 'actor_id' })
  actorId!: string;

  @Column({
    type: 'enum',
    enum: ['user1', 'user2']
  })
  role!: TradeConfirmationRole;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'confirmed_at' })
  confirmedAt!: Date;
}
