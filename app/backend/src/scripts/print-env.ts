import '../config/env.bootstrap';
import { appConfig } from '../config/app';
import { getSecurityConfig } from '../config/security';

const security = getSecurityConfig();

const output = {
  NODE_ENV: appConfig.nodeEnv,
  PORT: appConfig.port,
  JWT_SECRET_SET: Boolean(security.jwtSecret),
  JWT_REFRESH_SECRET_SET: Boolean(security.jwtRefreshSecret)
};

console.log('Loaded env:', output);
