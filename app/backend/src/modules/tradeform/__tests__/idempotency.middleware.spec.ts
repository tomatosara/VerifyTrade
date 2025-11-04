import request from 'supertest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DataSource, Repository } from 'typeorm';

describe('idempotency middleware', () => {
  let container: StartedPostgreSqlContainer;
  let AppDataSource: DataSource;
  let app: import('express').Express;
  let setActor: (id: string) => void;
  let userRepo: Repository<import('@modules/auth/entity/user.entity').UserEntity>;
  let users: { primary: import('@modules/auth/entity/user.entity').UserEntity; secondary: import('@modules/auth/entity/user.entity').UserEntity };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine').start();
    const connectionUri = container.getConnectionUri();
    process.env.DATABASE_URL = connectionUri;
    jest.resetModules();

    const dataSourceModule = await import('@database/data-source');
    AppDataSource = dataSourceModule.AppDataSource;
    AppDataSource.setOptions({ url: connectionUri });
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();

    const { UserEntity } = await import('@modules/auth/entity/user.entity');
    userRepo = AppDataSource.getRepository(UserEntity);
    users = {
      primary: await userRepo.save(
        userRepo.create({ email: 'idem-primary@test.com', name: 'Primary', role: 'user' })
      ),
      secondary: await userRepo.save(
        userRepo.create({ email: 'idem-secondary@test.com', name: 'Secondary', role: 'user' })
      )
    };

    const { idempotencyMiddleware } = await import('@middleware/idempotency');
    const expressModule = await import('express');
    app = expressModule.default();
    app.use(expressModule.json());

    let actorId = users.primary.id;
    setActor = (id: string) => {
      actorId = id;
    };

    app.use((req, _res, next) => {
      req.user = { id: actorId, role: 'user' };
      next();
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    app.post('/echo', idempotencyMiddleware, (_req, res) => {
      res.json({ value: Date.now() });
    });
  });

  afterAll(async () => {
    if (AppDataSource?.isInitialized) {
      await AppDataSource.destroy();
    }
    if (container) {
      await container.stop();
    }
  });

  it('returns cached result when idempotency key is reused', async () => {
    setActor(users.primary.id);
    const key = 'integration-key';

    const first = await request(app).post('/echo').set('Idempotency-Key', key).send({});
    expect(first.status).toBe(200);
    expect(first.headers['idempotency-key']).toBe(key);

    const second = await request(app).post('/echo').set('Idempotency-Key', key).send({});
    expect(second.status).toBe(200);
    expect(second.headers['idempotency-key']).toBe(key);
    expect(second.body).toEqual(first.body);
  });

  it('rejects same key from different actor', async () => {
    setActor(users.secondary.id);
    const conflict = await request(app)
      .post('/echo')
      .set('Idempotency-Key', 'integration-key')
      .send({});

    expect(conflict.status).toBe(409);
  });
});
