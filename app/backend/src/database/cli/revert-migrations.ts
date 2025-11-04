import '@config/env';
import { AppDataSource } from '@database/data-source';
import { logger } from '@utils/logger';

interface CliOptions {
  revertAll: boolean;
}

function parseOptions(argv: string[] = process.argv): CliOptions {
  const args = argv.slice(2);
  return {
    revertAll: args.includes('--all') || args.includes('-a')
  };
}

async function getLastExecutedMigration() {
  try {
    const rows = await AppDataSource.query(
      'SELECT "id", "name" FROM "migrations" ORDER BY "id" DESC LIMIT 1'
    );
    return rows?.[0] as { id: number; name: string } | undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('relation "migrations" does not exist')) {
      return undefined;
    }
    throw error;
  }
}

async function revertOnce(): Promise<boolean> {
  const last = await getLastExecutedMigration();
  if (!last) {
    return false;
  }

  await AppDataSource.undoLastMigration();
  logger.info({ migration: last.name, id: last.id }, 'reverted migration');
  return true;
}

async function revertMigrations() {
  const options = parseOptions();

  try {
    if (!AppDataSource.isInitialized) {
      logger.info('initializing data source for migration revert');
      await AppDataSource.initialize();
    }

    if (options.revertAll) {
      let total = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const reverted = await revertOnce();
        if (!reverted) {
          break;
        }
        total += 1;
      }
      logger.info({ reverted: total }, 'completed migration revert');
    } else {
      const reverted = await revertOnce();
      if (!reverted) {
        logger.info('no executed migrations to revert');
      }
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

revertMigrations().catch((error) => {
  logger.error({ err: error }, 'migration revert failed');
  process.exitCode = 1;
});
