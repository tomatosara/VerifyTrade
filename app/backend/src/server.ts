import 'reflect-metadata';
import '@config/env';
import fs from 'fs';
import https from 'https';
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
    const useLocalHttps = appConfig.devHttps && appConfig.nodeEnv !== 'production';
    const preferHttps = useLocalHttps || appConfig.nodeEnv === 'production';
    const startHttpListener = () =>
      app.listen(appConfig.port, appConfig.host, () => {
        const swaggerUrl = buildPublicUrl({
          host: appConfig.host,
          port: appConfig.port,
          https: preferHttps,
          basePath: appConfig.basePath,
          swaggerPath: appConfig.swaggerPath
        });

        const displayHost =
          appConfig.host === '0.0.0.0' || appConfig.host === '::'
            ? 'localhost'
            : appConfig.host;
        const protocol = preferHttps ? 'https' : 'http';
        const basePathSuffix = appConfig.basePath === '/' ? '' : appConfig.basePath;
        const baseUrl = `${protocol}://${displayHost}:${appConfig.port}${basePathSuffix}`;

        const transportNote = useLocalHttps
          ? 'HTTPS (dev self-managed certificate)'
          : 'HTTP listener behind upstream TLS termination';

        const lines = [
          '',
          '*** Backend is running ***',
          `   Base URL     : ${baseUrl}`,
          `   Swagger-UI   : ${swaggerUrl}`,
          `   Transport    : ${transportNote}`,
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
            swaggerUrl,
            transport: appConfig.devHttps ? 'https' : 'http'
          },
          'backend server started'
        );
      });

    if (useLocalHttps) {
      try {
        const tlsOptions = loadLocalTlsCredentials();
        const server = https.createServer(tlsOptions, app);
        server.listen(appConfig.port, appConfig.host, () => {
          const swaggerUrl = buildPublicUrl({
            host: appConfig.host,
            port: appConfig.port,
            https: true,
            basePath: appConfig.basePath,
            swaggerPath: appConfig.swaggerPath
          });

          const displayHost =
            appConfig.host === '0.0.0.0' || appConfig.host === '::'
              ? 'localhost'
              : appConfig.host;
          const basePathSuffix = appConfig.basePath === '/' ? '' : appConfig.basePath;
          const baseUrl = `https://${displayHost}:${appConfig.port}${basePathSuffix}`;
          logger.info(
            {
              port: appConfig.port,
              host: appConfig.host,
              env: appConfig.nodeEnv,
              baseUrl,
              swaggerUrl,
              transport: 'https',
              certPath: tlsOptions.certPath,
              keyPath: tlsOptions.keyPath
            },
            'backend server started with HTTPS'
          );
          console.log(
            [
              '',
              '*** Backend is running over HTTPS ***',
              `   Base URL     : ${baseUrl}`,
              `   Swagger-UI   : ${swaggerUrl}`,
              ''
            ].join('\n')
          );
        });
      } catch (tlsError) {
        logger.warn(
          { err: tlsError },
          'Failed to start HTTPS dev server; falling back to HTTP. Provide DEV_TLS_CERT_PATH/DEV_TLS_KEY_PATH to enable HTTPS locally.'
        );
        startHttpListener();
      }
    } else {
      startHttpListener();
    }
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

function loadLocalTlsCredentials(): {
  key: Buffer;
  cert: Buffer;
  keyPath: string;
  certPath: string;
} {
  const keyPath = appConfig.devTlsKeyPath ?? 'certs/dev.key';
  const certPath = appConfig.devTlsCertPath ?? 'certs/dev.crt';
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    throw new Error(
      `Missing TLS key/cert for dev HTTPS. Expected key at ${keyPath} and cert at ${certPath}.`
    );
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    keyPath,
    certPath
  };
}
