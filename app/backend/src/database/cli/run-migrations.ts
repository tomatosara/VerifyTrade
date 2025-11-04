import '@config/env';
import { AppDataSource } from '@database/data-source';
import { logger } from '@utils/logger';

async function runMigrations() {
  try {
    if (!AppDataSource.isInitialized) {
      logger.info('initializing data source for migrations');
      await AppDataSource.initialize();
    }

    const executed = await AppDataSource.runMigrations();
    const applied = executed.map((migration) => migration.name);

    if (applied.length) {
      logger.info({ migrations: applied }, 'applied pending migrations');
    } else {
      logger.info('no pending migrations');
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runMigrations().catch((error) => {
  logger.error({ err: error }, 'migration run failed');
  process.exitCode = 1;
});
