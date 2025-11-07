import 'reflect-metadata';
import '@config/env';
import { createApp } from './app';
import { AppDataSource } from '@database/data-source';
import { appConfig } from '@config/app';
import { dbConfig } from '@config/db';
import { logger } from '@utils/logger';
import { buildPublicUrl } from '@utils/url';

async function start() {
  try {
    await initializeDatabaseWithRetry();
    const app = createApp();
    app.listen(appConfig.port, appConfig.host, () => {
      const swaggerUrl = buildPublicUrl({
        host: appConfig.host,
        port: appConfig.port,
        https: appConfig.devHttps,
        basePath: appConfig.basePath,
        swaggerPath: appConfig.swaggerPath
      });

      const displayHost =
        appConfig.host === '0.0.0.0' || appConfig.host === '::'
          ? 'localhost'
          : appConfig.host;
      const protocol = appConfig.devHttps ? 'https' : 'http';
      const basePathSuffix = appConfig.basePath === '/' ? '' : appConfig.basePath;
      const baseUrl = `${protocol}://${displayHost}:${appConfig.port}${basePathSuffix}`;

      const lines = [
        '',
        '*** Backend is running ***',
        `   Base URL     : ${baseUrl}`,
        `   Swagger-UI   : ${swaggerUrl}`,
        '',
        'Tip: If running inside Docker with port forwarding, open the link above from your host machine.',
        ''
      ];
      console.log(lines.join('\n'));

      logger.info(
        {
          port: appConfig.port,
          host: appConfig.host,
          env: appConfig.nodeEnv,
          baseUrl,
          swaggerUrl
        },
        'backend server started'
      );
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

void start();

async function initializeDatabaseWithRetry(): Promise<void> {
  const maxAttempts = Number(process.env.DB_INIT_MAX_ATTEMPTS ?? 10);
  const baseDelayMs = Number(process.env.DB_INIT_RETRY_DELAY_MS ?? 3000);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      logger.info({ db: dbConfig.connectionInfo }, 'database connection established');

      const migrations = await AppDataSource.runMigrations({ transaction: 'all' });
      logger.info(
        { appliedMigrations: migrations.length },
        'database migrations applied'
      );

      return;
    } catch (error) {
      logger.warn(
        {
          attempt,
          maxAttempts,
          retryInMs: baseDelayMs * attempt,
          err: error
        },
        'database initialization failed; retrying'
      );

      if (AppDataSource.isInitialized) {
        try {
          await AppDataSource.destroy();
        } catch (destroyError) {
          logger.warn({ err: destroyError }, 'failed to dispose datasource after error');
        }
      }

      if (attempt === maxAttempts) {
        throw error;
      }

      await delay(baseDelayMs * attempt);
    }
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
