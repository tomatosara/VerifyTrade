import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DataSource } from 'typeorm';
import { runSeed } from '@database/seed/seed';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { TradeFormEntity } from '@modules/tradeform/entity/tradeform.entity';
import { TradeAuditEventEntity } from '@modules/tradeform/entity/trade-audit-event.entity';
import { TradeConfirmationEntity } from '@modules/tradeform/entity/trade-confirmation.entity';

describe('seed script (test profile)', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.JWT_SECRET = 'test-secret-123456789';
    process.env.PLATFORM_JWT_SECRET = 'test-platform-secret-123456789';
    process.env.SHARE_URL_BASE = 'https://test.example.com/join';
    process.env.NODE_ENV = 'test';
    process.env.PERSIST_STRATEGY = 'db';
    process.env.SEED_PROFILE = 'test';

    jest.resetModules();

    const dataSourceModule = await import('@database/data-source');
    dataSource = dataSourceModule.AppDataSource;
    dataSource.setOptions({ url: process.env.DATABASE_URL });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (container) {
      await container.stop();
    }
  });

  it('seeds deterministic data and remains idempotent', async () => {
    const result = await runSeed({ profile: 'test', dataSource, manageConnection: false });
    expect(result.summary).toMatchObject({
      profile: 'test',
      users: 3,
      tradeForms: 2,
      auditEvents: 7,
      confirmations: 2
    });

    const userRepo = dataSource.getRepository(UserEntity);
    const tradeRepo = dataSource.getRepository(TradeFormEntity);
    const auditRepo = dataSource.getRepository(TradeAuditEventEntity);
    const confirmationRepo = dataSource.getRepository(TradeConfirmationEntity);

    const users = await userRepo.find();
    expect(users).toHaveLength(3);
    const sortedEmails = users.map((user) => user.email).sort();
    expect(sortedEmails).toEqual([
      'counterparty@test.verifytrade',
      'creator@test.verifytrade',
      'platform@test.verifytrade'
    ]);

    const trades = await tradeRepo.find();
    expect(trades).toHaveLength(2);

    const verifiedTrade = await tradeRepo.findOneByOrFail({
      uid: 'qW8eR5tY2uI9oP4aS7dF1gH3jK'
    });
    expect(verifiedTrade.status).toBe('verified');
    expect(verifiedTrade.auditLog).toHaveLength(2);
    expect(verifiedTrade.meta).toEqual({});

    const doneTrade = await tradeRepo.findOneByOrFail({ uid: 'wQ7eR4tY1uI8oP3aS6dF0gH2jK' });
    expect(doneTrade.status).toBe('done');
    expect(doneTrade.confirmedByUser1).toBe(true);
    expect(doneTrade.confirmedByUser2).toBe(true);
    expect(doneTrade.meta).toHaveProperty('chain_tx_hash', '0x1234abcd5678ef90fedcba0987654321');
    expect(doneTrade.auditLog.map((entry) => entry.action)).toEqual([
      'create',
      'verifyVC',
      'confirm',
      'confirm',
      'finalize'
    ]);

    const auditEvents = await auditRepo.find();
    expect(auditEvents).toHaveLength(7);
    expect(new Set(auditEvents.map((event) => event.tradeUid))).toEqual(
      new Set(['qW8eR5tY2uI9oP4aS7dF1gH3jK', 'wQ7eR4tY1uI8oP3aS6dF0gH2jK'])
    );

    const confirmations = await confirmationRepo.find();
    expect(confirmations).toHaveLength(2);
    expect(confirmations.map((confirmation) => confirmation.role).sort()).toEqual([
      'user1',
      'user2'
    ]);

    const rerun = await runSeed({ profile: 'test', dataSource, manageConnection: false });
    expect(rerun.summary).toEqual(result.summary);
    expect(await auditRepo.count()).toBe(7);
    expect(await confirmationRepo.count()).toBe(2);
  });
});
