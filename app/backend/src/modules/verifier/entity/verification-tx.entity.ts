import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

export enum VerificationTxKind {
  VERIFIER = 'verifier'
}

export enum VerificationTxStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

@Entity({ name: 'verification_tx' })
export class VerificationTx {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('UQ_verification_tx_transaction_id', { unique: true })
  @Column({ type: 'varchar', length: 64, name: 'transaction_id' })
  transactionId!: string;

  @Column({
    type: 'enum',
    enum: VerificationTxKind,
    enumName: 'verification_tx_kind_enum',
    default: VerificationTxKind.VERIFIER,
    name: 'kind'
  })
  kind!: VerificationTxKind;

  @Column({ type: 'varchar', nullable: true, name: 'ref' })
  ref?: string | null;

  @Column({
    type: 'enum',
    enum: VerificationTxStatus,
    enumName: 'verification_tx_status_enum',
    default: VerificationTxStatus.PENDING,
    name: 'status'
  })
  status!: VerificationTxStatus;

  @Column({ type: 'jsonb', nullable: true, name: 'result_json' })
  resultJson?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
