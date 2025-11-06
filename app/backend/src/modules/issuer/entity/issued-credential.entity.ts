import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('issued_credential')
export class IssuedCredential {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })   
  transactionId!: string;

  @Column({ type: 'text', nullable: true })
  credentialJwt?: string; // JWT

  @Index()
  @Column({ type: 'varchar', length: 128, nullable: true })
  cid?: string;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
