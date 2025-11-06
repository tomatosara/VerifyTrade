import '../config/env.bootstrap';
import { env } from '../config/app';

const output = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  JWT_SECRET_SET: Boolean(env.JWT_SECRET)
};

console.log('Loaded env:', output);
