// src/modules/issuer/service/issuer.service.ts
import axios from 'axios';

const axiosIssuer = axios.create({ baseURL: process.env.ISSUER_BASE });
axiosIssuer.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {};
  cfg.headers['Access-Token'] = process.env.ISSUER_TOKEN;
  return cfg;
});

export default class IssuerService {
  async qrcodeData(body: any) {
    const { data } = await axiosIssuer.post('/api/qrcode/data', body);
    return data;
  }

  async qrcodeNoData(body: any) {
    const { data } = await axiosIssuer.post('/api/qrcode/nodata', body);
    return data;
  }

  async getCredentialNonce(transactionId: string) {
    const { data } = await axiosIssuer.get(`/api/credential/nonce/${transactionId}`);
    return data;
  }
}
