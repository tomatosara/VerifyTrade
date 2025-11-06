// src/modules/auth/entity/user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'user' | 'platform';

@Entity({ name: 'users' })
@Index('UQ_users_id_number', ['idNumber'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({
    type: 'enum',
    enum: ['user', 'platform'],
    default: 'user',
  })
  role!: UserRole;

  @Column({ type: 'varchar', length: 20, unique: true })
  idNumber!: string;        // 不應為 null，改成必填

  @Column({ type: 'varchar', length: 20, nullable: true })
  birthday!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  address!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 3.0 })
  score: number;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
