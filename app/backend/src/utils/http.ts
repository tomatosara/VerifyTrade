import axios from 'axios';

export const axiosVerifier = axios.create({
  baseURL: process.env.VERIFIER_BASE, // e.g. https://verifier-sandbox.wallet.gov.tw
});
axiosVerifier.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {};
  cfg.headers['Access-Token'] = process.env.VERIFIER_TOKEN!;
  return cfg;
});

export const axiosIssuer = axios.create({
  baseURL: process.env.ISSUER_BASE,   // e.g. https://issuer-sandbox.wallet.gov.tw
});
axiosIssuer.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {};
  cfg.headers['Access-Token'] = process.env.ISSUER_TOKEN!;
  return cfg;
});
