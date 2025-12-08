import 'reflect-metadata';
import '@config/env';
import fs from 'fs';
import https from 'https';
import { constants as tlsConstants } from 'crypto';
import path from 'path';
import { createApp } from './app';
import { AppDataSource } from '@database/data-source';
import { appConfig } from '@config/app';
import { dbConfig } from '@config/db';
import { logger } from '@utils/logger';
import { buildPublicUrl } from '@utils/url';

const TLS_BASE_DIR = path.join(__dirname, '..', 'certs');
const TLS_KNOWN_PATHS: Record<string, string> = {
  defaultKey: path.join(TLS_BASE_DIR, 'server.key'),
  defaultCert: path.join(TLS_BASE_DIR, 'server.crt'),
  devKey: path.join(TLS_BASE_DIR, 'dev.key'),
  devCert: path.join(TLS_BASE_DIR, 'dev.crt')
};

async function start() {
  try {
    await initializeDatabaseWithRetry();
    const app = createApp();
    const useLocalHttps = appConfig.devHttps && appConfig.nodeEnv !== 'production';
    const preferHttps = useLocalHttps || appConfig.nodeEnv === 'production';
    const startCallback = (
      baseUrl: string,
      swaggerUrl: string,
      transportNote: string,
      banner: string = '*** Backend is running ***',
      extraLog: Record<string, unknown> = {}
    ) => {
      const lines = [
        '',
        banner,
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
          transport: transportNote,
          ...extraLog
        },
        'backend server started'
      );
    };

    const displayHost =
      appConfig.host === '0.0.0.0' || appConfig.host === '::' ? 'localhost' : appConfig.host;
    const basePathSuffix = appConfig.basePath === '/' ? '' : appConfig.basePath;
    const swaggerUrl = buildPublicUrl({
      host: appConfig.host,
      port: appConfig.port,
      https: preferHttps,
      basePath: appConfig.basePath,
      swaggerPath: appConfig.swaggerPath
    });

    if (appConfig.nodeEnv === 'production') {
      const tlsDetails = loadProductionTlsCredentials();
      const tlsOptions: https.ServerOptions = {
        key: tlsDetails.key,
        cert: tlsDetails.cert,
        minVersion: 'TLSv1.2',
        secureOptions:
          tlsConstants.SSL_OP_NO_SSLv2 |
          tlsConstants.SSL_OP_NO_SSLv3 |
          tlsConstants.SSL_OP_NO_TLSv1 |
          tlsConstants.SSL_OP_NO_TLSv1_1
      };

      const server = https.createServer(tlsOptions, app);
      server.listen(appConfig.port, appConfig.host, () => {
        const baseUrl = `https://${displayHost}:${appConfig.port}${basePathSuffix}`;
        startCallback(baseUrl, swaggerUrl, 'HTTPS (TLSv1.2+)', undefined, {
          certPath: tlsDetails.certPath,
          keyPath: tlsDetails.keyPath,
          minVersion: tlsOptions.minVersion
        });
      });
      return;
    }

    if (useLocalHttps) {
      try {
        const tlsDetails = loadLocalTlsCredentials();
        const tlsOptions: https.ServerOptions = {
          key: tlsDetails.key,
          cert: tlsDetails.cert,
          minVersion: 'TLSv1.2',
          secureOptions:
            tlsConstants.SSL_OP_NO_SSLv2 |
            tlsConstants.SSL_OP_NO_SSLv3 |
            tlsConstants.SSL_OP_NO_TLSv1 |
            tlsConstants.SSL_OP_NO_TLSv1_1
        };
        const server = https.createServer(tlsOptions, app);
        server.listen(appConfig.port, appConfig.host, () => {
          const baseUrl = `https://${displayHost}:${appConfig.port}${basePathSuffix}`;
          startCallback(
            baseUrl,
            swaggerUrl,
            'HTTPS (TLSv1.2+)',
            '*** Backend is running over HTTPS ***',
            {
              certPath: tlsDetails.certPath,
              keyPath: tlsDetails.keyPath,
              minVersion: tlsOptions.minVersion
            }
          );
        });
      } catch (tlsError) {
        logger.warn(
          { err: tlsError },
          'Failed to start HTTPS dev server. Provide DEV_TLS_CERT_PATH/DEV_TLS_KEY_PATH to enable HTTPS locally.'
        );
        throw tlsError;
      }
    } else {
      throw new Error(
        'Plain HTTP listener is disabled. Set DEV_HTTPS=true with a valid cert or proxy via HTTPS.'
      );
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

function resolveTlsFromId(
  envValue: string | undefined,
  envName: string,
  defaultId: string
): string {
  const id = (envValue ?? defaultId).trim();
  if (!Object.prototype.hasOwnProperty.call(TLS_KNOWN_PATHS, id)) {
    throw new Error(`${envName} must be one of: ${Object.keys(TLS_KNOWN_PATHS).join(', ')}`);
  }
  return TLS_KNOWN_PATHS[id];
}

function loadProductionTlsCredentials(): {
  key: Buffer;
  cert: Buffer;
  keyPath: string;
  certPath: string;
} {
  const keyPath = resolveTlsFromId(process.env.TLS_KEY_PATH, 'TLS_KEY_PATH', 'defaultKey');
  const certPath = resolveTlsFromId(process.env.TLS_CERT_PATH, 'TLS_CERT_PATH', 'defaultCert');

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    throw new Error(
      `Missing TLS key/cert for production HTTPS. Expected key at ${keyPath} and cert at ${certPath}.`
    );
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    keyPath,
    certPath
  };
}

function loadLocalTlsCredentials(): {
  key: Buffer;
  cert: Buffer;
  keyPath: string;
  certPath: string;
} {
  const keyPath = resolveTlsFromId(appConfig.devTlsKeyPath, 'DEV_TLS_KEY_PATH', 'devKey');
  const certPath = resolveTlsFromId(appConfig.devTlsCertPath, 'DEV_TLS_CERT_PATH', 'devCert');

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
