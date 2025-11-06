import { Router } from 'express';
import type { Request, Response } from 'express';
import { AppDataSource } from '@database/data-source';
import { logger } from '@utils/logger';
import { version as appVersion } from '../../package.json';

const READINESS_TIMEOUT_MS = 400;

type ReadinessCheck = () => Promise<{ ok: boolean; reason?: string }>;

type ReadinessChecks = Record<string, ReadinessCheck>;

const readinessChecks: ReadinessChecks = {
  db: async () => {
    if (!AppDataSource.isInitialized) {
      return {
        ok: false,
        reason: 'not initialized'
      };
    }

    const queryRunner = AppDataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction();
      await queryRunner.query(`SET LOCAL statement_timeout = ${READINESS_TIMEOUT_MS}`);
      await queryRunner.query('SELECT 1');
      await queryRunner.commitTransaction();
      return { ok: true };
    } catch (error) {
      try {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
      } catch (rollbackError) {
        logger.warn({ err: rollbackError }, 'failed to rollback readiness check transaction');
      }
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'unknown error'
      };
    } finally {
      await queryRunner.release();
    }
  }
};

const withTimeout = async <T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout | undefined;
  let didTimeout = false;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    const timer = setTimeout(() => {
      didTimeout = true;
      reject(new Error('timeout'));
    }, timeoutMs);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
    timeoutHandle = timer;
  });

  const operationPromise = operation();

  try {
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    if (didTimeout) {
      operationPromise.catch((error) => {
        logger.debug(
          { err: error instanceof Error ? error : new Error(String(error)) },
          'readiness check resolved after timeout'
        );
      });
    }
  }
};

const buildReadinessResponse = async (requestId: string | undefined) => {
  const entries = Object.entries(readinessChecks);
  const results: Record<string, { ok: boolean; reason?: string }> = {};
  let allHealthy = true;

  await Promise.all(
    entries.map(async ([name, check]) => {
      try {
        const result = await withTimeout(check, READINESS_TIMEOUT_MS);
        results[name] = result;
        if (!result.ok) {
          allHealthy = false;
        }
      } catch (error) {
        allHealthy = false;
        results[name] = {
          ok: false,
          reason: error instanceof Error ? error.message : 'unknown error'
        };
      }
    })
  );

  if (!allHealthy) {
    logger.warn({ requestId, checks: results }, 'readiness check failed');
  }

  return {
    results,
    allHealthy
  };
};

const livenessPayload = () => ({
  status: 'ok',
  uptimeSec: Math.round(process.uptime() * 100) / 100,
  version: appVersion
});

export const livenessHandler = (_req: Request, res: Response): void => {
  res.json(livenessPayload());
};

export const readinessHandler = async (req: Request, res: Response): Promise<void> => {
  const { results, allHealthy } = await buildReadinessResponse(req.requestId);
  if (allHealthy) {
    res.json({
      status: 'ok',
      checks: results
    });
    return;
  }

  res.status(503).json({
    status: 'degraded',
    checks: results
  });
};

export const healthRouter: Router = Router();

healthRouter.get('/health', livenessHandler);
healthRouter.get('/healthz', livenessHandler);
healthRouter.get('/ready', readinessHandler);
