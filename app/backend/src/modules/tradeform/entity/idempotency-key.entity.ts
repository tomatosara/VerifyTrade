import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { UserEntity } from '@modules/auth/entity/user.entity';

@Entity({ name: 'idempotency_keys' })
@Index('UQ_idempotency_key', ['key'], { unique: true })
export class IdempotencyKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128 })
  key!: string;

  @Column({ type: 'varchar', length: 256 })
  route!: string;

  @Index('IDX_idempotency_actor')
  @Column({ type: 'uuid', name: 'actor_id' })
  actorId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_id' })
  actor?: UserEntity;

  @Column({ type: 'integer', name: 'status_code' })
  statusCode!: number;

  @Column({ type: 'jsonb', name: 'response_body', nullable: true })
  responseBody!: unknown | null;

  @Column({ type: 'varchar', length: 128, name: 'result_hash' })
  resultHash!: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp with time zone', name: 'expires_at' })
  expiresAt!: Date;
}
