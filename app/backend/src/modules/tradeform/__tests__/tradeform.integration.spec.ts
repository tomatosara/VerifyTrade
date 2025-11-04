import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DataSource, Repository } from 'typeorm';

describe('TradeFormService integration', () => {
  let container: StartedPostgreSqlContainer;
  let AppDataSource: DataSource;
  let TradeFormServiceClass: typeof import('../service/tradeform.service').TradeFormService;
  let service: import('../service/tradeform.service').TradeFormService;
  let userRepo: Repository<import('@modules/auth/entity/user.entity').UserEntity>;
  let users: Record<'creator' | 'counterparty' | 'platform' | 'outsider', import('@modules/auth/entity/user.entity').UserEntity>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine').start();
    const connectionUri = container.getConnectionUri();
    process.env.DATABASE_URL = connectionUri;
    process.env.PERSIST_STRATEGY = 'db';
    process.env.CHAIN_RPC_URL = 'http://localhost:8545';
    process.env.CHAIN_WALLET_KEY = '0xabc';
    jest.resetModules();

    const dataSourceModule = await import('@database/data-source');
    AppDataSource = dataSourceModule.AppDataSource;
    AppDataSource.setOptions({ url: connectionUri });
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();

    const serviceModule = await import('../service/tradeform.service');
    TradeFormServiceClass = serviceModule.TradeFormService;

    const { featureFlags } = await import('@config/featureFlags');
    const flags = {
      ...featureFlags,
      persistStrategy: 'db' as const,
      chainRpcUrl: 'http://localhost:8545',
      chainWalletKey: '0xabc'
    };

    service = new TradeFormServiceClass(AppDataSource, flags);

    const { UserEntity } = await import('@modules/auth/entity/user.entity');
    userRepo = AppDataSource.getRepository(UserEntity);
    users = {
      creator: await userRepo.save(
        userRepo.create({ email: 'creator@test.com', name: 'Creator', role: 'user' })
      ),
      counterparty: await userRepo.save(
        userRepo.create({ email: 'counterparty@test.com', name: 'Counterparty', role: 'user' })
      ),
      platform: await userRepo.save(
        userRepo.create({ email: 'platform@test.com', name: 'Platform Ops', role: 'platform' })
      ),
      outsider: await userRepo.save(
        userRepo.create({ email: 'outsider@test.com', name: 'Outsider', role: 'user' })
      )
    };
  });

  afterAll(async () => {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
    }
    if (container) {
      await container.stop();
    }
  });

  it('flows trade form lifecycle end-to-end', async () => {
    const createResult = await service.createTradeForm(
      {
        title: 'Integration Trade',
        description: 'Trade created during integration test',
        amount: '500.00'
      },
      users.creator.id
    );

    expect(createResult.status).toBe('pending');

    const minimalView = await service.getTradeForm(createResult.uid, users.outsider.id);
    expect(minimalView).toEqual({ uid: createResult.uid, status: 'pending' });

    await expect(
      service.confirmTradeForm(createResult.uid, users.counterparty.id, { role: 'user2' })
    ).rejects.toThrow('VC verification required');

    const verify = await service.verifyVC(createResult.uid, users.counterparty.id, {
      kyc: true
    });
    expect(verify.valid).toBe(true);
    expect(verify.status).toBe('verified');

    const confirmCounterparty = await service.confirmTradeForm(createResult.uid, users.counterparty.id, {
      role: 'user2'
    });
    expect(confirmCounterparty.status).toBe('verified');
    expect(confirmCounterparty.finalizeTriggered).toBe(false);

    const confirmCreator = await service.confirmTradeForm(createResult.uid, users.creator.id, {
      role: 'user1'
    });
    expect(confirmCreator.status).toBe('confirmed');
    expect(confirmCreator.finalizeTriggered).toBe(true);

    const finalize = await service.finalize(createResult.uid, users.platform.id);
    expect(finalize.status).toBe('done');

    const { TradeFormRepository } = await import('../repo/tradeform.repository');
    const repo = new TradeFormRepository(AppDataSource.manager);
    const persisted = await repo.findByUid(createResult.uid);
    expect(persisted?.status).toBe('done');
    expect(persisted?.confirmedByUser1).toBe(true);
    expect(persisted?.confirmedByUser2).toBe(true);

    const auditLog = await service.getAuditLog(createResult.uid, users.creator.id);
    const actions = auditLog.map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining(['create', 'verifyVC', 'confirm', 'finalize'])
    );
  });

  it('surfaces failure when chain configuration is missing', async () => {
    const { TradeFormEntity } = await import('../entity/tradeform.entity');
    const tradeRepo = AppDataSource.getRepository(TradeFormEntity);

    const trade = tradeRepo.create({
      uid: `confirmed-${Date.now()}`,
      creatorId: users.creator.id,
      counterpartyId: users.counterparty.id,
      title: 'Chain Finalize Trade',
      description: 'Trade prepared to test chain finalization failure',
      amount: '250.00',
      status: 'confirmed',
      meta: {},
      auditLog: [],
      confirmedByUser1: true,
      confirmedByUser2: true,
      finalizeAttempts: 0
    });

    await tradeRepo.save(trade);

    const { TradeFinalizationService } = await import('../persistence/finalize');
    const flagsModule = await import('@config/featureFlags');
    const finalizer = new TradeFinalizationService(AppDataSource, {
      ...flagsModule.featureFlags,
      persistStrategy: 'chain',
      chainRpcUrl: undefined,
      chainWalletKey: undefined
    });

    const result = await finalizer.finalize(trade.uid, users.platform.id, 'manual');
    expect(result.status).toBe('failed');
    expect(result.error).toContain('Chain configuration missing');
  });
});
