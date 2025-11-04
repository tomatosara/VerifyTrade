import type { Express, NextFunction, Request, Response } from 'express';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerUiDist from 'swagger-ui-dist';
import type { OpenAPIV3_1 } from 'openapi-types';
import { buildSwaggerServerUrl, swaggerConfiguredServerUrl, swaggerSpec } from './openapi';

type RequestWithSwaggerDoc = Request & {
  swaggerDoc?: OpenAPIV3_1.Document;
};

const swaggerAssetsPath =
  typeof swaggerUiDist.getAbsoluteFSPath === 'function'
    ? swaggerUiDist.getAbsoluteFSPath()
    : swaggerUiDist();

const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    displayRequestDuration: true,
    persistAuthorization: true
  }
};

const cloneDocument = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const resolveServers = (req: Request): OpenAPIV3_1.ServerObject[] => {
  const host = req.get('host');
  if (host) {
    const protocol = req.protocol;
    return [
      {
        url: buildSwaggerServerUrl(`${protocol}://${host}`),
        description: 'Resolved from current request'
      }
    ];
  }

  return [
    {
      url: swaggerConfiguredServerUrl,
      description: 'Configured API base URL'
    }
  ];
};

const injectDynamicSpec = (
  req: RequestWithSwaggerDoc,
  _res: Response,
  next: NextFunction
) => {
  const spec = cloneDocument(swaggerSpec);
  spec.servers = resolveServers(req);
  req.swaggerDoc = spec;
  next();
};

const resolveMountPath = (value: string): string => {
  if (!value) {
    return '/docs';
  }

  if (value === '/') {
    return '/';
  }

  const ensured = value.startsWith('/') ? value : `/${value}`;
  return ensured.replace(/\/+$/, '');
};

export const registerSwagger = (app: Express, mountPath?: string): void => {
  const swaggerMountPath = resolveMountPath(mountPath ?? '/docs');
  const router = express.Router();

  router.use(
    '/static',
    express.static(swaggerAssetsPath, {
      immutable: app.get('env') === 'production',
      maxAge: app.get('env') === 'production' ? '1y' : 0
    })
  );

  router.use(
    '/',
    swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions),
    injectDynamicSpec,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
  );

  app.use(swaggerMountPath, router);
  app.get('/openapi.json', (req, res) => {
    const spec = cloneDocument(swaggerSpec);
    spec.servers = resolveServers(req);
    res.json(spec);
  });
};
