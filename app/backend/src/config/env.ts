import { config as loadEnv } from 'dotenv';
import path from 'path';

const explicitPath = process.env.DOTENV_CONFIG_PATH;
const envFile =
  explicitPath ??
  (process.env.NODE_ENV === 'test'
    ? path.resolve(process.cwd(), '.env.test')
    : path.resolve(process.cwd(), '.env'));

loadEnv({ path: envFile });
