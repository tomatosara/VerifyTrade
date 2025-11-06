import { Body, Controller, Get, Post, Query, Route, Tags, Response } from 'tsoa';
import VerifierService from '@modules/verifier/service/verifier.service';

interface VerifierQrcodeResponse {
  transactionId: string;
  qrcodeImage: string;
  authUri: string;
}

interface VerifierResultRequest {
  transactionId: string;
}

@Route('verifier')
@Tags('Verifier')
export class VerifierController extends Controller {
  private service: VerifierService;

  constructor() {
    super();
    this.service = new VerifierService();
    console.log('VerifierService import:', this.service);
  }

  /**
   * 建立驗證 QR Code
   */
  @Post('/qrcode')
  @Response(400, 'Invalid ref')
  public async createQrcode(
    @Body() body: { ref: string }
  ): Promise<VerifierQrcodeResponse> {
    return this.service.createQrcode(body.ref);
  }

  /**
   * 查詢驗證結果
   */
  @Post('/result')
  @Response(400, 'Invalid transactionId')
  public async getResult(
    @Body() body: VerifierResultRequest
  ): Promise<any> {
    return this.service.getResult(body.transactionId);
  }

  /**
   * 登入身分證專用 QRCode
   */
  @Get('/id-card/qrcode')
  public async loginIdCardQrcode(): Promise<VerifierQrcodeResponse> {
    return this.service.loginIdCardQrcode();
  }
}
