import axios from 'axios';
import { externalServicesConfig } from '@config/external';

const requireUrl = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`${name} is required to call upstream services`);
  }
  return value;
};

export const axiosVerifier = axios.create({
  baseURL: requireUrl(
    externalServicesConfig.verifierBase,
    'VERIFIER_BASE (HTTPS required in production)'
  ) // e.g. https://verifier-sandbox.wallet.gov.tw
});
axiosVerifier.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {};
  cfg.headers['Access-Token'] = externalServicesConfig.verifierToken!;
  return cfg;
});

export const axiosIssuer = axios.create({
  baseURL: requireUrl(
    externalServicesConfig.issuerBase,
    'ISSUER_BASE (HTTPS required in production)'
  ) // e.g. https://issuer-sandbox.wallet.gov.tw
});
axiosIssuer.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {};
  cfg.headers['Access-Token'] = externalServicesConfig.issuerToken!;
  return cfg;
});
