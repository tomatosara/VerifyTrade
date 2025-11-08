import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'issued_credentials' })
export class IssuedCredential {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('UQ_issued_credentials_transaction_id', { unique: true })
  @Column({ type: 'varchar', length: 64, name: 'transaction_id' })
  transactionId!: string;

  @Column({ type: 'text', nullable: true, name: 'credential_jwt' })
  credentialJwt?: string | null; // JWT

  @Index('IDX_issued_credentials_cid')
  @Column({ type: 'varchar', length: 128, nullable: true, name: 'cid' })
  cid?: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => "'{}'::jsonb",
    name: 'meta'
  })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
