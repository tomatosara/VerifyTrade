import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'idempotency_keys' })
@Index('UQ_idempotency_key', ['key'], { unique: true })
export class IdempotencyKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  key!: string;

  @Column({ type: 'varchar', length: 256 })
  route!: string;

  @Column({ type: 'uuid' })
  actorId!: string;

  @Column({ type: 'integer' })
  statusCode!: number;

  @Column({ type: 'jsonb' })
  responseBody!: unknown;

  @Column({ type: 'varchar', length: 128 })
  resultHash!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Date;
}
