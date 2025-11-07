// src/modules/issuer/controller/issuer.controller.ts
import { Body, Controller, Get, Path, Post, Route, SuccessResponse, Tags } from 'tsoa';
import IssuerService from '@modules/issuer/service/issuer.service';

interface QrcodeDataBody { /* 依你 service 參數 */ }
interface QrcodeNoDataBody { /* 依你 service 參數 */ }

@Tags('Issuer')
@Route('Issuer')
export class IssuerController extends Controller {
  private svc = new IssuerService();

  @SuccessResponse('201', 'Created')
  @Post('qrcode-data')
  async qrcodeData(@Body() body: QrcodeDataBody) {
    this.setStatus(201);
    return this.svc.qrcodeData(body);
  }

  @SuccessResponse('201', 'Created')
  @Post('qrcode-nodata')
  async qrcodeNoData(@Body() body: QrcodeNoDataBody) {
    this.setStatus(201);
    return this.svc.qrcodeNoData(body);
  }

  @Get('credential/nonce/{transactionId}')
  async getCredentialNonce(@Path() transactionId: string) {
    return this.svc.getCredentialNonce(transactionId);
  }
}
