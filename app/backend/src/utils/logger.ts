import pino from 'pino';
import { featureFlags } from '@config/featureFlags';

export const logger = pino({
  level: featureFlags.logLevel
});

export type Logger = typeof logger;
