// src/database/seed/factories/users.factory.ts
import { UserRole } from '@modules/auth/entity/user.entity';
import type { SeedProfile, UserSeed } from '../types';

interface UserBlueprint {
  key: string;
  id: string;
  idNumber: string;
  name: string;
  birthday: string;
  role: UserRole;
  address: string;
  createdAt: string;
  updatedAt: string;
}

const devUsers: UserBlueprint[] = [
  {
    key: 'alice',
    id: '5d466f8d-67fd-4eef-90d4-1f7502c4d1f2',
    idNumber: 'A123456789',
    name: 'Alice Rivers',
    birthday: '0920502',
    address: '123 Main St, Taipei',
    role: 'user',
    createdAt: '2024-04-10T08:00:00.000Z',
    updatedAt: '2024-05-07T09:30:00.000Z',
  },
  {
    key: 'bob',
    id: 'e641706c-97ee-402d-908a-5c2fc36505f3',
    idNumber: "B123456781",
    name: 'Bob Markets',
    birthday: '0920502',
    address: '123 Main St, Taipei',
    role: 'user',
    createdAt: '2024-04-12T10:30:00.000Z',
    updatedAt: '2024-05-06T13:45:00.000Z'
  },
  {
    key: 'platform',
    id: 'fbcf2f44-cb2a-4a00-aea4-9ddb051a6e78',
    name: 'Platform Operations',
    idNumber: "C123456781",
    birthday: '0920502',
    address: '123 Main St, Taipei',
    role: 'platform',
    createdAt: '2024-04-01T09:00:00.000Z',
    updatedAt: '2024-05-07T09:45:00.000Z'
  }
];

const testUsers: UserBlueprint[] = [
  {
    key: 'creator',
    id: '0f4d8ae2-7d36-4f14-b7a4-eab1c1764d9d',
    name: 'Test Creator',
    idNumber: "D123456781",
    birthday: '0920502',
    address: '123 Main St, Taipei',
    role: 'user',
    createdAt: '2024-01-10T09:00:00.000Z',
    updatedAt: '2024-01-12T12:05:00.000Z'
  },
  {
    key: 'counterparty',
    id: '2f1c36d0-b7fc-4e6c-9e15-231a6d36bbfc',
    idNumber: "E123456781",
    name: 'Test Counterparty',
    birthday: '0920502',
    address: '123 Main St, Taipei',
    role: 'user',
    createdAt: '2024-01-10T09:30:00.000Z',
    updatedAt: '2024-01-12T12:10:00.000Z'
  },
  {
    key: 'platform',
    id: '603d2fa6-9026-4b1f-a0fd-51ac3aaee47a',
    idNumber: "F123456781",
    name: 'Test Platform Ops',
    birthday: '0920502',
    address: '123 Main St, Taipei',
    role: 'platform',
    createdAt: '2024-01-05T08:45:00.000Z',
    updatedAt: '2024-01-12T12:15:00.000Z'
  }
];

const userBlueprints: Record<SeedProfile, UserBlueprint[]> = {
  dev: devUsers,
  test: testUsers
};

export function buildUserSeeds(profile: SeedProfile): UserSeed[] {
  return userBlueprints[profile].map((user) => ({
    key: user.key,
    id: user.id,
    role: user.role,
    birthday: user.birthday,
    address: user.address,
    idNumber: user.idNumber,
    name: user.name,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt)
  }));
}
