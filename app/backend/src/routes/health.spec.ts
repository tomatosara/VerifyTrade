import 'reflect-metadata';
import type { Request, Response } from 'express';
import type { QueryRunner } from 'typeorm';
import { livenessHandler, readinessHandler } from './health';
import { AppDataSource } from '@database/data-source';

jest.mock('@modules/tradeform/tradeform.service', () => ({
  TradeFormService: class {
    findByUidForActor = jest.fn();
  }
}));

const ORIGINAL_ENV = { ...process.env };
const originalIsInitializedDescriptor = Object.getOwnPropertyDescriptor(
  AppDataSource,
  'isInitialized'
);

const setIsInitialized = (value: boolean) => {
  Object.defineProperty(AppDataSource, 'isInitialized', {
    value,
    configurable: true
  });
};

type MockResponse<T = unknown> = Response & {
  statusCode: number;
  body?: T;
};

const createMockResponse = <T = unknown>(): MockResponse<T> => {
  const res: Partial<MockResponse<T>> = {
    statusCode: 200,
    status(code: number) {
      res.statusCode = code;
      return res as Response;
    },
    json(payload: T) {
      res.body = payload;
      return res as Response;
    }
  };
  return res as MockResponse<T>;
};

const makeQueryRunner = (): QueryRunner => {
  const runner = {
    isTransactionActive: false,
    async startTransaction() {
      runner.isTransactionActive = true;
    },
    async query(sql: string) {
      if (sql.startsWith('SET LOCAL statement_timeout')) {
        return [];
      }
      if (sql === 'SELECT 1') {
        return [{ '?column?': 1 }];
      }
      return [];
    },
    async commitTransaction() {
      runner.isTransactionActive = false;
    },
    async rollbackTransaction() {
      runner.isTransactionActive = false;
    },
    async release() {
      runner.isTransactionActive = false;
    }
  };

  return runner as unknown as QueryRunner;
};

describe('health endpoints', () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      JWT_SECRET: ORIGINAL_ENV.JWT_SECRET ?? 'test-secret-123',
      PLATFORM_JWT_SECRET: ORIGINAL_ENV.PLATFORM_JWT_SECRET ?? 'test-secret-123',
      API_BASE_URL: ORIGINAL_ENV.API_BASE_URL ?? 'http://localhost:3000' // test/dev-only default
    };
    setIsInitialized(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalIsInitializedDescriptor) {
      Object.defineProperty(AppDataSource, 'isInitialized', originalIsInitializedDescriptor);
    }
    process.env = ORIGINAL_ENV;
  });

  const makeRequest = (overrides: Partial<Request> = {}): Request =>
    ({
      method: 'GET',
      url: overrides.url ?? '/',
      requestId: overrides.requestId ?? 'test-request',
      ...overrides
    } as Request);

  it('returns 200 for /healthz quickly', () => {
    const req = makeRequest({ url: '/healthz' });
    const res = createMockResponse<{ status: string; uptimeSec: number; version: string }>();

    const start = Date.now();
    livenessHandler(req, res);
    const durationMs = Date.now() - start;

    expect(res.statusCode).toBe(200);
    expect(durationMs).toBeLessThan(100);
    expect(res.body?.status).toBe('ok');
    expect(typeof res.body?.uptimeSec).toBe('number');
    expect(typeof res.body?.version).toBe('string');
  });

  it('reports readiness ok when dependencies pass', async () => {
    const queryRunner = makeQueryRunner();
    jest.spyOn(AppDataSource, 'createQueryRunner').mockReturnValue(queryRunner);

    const req = makeRequest({ url: '/ready' });
    const res = createMockResponse<{
      status: string;
      checks: Record<string, { ok: boolean; reason?: string }>;
    }>();

    await readinessHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      checks: {
        db: { ok: true }
      }
    });
  });

  it('reports degraded readiness when database is unavailable', async () => {
    setIsInitialized(false);

    const req = makeRequest({ url: '/ready' });
    const res = createMockResponse<{
      status: string;
      checks: Record<string, { ok: boolean; reason?: string }>;
    }>();

    await readinessHandler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      status: 'degraded',
      checks: {
        db: {
          ok: false,
          reason: 'not initialized'
        }
      }
    });
  });
});
