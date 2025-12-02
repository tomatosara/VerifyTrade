import 'reflect-metadata';
import '@config/env';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { constants as tlsConstants } from 'crypto';
import { createApp } from './app';
import { AppDataSource } from '@database/data-source';
import { appConfig } from '@config/app';
import { dbConfig } from '@config/db';
import { logger } from '@utils/logger';
import { buildPublicUrl } from '@utils/url';

// Prevent header manipulation / response splitting by scrubbing values before
// they are written into HTTP headers.
const headerValueAllowList = /[A-Za-z0-9 .,:;=/@%&?_+~#\-\[\]]+/g;
const sanitizeHeaderValue = (value: string): string => {
  const withoutControls = value.replace(/[\r\n]/g, '');
  const cleaned = withoutControls.match(headerValueAllowList)?.join('') ?? '';
  return cleaned;
};

const sanitizePath = (path: string | undefined): string => {
  if (!path) {
    return '/';
  }

  if (/[\r\n]/.test(path)) {
    return '/';
  }

  const ensuredLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const sanitized = sanitizeHeaderValue(ensuredLeadingSlash);
  if (!sanitized.startsWith('/')) {
    return '/';
  }

  return sanitized || '/';
};

async function start() {
  try {
    await initializeDatabaseWithRetry();
    const app = createApp();
    const useLocalHttps = appConfig.devHttps && appConfig.nodeEnv !== 'production';
    const preferHttps = useLocalHttps || appConfig.nodeEnv === 'production';
    const startHttpListener = () => {
      const startCallback = (baseUrl: string, swaggerUrl: string, transportNote: string) => {
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
            transport: transportNote
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
        // HTTP listener is dev-only; in production we either sit behind TLS
        // termination (x-forwarded-proto=https) or we issue a strict redirect.
        // Production traffic must go through HTTPS/TLS termination; this HTTP handler only redirects and never serves app responses.
        const redirectHandler: http.RequestListener = (req, res) => {
          const forwardedProto = Array.isArray(req.headers['x-forwarded-proto'])
            ? req.headers['x-forwarded-proto'][0]
            : (req.headers['x-forwarded-proto'] as string | undefined);
          const isForwardedHttps =
            typeof forwardedProto === 'string' && forwardedProto.trim().toLowerCase() === 'https';
          if (isForwardedHttps) {
            return (app as unknown as http.RequestListener)(req, res);
          }

          const canonicalHost = `${appConfig.host}:${appConfig.port}`;
          const requestHost = Array.isArray(req.headers.host)
            ? req.headers.host[0]
            : req.headers.host;
          const trustedHost =
            requestHost && requestHost.toLowerCase() === canonicalHost.toLowerCase()
              ? requestHost
              : canonicalHost;
          const sanitizedHost = sanitizeHeaderValue(trustedHost) || canonicalHost;
          const sanitizedPath = sanitizePath(req.url);
          const redirectUrl = new URL(sanitizedPath, `https://${sanitizedHost}`);
          const location =
            sanitizeHeaderValue(redirectUrl.toString()) ||
            sanitizeHeaderValue(`https://${canonicalHost}/`);

          res.writeHead(308, {
            Location: location,
            'Strict-Transport-Security': 'max-age=63072000; includeSubDomains'
          });
          res.end();
        };
        const redirectServer = http.createServer(
          { insecureHTTPParser: false },
          redirectHandler
        ); // security report issue
        return redirectServer.listen(appConfig.port, appConfig.host, () => {
          const baseUrl = `https://${displayHost}:${appConfig.port}${basePathSuffix}`;
          startCallback(baseUrl, swaggerUrl, 'HTTP redirect-only; production requires HTTPS');
        });
      }

      // Non-production HTTP listener removed to comply with “use HTTPS” recommendation.
      // Enable DEV_HTTPS with a local cert or run behind TLS termination for local development.
      throw new Error(
        'Plain HTTP listener is disabled in non-production. Set DEV_HTTPS=true with a valid cert or proxy via HTTPS.'
      );
    };

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
              certPath: tlsDetails.certPath,
              keyPath: tlsDetails.keyPath,
              minVersion: tlsOptions.minVersion
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
