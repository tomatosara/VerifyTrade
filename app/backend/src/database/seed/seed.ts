import '@config/env';
import { In, QueryDeepPartialEntity } from 'typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { dbConfig } from '@config/db';
import { AppDataSource } from '@database/data-source';
import { logger } from '@utils/logger';
import { clearAllForSeed } from './utils/clear';
import { UserEntity, type UserRole } from '@modules/auth/entity/user.entity';
import {
  TradeFormChannel,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod,
  TradeFormStatus
} from '@modules/tradeform/enums/TradeFormEnums';
import {
  TradeFormEntity,
  type TradeFormMeta
} from '@modules/tradeform/entity/trade-form.entity';

type SeedProfile = 'dev' | 'test';

interface SeedSummary {
  profile: SeedProfile;
  users: number;
  tradeForms: number;
  auditEvents: number;
}

interface RunSeedOptions {
  dataSource?: DataSource;
  manageConnection?: boolean;
}

interface SeededUserInfo {
  id: string;
  idNumber: string;
  name: string;
  role: UserRole;
}

interface UserSeedInput {
  key: string;
  name: string;
  idNumber: string;
  role: UserRole;
  birthday?: string;
  address?: string;
}

interface TradeSeed {
  uid: string;
  creatorId: string;
  counterpartyId: string | null;
  creatorVerifiedIdentities: string[];
  itemName: string;
  itemDescription: string;
  itemCondition: TradeFormItemCondition;
  amount: string;
  tradeChannel: TradeFormChannel;
  paymentMethod: TradeFormPaymentMethod;
  matchmakingChannel: TradeFormMatchmakingChannel;
  identityRequirements: string[];
  userRating: number;
  status: TradeFormStatus;
  meta: TradeFormMeta;
  confirmedByUser1: boolean;
  confirmedByUser2: boolean;
  vcVerifiedAt: Date | null;
  uidExpiresAt: Date | null;
  finalizedAt: Date | null;
  finalizeAttempts: number;
  finalizeFailedAt: Date | null;
  finalizeError: string | null;
}

const profile: SeedProfile = (process.env.SEED_PROFILE as SeedProfile | undefined) ?? 'dev';

const userSeeds: UserSeedInput[] = [
  {
    key: 'alice',
    name: 'Alice Chen',
    idNumber: 'A123456789',
    role: 'user',
    birthday: '1990-01-01',
    address: 'Taipei City'
  },
  {
    key: 'bob',
    name: 'Bob Lin',
    idNumber: 'B987654321',
    role: 'user',
    birthday: '1988-12-02',
    address: 'Taichung City'
  },
  {
    key: 'platform',
    name: 'Platform Operator',
    idNumber: 'PLATFORM',
    role: 'platform',
    birthday: '2000-01-01',
    address: 'Tainan City'
  }
];

function logDataSourceDetails(dataSource: DataSource): void {
  const options = dataSource.options as SeedConnectionOptions;
  logger.info(
    {
      connection: {
        host: dbConfig.connectionInfo.host,
        port: dbConfig.connectionInfo.port,
        database: dbConfig.connectionInfo.database,
        schema: options.schema ?? 'public',
        searchPath: options.searchPath ?? options.schema ?? 'public'
      },
      entities: dataSource.entityMetadatas.map((meta) => meta.name),
      migrations: dataSource.migrations.map((migration) => migration.name)
    },
    'initializing data source for seed'
  );
}

type SeedConnectionOptions = PostgresConnectionOptions & { searchPath?: string };

async function ensureSchema(dataSource: DataSource): Promise<void> {
  if (dataSource.migrations.length > 0) {
    const applied = await dataSource.runMigrations();
    if (applied.length) {
      logger.info(
        { migrations: applied.map((migration) => migration.name) },
        'applied pending migrations'
      );
    } else {
      logger.info('no pending migrations');
    }
    return;
  }

  logger.warn('no migrations found; running synchronize() to prepare schema for seed');
  await dataSource.synchronize();
}

async function seedUsers(manager: EntityManager): Promise<Record<string, SeededUserInfo>> {
  const userRepo = manager.getRepository(UserEntity);
  const seedsWithoutKey = userSeeds.map(({ key, ...rest }) => rest);

  await userRepo.upsert(seedsWithoutKey, ['idNumber']);

  const persisted = await userRepo.find({
    where: {
      idNumber: In(userSeeds.map((user) => user.idNumber))
    }
  });

  const byKey: Record<string, SeededUserInfo> = {};
  for (const seed of userSeeds) {
    const entity = persisted.find((user) => user.idNumber === seed.idNumber);
    if (!entity) {
      continue;
    }
    byKey[seed.key] = {
      id: entity.id,
      idNumber: entity.idNumber,
      name: entity.name,
      role: entity.role
    };
  }

  return byKey;
}

function buildTradeSeeds(users: Record<string, SeededUserInfo>): TradeSeed[] {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const alice = users['alice'] ?? Object.values(users)[0];
  const bob = users['bob'] ?? alice;

  return [
    {
      uid: 'VT-DEMO-GADGET',
      creatorId: alice?.idNumber ?? 'unknown',
      counterpartyId: bob?.idNumber ?? null,
      creatorVerifiedIdentities: ['kyc_passed'],
      itemName: 'Mirrorless camera kit',
      itemDescription: 'Lightly used APS-C camera with kit lens and strap.',
      itemCondition: TradeFormItemCondition.USED_LIKE_NEW,
      amount: '15000.00',
      tradeChannel: TradeFormChannel.ESCROW,
      paymentMethod: TradeFormPaymentMethod.BANK_TRANSFER,
      matchmakingChannel: TradeFormMatchmakingChannel.IN_APP,
      identityRequirements: ['kyc_passed'],
      userRating: 5,
      status: TradeFormStatus.VERIFIED,
      meta: {
        identity_requirements: { requiredClaims: ['kyc_passed'] }
      } as TradeFormMeta,
      confirmedByUser1: true,
      confirmedByUser2: false,
      vcVerifiedAt: now,
      uidExpiresAt: inOneHour,
      finalizedAt: null,
      finalizeAttempts: 0,
      finalizeFailedAt: null,
      finalizeError: null
    },
    {
      uid: 'VT-DEMO-HEADPHONES',
      creatorId: bob?.idNumber ?? 'unknown',
      counterpartyId: alice?.idNumber ?? null,
      creatorVerifiedIdentities: ['idcard'],
      itemName: 'Noise-cancelling headphones',
      itemDescription: '1 year old, works great. Includes box and cable.',
      itemCondition: TradeFormItemCondition.USED,
      amount: '3200.00',
      tradeChannel: TradeFormChannel.P2P,
      paymentMethod: TradeFormPaymentMethod.CASH,
      matchmakingChannel: TradeFormMatchmakingChannel.LINE,
      identityRequirements: [],
      userRating: 4,
      status: TradeFormStatus.PENDING,
      meta: {},
      confirmedByUser1: false,
      confirmedByUser2: false,
      vcVerifiedAt: null,
      uidExpiresAt: inTwoDays,
      finalizedAt: null,
      finalizeAttempts: 0,
      finalizeFailedAt: null,
      finalizeError: null,
      creatorVerifiedIdentities: [],
      identityRequirements: []
    }
  ];
}

async function seedTrades(
  manager: EntityManager,
  usersByKey: Record<string, SeededUserInfo>
): Promise<number> {
  const tradeRepo = manager.getRepository(TradeFormEntity);
  const seeds = buildTradeSeeds(usersByKey);

  if (!seeds.length) {
    return 0;
  }

  const payloads: QueryDeepPartialEntity<TradeFormEntity>[] = seeds.map((seed) => ({
    uid: seed.uid,
    creatorId: seed.creatorId,
    counterpartyId: seed.counterpartyId,
    creatorVerifiedIdentities: seed.creatorVerifiedIdentities,
    itemName: seed.itemName,
    itemDescription: seed.itemDescription,
    itemCondition: seed.itemCondition,
    amount: seed.amount,
    tradeChannel: seed.tradeChannel,
    paymentMethod: seed.paymentMethod,
    matchmakingChannel: seed.matchmakingChannel,
    identityRequirements: seed.identityRequirements,
    userRating: seed.userRating,
    status: seed.status,
    meta: seed.meta,
    confirmedByUser1: seed.confirmedByUser1,
    confirmedByUser2: seed.confirmedByUser2,
    vcVerifiedAt: seed.vcVerifiedAt,
    uidExpiresAt: seed.uidExpiresAt,
    finalizedAt: seed.finalizedAt,
    finalizeAttempts: seed.finalizeAttempts,
    finalizeFailedAt: seed.finalizeFailedAt,
    finalizeError: seed.finalizeError,
    updatedAt: new Date(),
    createdAt: new Date()
  }));

  await tradeRepo.upsert(payloads, ['uid']);

  return seeds.length;
}

async function seedDatabase(manager: EntityManager): Promise<SeedSummary> {
  await clearAllForSeed(manager);

  const usersByKey = await seedUsers(manager);
  const tradeForms = await seedTrades(manager, usersByKey);

  return {
    profile,
    users: Object.keys(usersByKey).length,
    tradeForms,
    auditEvents: 0
  };
}

export async function runSeed(options: RunSeedOptions = {}): Promise<SeedSummary> {
  const dataSource = options.dataSource ?? AppDataSource;
  const manageConnection = options.manageConnection ?? !dataSource.isInitialized;

  if (manageConnection && !dataSource.isInitialized) {
    await dataSource.initialize();
  }

  try {
    logDataSourceDetails(dataSource);
    await ensureSchema(dataSource);

    const summary = await dataSource.transaction((manager) => seedDatabase(manager));
    logger.info(summary, 'database seed completed');
    return summary;
  } catch (error) {
    logger.error({ err: error }, 'seed script failed');
    throw error;
  } finally {
    if (manageConnection && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  void runSeed().catch((error) => {
    logger.error({ err: error }, 'seed failed');
    process.exitCode = 1;
  });
}
