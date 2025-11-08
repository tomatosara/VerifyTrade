// src/modules/auth/entity/user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
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
    enumName: 'user_role_enum',
    default: 'user',
    name: 'role'
  })
  role!: UserRole;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'id_number' })
  idNumber!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'birthday' })
  birthday!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'address' })
  address!: string | null;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: () => '3.00',
    name: 'score'
  })
  score!: number;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
