import '@config/env';
import type { DataSource, EntityManager } from 'typeorm';
import { In } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AppDataSource } from '@database/data-source';
import { dbConfig } from '@config/db';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { TradeFormEntity } from '@modules/tradeform/entity/tradeform.entity';
import { TradeAuditEventEntity } from '@modules/tradeform/entity/trade-audit-event.entity';
import { TradeConfirmationEntity } from '@modules/tradeform/entity/trade-confirmation.entity';
import { signJwt, signPlatformJwt } from '@modules/auth/jwt';
import { logger } from '@utils/logger';
import { createSeedFaker, resolveSeedConfig } from './seedConfig';
import { buildUserSeeds } from './factories/users.factory';
import { buildTradeSeeds } from './factories/tradeforms.factory';
import type { SeedProfile, SeedSummary, UserSeed } from './types';

interface RunSeedOptions {
  profile?: SeedProfile;
  dataSource?: DataSource;
  manageConnection?: boolean;
}

interface SeededUserInfo {
  id: string;
  email: string;
  name: string;
  role: UserEntity['role'];
}

type SeedConnectionOptions = PostgresConnectionOptions & { searchPath?: string };

interface RunSeedResult {
  summary: SeedSummary;
  usersByKey: Record<string, SeededUserInfo>;
  tradeUids: string[];
}

function getPostgresOptions(dataSource: DataSource): SeedConnectionOptions {
  return dataSource.options as SeedConnectionOptions;
}

function getSchemaName(dataSource: DataSource): string {
  const configured = getPostgresOptions(dataSource).schema;
  return typeof configured === 'string' && configured.length ? configured : 'public';
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
  const options = getPostgresOptions(dataSource);
  logger.info(
    {
      connection: {
        host: dbConfig.connectionInfo.host,
        port: dbConfig.connectionInfo.port,
        database: dbConfig.connectionInfo.database,
        schema: getSchemaName(dataSource),
        searchPath: options.searchPath ?? getSchemaName(dataSource)
      },
      paths: {
        entities: describeMixedList(options.entities),
        migrations: describeMixedList(options.migrations),
        subscribers: describeMixedList(options.subscribers)
      }
    },
    'initializing data source for seed'
  );
}

async function assertUsersTableExists(dataSource: DataSource) {
  const schemaName = getSchemaName(dataSource);
  const tableIdentifier = `${schemaName}.users`;
  const result = await dataSource.query('SELECT to_regclass($1) as identifier', [tableIdentifier]);
  const exists = result?.[0]?.identifier;

  if (!exists) {
    const options = getPostgresOptions(dataSource);
    const migrationPaths = describeMixedList(options.migrations).join(', ') || 'none';
    throw new Error(
      [
        `users table not found (expected identifier "${tableIdentifier}")`,
        'Pending migrations may not be configured correctly.',
        `Resolved migration paths: ${migrationPaths}`
      ].join(' ')
    );
  }
}

async function deleteStaleAuditEvents(
  manager: EntityManager,
  tradeUids: string[],
  retainedIds: string[]
) {
  if (!tradeUids.length) {
    return;
  }
  const qb = manager
    .createQueryBuilder()
    .delete()
    .from(TradeAuditEventEntity)
    .where('tradeUid IN (:...tradeUids)', { tradeUids });

  if (retainedIds.length) {
    qb.andWhere('id NOT IN (:...ids)', { ids: retainedIds });
  }

  await qb.execute();
}

async function deleteStaleConfirmations(
  manager: EntityManager,
  tradeUids: string[],
  retainedPairs: Array<{ tradeUid: string; actorId: string }>
) {
  if (!tradeUids.length) {
    return;
  }

  const qb = manager
    .createQueryBuilder()
    .delete()
    .from(TradeConfirmationEntity)
    .where('tradeUid IN (:...tradeUids)', {
      tradeUids
    });

  if (retainedPairs.length) {
    qb.andWhere(
      retainedPairs
        .map(
          (_pair, index) =>
            `(tradeUid != :retainTradeUid${index} OR actorId != :retainActorId${index})`
        )
        .join(' AND '),
      Object.fromEntries(
        retainedPairs.flatMap((pair, index) => [
          [`retainTradeUid${index}`, pair.tradeUid],
          [`retainActorId${index}`, pair.actorId]
        ])
      )
    );
  }

  await qb.execute();
}

export async function runSeed(options: RunSeedOptions = {}): Promise<RunSeedResult> {
  const shouldManageConnection = options.manageConnection ?? !options.dataSource;
  const dataSource = options.dataSource ?? AppDataSource;

  const { profile, faker } = options.profile
    ? { profile: options.profile, faker: createSeedFaker(options.profile) }
    : resolveSeedConfig();

  let usersByKey: Record<string, SeededUserInfo> = {};
  let tradeUids: string[] = [];

  try {
    if (!dataSource.isInitialized) {
      if (!shouldManageConnection) {
        throw new Error('Provided dataSource must be initialized when manageConnection is false');
      }
      logDataSourceDetails(dataSource);
      await dataSource.initialize();
    } else if (shouldManageConnection) {
      logDataSourceDetails(dataSource);
    }

    const executed = await dataSource.runMigrations();
    const appliedMigrations = executed.map((migration) => migration.name);

    if (appliedMigrations.length) {
      logger.info({ migrations: appliedMigrations }, 'applied pending migrations before seed');
    } else {
      logger.info('no pending migrations before seed');
    }

    await assertUsersTableExists(dataSource);

    const summary = await dataSource.transaction<SeedSummary>(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const tradeRepo = manager.getRepository(TradeFormEntity);
      const auditRepo = manager.getRepository(TradeAuditEventEntity);
      const confirmationRepo = manager.getRepository(TradeConfirmationEntity);

      const userSeeds = buildUserSeeds(profile);
      await userRepo.upsert(userSeeds, ['email']);

      const persistedUsers = await userRepo.find({
        where: {
          email: In(userSeeds.map((user) => user.email))
        }
      });

      const persistedByEmail = new Map(persistedUsers.map((user) => [user.email, user]));

      const resolvedUsers: UserSeed[] = userSeeds.map((seed) => {
        const entity = persistedByEmail.get(seed.email);
        if (!entity) {
          throw new Error(`Failed to resolve seeded user with email ${seed.email}`);
        }

        return {
          ...seed,
          id: entity.id,
          name: entity.name,
          role: entity.role,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          passwordHash: entity.passwordHash ?? null
        };
      });

      usersByKey = Object.fromEntries(
        resolvedUsers.map((user) => [
          user.key,
          { id: user.id, email: user.email, name: user.name, role: user.role }
        ])
      );

      const tradeSeeds = buildTradeSeeds(profile, faker, resolvedUsers);
      tradeUids = tradeSeeds.map((seed) => seed.record.uid);

      const tradeUpserts: QueryDeepPartialEntity<TradeFormEntity>[] = tradeSeeds.map((seed) => {
        const { auditLog, ...rest } = seed.record;
        return {
          ...rest,
          auditLog: auditLog.map((entry) => ({
            ...entry,
            at: new Date(entry.at).toISOString()
          }))
        } as QueryDeepPartialEntity<TradeFormEntity>;
      });

      await tradeRepo.upsert(tradeUpserts, ['uid']);

      const allAuditEvents = tradeSeeds.flatMap((seed) => seed.auditEvents);
      const auditIds = allAuditEvents.map((event) => event.id);

      await deleteStaleAuditEvents(manager, tradeUids, auditIds);
      if (allAuditEvents.length) {
        const auditUpserts: QueryDeepPartialEntity<TradeAuditEventEntity>[] = allAuditEvents.map(
          (event) =>
            ({
              id: event.id,
              tradeUid: event.tradeUid,
              actorId: event.actorId,
              action: event.action,
              at: event.at,
              details: event.details ?? null
            }) as QueryDeepPartialEntity<TradeAuditEventEntity>
        );

        await auditRepo.upsert(auditUpserts, ['id']);
      }

      const confirmationSeeds = tradeSeeds.flatMap((seed) => seed.confirmations);
      const confirmationPairs = confirmationSeeds.map((seed) => ({
        tradeUid: seed.tradeUid,
        actorId: seed.actorId
      }));

      await deleteStaleConfirmations(manager, tradeUids, confirmationPairs);
      if (confirmationSeeds.length) {
        await confirmationRepo.upsert(
          confirmationSeeds.map((seed) => ({
            id: seed.id,
            tradeUid: seed.tradeUid,
            actorId: seed.actorId,
            role: seed.role,
            confirmedAt: seed.confirmedAt
          })),
          ['tradeUid', 'actorId']
        );
      }

      return {
        profile,
        users: resolvedUsers.length,
        tradeForms: tradeSeeds.length,
        auditEvents: allAuditEvents.length,
        confirmations: confirmationSeeds.length
      };
    });

    logger.info(summary, 'database seed completed');

    if (profile === 'dev') {
      const alice = usersByKey['alice'];
      const bob = usersByKey['bob'];
      const platform = usersByKey['platform'];
      if (alice && bob && platform) {
        const tokens = {
          alice: signJwt({
            sub: alice.id,
            role: alice.role,
            email: alice.email,
            name: alice.name
          }),
          bob: signJwt({
            sub: bob.id,
            role: bob.role,
            email: bob.email,
            name: bob.name
          }),
          platform: signPlatformJwt({
            sub: platform.id,
            role: platform.role,
            email: platform.email,
            name: platform.name
          })
        };

        // eslint-disable-next-line no-console
        console.log('Dev profile JWTs (1h expiry):', tokens);
      }
      // eslint-disable-next-line no-console
      console.log('Seeded trade UIDs:', tradeUids);
    }

    return {
      summary,
      usersByKey,
      tradeUids
    };
  } catch (error) {
    logger.error({ err: error }, 'seed script failed');
    throw error;
  } finally {
    if (shouldManageConnection && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function runCli() {
  try {
    await runSeed();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seed script failed', error);
    process.exit(1);
  }
}

if (require.main === module) {
  void runCli();
}
