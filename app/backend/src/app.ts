import 'express-async-errors';
import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestIdMiddleware } from '@middleware/requestId';
import { loggingMiddleware } from '@middleware/logging';
import { errorHandler } from '@middleware/errorHandler';
import { healthRouter } from './routes/health';
import { RegisterRoutes } from './http/routes';
import { appConfig } from '@config/app';
import { registerSwagger } from './docs/swagger';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  app.set('trust proxy', appConfig.trustProxy);

  const isProduction = appConfig.nodeEnv === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? undefined
        : {
            useDefaults: true,
            directives: {
              upgradeInsecureRequests: null
            }
          },
      hsts: isProduction ? undefined : false
    })
  );

  if (isProduction) {
    const docsCsp = helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"]
      }
    });
    // Swagger UI relies on inline scripts/styles; scope the relaxed CSP to the docs route only.
    app.use(appConfig.swaggerPath, docsCsp);
  } else {
    app.use(appConfig.swaggerPath, (_req, res, next) => {
      // Safari upgrades Swagger assets to HTTPS if CSP advertises upgrade-insecure-requests; strip it in dev.
      res.removeHeader('Content-Security-Policy');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';"
      );
      next();
    });
  }

  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.use(loggingMiddleware);

  app.use('/health', healthRouter);

  registerSwagger(app, appConfig.swaggerPath);

  RegisterRoutes(app);

  app.use(errorHandler);

  return app;
}
