import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { runSeed } from './seed';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { TradeFormEntity } from '@modules/tradeform/entity/trade-form.entity';
import { TradeAuditEventEntity } from '@modules/tradeform/entity/trade-audit-event.entity';
import { IdempotencyKeyEntity } from '@modules/tradeform/entity/idempotency-key.entity';

describe('database seed runner', () => {
  let dataSource: DataSource;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    dataSource = new DataSource({
      type: 'postgres',
      url: container.getConnectionUri(),
      entities: [UserEntity, TradeFormEntity, TradeAuditEventEntity, IdempotencyKeyEntity],
      migrations: [],
      synchronize: true,
      logging: false
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (container) {
      await container.stop();
    }
  });

  it('runs twice without FK violations or missing tables', async () => {
    const first = await runSeed({ dataSource, manageConnection: false });
    expect(first.users).toBeGreaterThanOrEqual(3);
    expect(first.tradeForms).toBeGreaterThan(0);

    const userRepo = dataSource.getRepository(UserEntity);
    const tradeRepo = dataSource.getRepository(TradeFormEntity);
    const auditRepo = dataSource.getRepository(TradeAuditEventEntity);

    expect(await userRepo.count()).toBeGreaterThanOrEqual(first.users);
    expect(await tradeRepo.count()).toBe(first.tradeForms);
    expect(await auditRepo.count()).toBe(0);

    const second = await runSeed({ dataSource, manageConnection: false });
    expect(second.users).toBe(first.users);
    expect(second.tradeForms).toBe(first.tradeForms);

    expect(await userRepo.count()).toBeGreaterThanOrEqual(second.users);
    expect(await tradeRepo.count()).toBe(second.tradeForms);
    expect(await auditRepo.count()).toBe(0);
  });
});
