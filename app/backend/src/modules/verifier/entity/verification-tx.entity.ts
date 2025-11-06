import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('verification_tx')
export class VerificationTx {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })   // << 明確指定
  transactionId!: string;

  @Column({ type: 'varchar', default: 'verifier' })
  kind!: 'verifier';

  @Column({ type: 'varchar', nullable: true })
  ref?: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: 'pending' | 'success' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  resultJson?: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
