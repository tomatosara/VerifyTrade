import '@config/env';
import type { DataSource } from 'typeorm';
import { In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { dbConfig } from '@config/db';
import { logger } from '@utils/logger';
import { clearAllForSeed } from './utils/clear';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { TradeFormEntity } from '@modules/tradeform/entity/trade-form.entity';
import type { SeedProfile, SeedSummary, UserSeed } from './types';
import { buildUserSeeds } from './factories/users.factory';
import { buildTradeSeeds } from './factories/trade-forms.factory';

const profile: SeedProfile = (process.env.SEED_PROFILE as SeedProfile) ?? 'dev';

interface RunSeedOptions {
  dataSource?: DataSource;
  manageConnection?: boolean;
}

function describeMixedList(value: unknown): string[] {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value)
    ? value
    : typeof value === 'object'
      ? Object.values(value as Record<string, unknown>)
      : [value];

  return items.map((item) => {
    if (typeof item === 'string') {
      return item;
    }
    if (typeof item === 'function') {
      return item.name ?? '[Function anonymous]';
    }
    return String(item);
  });
}

function logDataSourceDetails(dataSource: DataSource) {
  logger.info(
    {
      connection: {
        host: dbConfig.connectionInfo.host,
        port: dbConfig.connectionInfo.port,
        database: dbConfig.connectionInfo.database
      },
      paths: {
        entities: describeMixedList(dataSource.options.entities),
        migrations: describeMixedList(dataSource.options.migrations),
        subscribers: describeMixedList(dataSource.options.subscribers)
      }
    },
    'initializing data source for seed'
  );
}

async function assertUsersTableExists(dataSource: DataSource) {
  const schema = (dataSource.options as { schema?: string }).schema ?? 'public';
  const result = await dataSource.query('SELECT to_regclass($1) as identifier', [`${schema}.users`]);
  if (!result?.[0]?.identifier) {
    throw new Error('users table not found. Did you run migrations?');
  }
}

export async function runSeed(options: RunSeedOptions = {}): Promise<SeedSummary> {
  const dataSource = options.dataSource ?? AppDataSource;
  const manageConnection = options.manageConnection ?? !dataSource.isInitialized;

  if (manageConnection && !dataSource.isInitialized) {
    await dataSource.initialize();
  }

  try {
    logDataSourceDetails(dataSource);
    await dataSource.runMigrations();
    await assertUsersTableExists(dataSource);

    const summary = await dataSource.transaction<SeedSummary>(async (manager) => {
      await clearAllForSeed(manager);

      const userRepo = manager.getRepository(UserEntity);
      const tradeRepo = manager.getRepository(TradeFormEntity);

      const userSeeds = buildUserSeeds(profile);
      await userRepo.upsert(userSeeds, ['idNumber']);

      const persistedUsers = await userRepo.find({
        where: { idNumber: In(userSeeds.map((seed) => seed.idNumber)) }
      });
      const persistedByIdNumber = new Map(persistedUsers.map((user) => [user.idNumber, user]));

      const resolvedUsers: UserSeed[] = userSeeds.map((seed) => {
        const persisted = persistedByIdNumber.get(seed.idNumber);
        if (!persisted) {
          throw new Error(`Failed to resolve seeded user ${seed.idNumber}`);
        }

        return {
          ...seed,
          id: persisted.id,
          createdAt: persisted.createdAt,
          updatedAt: persisted.updatedAt
        };
      });

      const tradeSeeds = buildTradeSeeds(profile, resolvedUsers);
      if (tradeSeeds.length) {
        const tradeEntities = tradeSeeds.map((seed) => tradeRepo.create(seed.record));
        await tradeRepo.save(tradeEntities);
      }

      return {
        profile,
        users: resolvedUsers.length,
        tradeForms: tradeSeeds.length,
        auditEvents: 0
      };
    });

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

