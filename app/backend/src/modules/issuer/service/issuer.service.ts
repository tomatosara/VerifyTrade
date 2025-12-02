// src/modules/issuer/service/issuer.service.ts
import { axiosIssuer } from '@utils/http';

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
