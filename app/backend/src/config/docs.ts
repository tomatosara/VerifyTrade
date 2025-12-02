import './env.bootstrap';
import { z } from 'zod';
import { appConfig } from './app';

const docsConfigSchema = z.object({
  API_BASE_URL: z.string().url(),
  SWAGGER_TITLE: z.string().min(1),
  SWAGGER_VERSION: z.string().min(1)
});

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';
const apiBaseUrl = process.env.API_BASE_URL ?? `http://localhost:${appConfig.port}`;

if (isProd && !apiBaseUrl.startsWith('https://')) {
  throw new Error('In production, API_BASE_URL must use HTTPS for Swagger/docs links');
}

const parsed = docsConfigSchema.parse({
  API_BASE_URL: apiBaseUrl,
  SWAGGER_TITLE: process.env.SWAGGER_TITLE ?? 'Trading Platform API',
  SWAGGER_VERSION: process.env.SWAGGER_VERSION ?? '1.0.0'
});

export const docsConfig = {
  apiBaseUrl: parsed.API_BASE_URL,
  swaggerTitle: parsed.SWAGGER_TITLE,
  swaggerVersion: parsed.SWAGGER_VERSION
} as const;

export type DocsConfig = typeof docsConfig;
