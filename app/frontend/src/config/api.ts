const isProd = import.meta.env.PROD;

const devDefault = 'http://localhost:3000/api/v1';
const configuredBase =
  import.meta.env.VITE_API_BASE_URL_DEV ||
  import.meta.env.VITE_API_BASE_URL ||
  (isProd ? undefined : devDefault);

if (!configuredBase) {
  throw new Error('API base URL is not configured');
}

if (isProd && !configuredBase.startsWith('https://')) {
  throw new Error('In production, API_BASE_URL must use HTTPS to protect transport');
}

export const API_BASE_URL = configuredBase;
