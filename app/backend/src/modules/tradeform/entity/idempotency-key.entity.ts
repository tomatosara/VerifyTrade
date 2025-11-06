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

  @Column({ type: 'uuid', name: 'actor_id' })
  actorId!: string;

  @Column({ type: 'integer', name: 'status_code' })
  statusCode!: number;

  @Column({ type: 'jsonb', name: 'response_body' })
  responseBody!: unknown;

  @Column({ type: 'varchar', length: 128, name: 'result_hash' })
  resultHash!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp with time zone', name: 'expires_at' })
  expiresAt!: Date;
}
