import '@config/env';
import type { DataSource, EntityManager } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@utils/logger';
import { clearAllForSeed } from './utils/clear';
import { UserEntity } from '@modules/auth/entity/user.entity';
import {
  TradeFormChannel,
  TradeFormEntity,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '@modules/tradeform/entity/trade-form.entity';

interface RunSeedOptions {
  dataSource?: DataSource;
  manageConnection?: boolean;
}

interface SeededUserInfo {
  id: string;
  idNumber: string;
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

async function seedTradeForms(
  manager: EntityManager,
  users: UserEntity[]
): Promise<number> {
  const tradeRepo = manager.getRepository(TradeFormEntity);

  const owner = users[0] ?? null;

  const entities = tradeFormSeeds.map((seed) =>
    tradeRepo.create({
      ...seed,
      creatorId: owner ? owner.id : null
    })
  );

  await tradeRepo.save(entities);
  return entities.length;
}

export async function runSeed(options: RunSeedOptions = {}): Promise<SeedSummary> {
  const dataSource = options.dataSource ?? AppDataSource;
  const manageConnection = options.manageConnection ?? !dataSource.isInitialized;

  if (manageConnection && !dataSource.isInitialized) {
    await dataSource.initialize();
  }

  try {
    await dataSource.runMigrations();

    const summary = await dataSource.transaction<SeedSummary>(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const tradeRepo = manager.getRepository(TradeFormEntity);
      const auditRepo = manager.getRepository(TradeAuditEventEntity);
      const confirmationRepo = manager.getRepository(TradeConfirmationEntity);

      const userSeeds = buildUserSeeds(profile);
      // ===== 取代 email → idNumber =====
      await userRepo.upsert(userSeeds, ['idNumber']);

      const persistedUsers = await userRepo.find({
        where: {
          idNumber: In(userSeeds.map((u) => u.idNumber)),
        },
      });

      const persistedById = new Map(persistedUsers.map((u) => [u.idNumber!, u]));

      const resolvedUsers: UserSeed[] = userSeeds.map((seed) => {
        const entity = persistedById.get(seed.idNumber);
        if (!entity) throw new Error(`Failed to resolve seeded user ${seed.idNumber}`);

        return {
          ...seed,
          id: entity.id,
          role: entity.role,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        };
      });

      const usersByKey = Object.fromEntries(
        resolvedUsers.map((u) => [u.key, { id: u.id, idNumber: u.idNumber, role: u.role }]),
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
        users: users.length,
        tradeForms: tradeFormCount
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
            name: alice.name
          }),
          bob: signJwt({
            sub: bob.id,
            role: bob.role,
            name: bob.name
          }),
          platform: signPlatformJwt({
            sub: platform.id,
            role: platform.role,
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
