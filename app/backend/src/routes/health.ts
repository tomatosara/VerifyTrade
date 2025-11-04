import { Router } from 'express';
import { AppDataSource } from '@database/data-source';
import { logger } from '@utils/logger';

export const healthRouter: Router = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

healthRouter.get('/db', async (_req, res) => {
  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ ok: false, error: 'database not ready' });
    }

    await AppDataSource.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    logger.error({ err: error }, 'database health check failed');
    res.status(503).json({
      ok: false,
      error: error instanceof Error ? error.message : 'unknown error'
    });
  }
});
