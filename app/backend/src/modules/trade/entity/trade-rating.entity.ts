import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TradeFormEntity } from '@modules/tradeform/entity/trade-form.entity';
import { UserEntity } from '@modules/auth/entity/user.entity';

@Entity('trade_ratings')
@Index(['tradeUid', 'fromIdNumber', 'toIdNumber'], { unique: true })
export class TradeRatingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'trade_uid', type: 'varchar', length: 32 })
  tradeUid!: string;

  @ManyToOne(() => TradeFormEntity, (trade) => trade.ratings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trade_uid', referencedColumnName: 'uid' })
  trade!: TradeFormEntity;

  // 評價人（用 idNumber，跟 trade_forms 一致）
  @Column({ name: 'from_id_number', type: 'varchar', length: 20 })
  fromIdNumber!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_id_number', referencedColumnName: 'idNumber' })
  fromUser!: UserEntity;

  // 被評價人
  @Column({ name: 'to_id_number', type: 'varchar', length: 20 })
  toIdNumber!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_id_number', referencedColumnName: 'idNumber' })
  toUser!: UserEntity;

  @Column({ type: 'int' })
  stars!: number; // 1 ~ 5

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
