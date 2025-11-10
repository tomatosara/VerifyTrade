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
   * 查詢身分證驗證結果
   */
  @Post('/id-card/result')
  @Response(400, 'Invalid transactionId')
  public async getIdCardVerifyResult(
    @Body() body: VerifierResultRequest
  ): Promise<any> {
    return this.service.getIdCardVerifyResult(body.transactionId);
  }

  /**
   * 登入身分證專用 QRCode
   */
  @Get('/id-card/qrcode')
  public async loginIdCardQrcode(): Promise<VerifierQrcodeResponse> {
    return this.service.loginIdCardQrcode();
  }

  /**
   * 查詢身分證驗證結果
   */
  @Post('/trade-form/result')
  @Response(400, 'Invalid transactionId')
  public async getTradeFormVerifyResult(
    @Body() body: VerifierResultRequest
  ): Promise<any> {
    return this.service.getTradeFormVerifyResult(body.transactionId);
  }

  /**
   * 交易表單驗證專用 QRCode
   */
  @Get('/trade-form/qrcode')
  public async verifyTradeFormQrcode(): Promise<VerifierQrcodeResponse> {
    return this.service.verifyTradeFormQrcode();
  }
}
