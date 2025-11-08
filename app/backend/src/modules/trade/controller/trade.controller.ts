import {
  Get,
  Post,
  Route,
  Tags,
  Query,
  Path,
  Security,
  Controller,
  OperationId,
  Request,
  Response,
  SuccessResponse,
  Middlewares,
  Body
} from 'tsoa';
import { TradeService } from '../trade.service';
import { TradeDetailDto } from '../dto/trade-detail.dto';
import { TradeSummaryDto } from '../dto/trade-summary.dto';
import type { ErrorResponse } from '../../../http/dto/error-response';
import { confirmRateLimit } from '@middleware/rateLimit';
import { idempotencyMiddleware } from '@middleware/idempotency';
import { AuthenticatedRequest } from '@middleware/auth';

import { RateTradeRequest, TradeRatingResponse } from "../dto/tradeRating.dto";

@Route('trades')
@Tags('Trades')
export class TradeController extends Controller {
  private service = new TradeService();

  @Get('/')
  @OperationId('getUserTrades')
  @Security('bearerAuth', [])
  @Middlewares([confirmRateLimit, idempotencyMiddleware])
  @Response<ErrorResponse>('401', 'Unauthorized')
  public async getUserTrades(
    @Request() req: AuthenticatedRequest,
    @Query() status?: string,
    @Query() page: number = 1,
    @Query() pageSize: number = 20,
    @Query() from?: string,
    @Query() to?: string,
  ): Promise<{ items: TradeSummaryDto[]; total: number }> {
    return this.service.getUserTrades({
      userId: req.user!.idNumber,
      status,
      page,
      pageSize,
      from,
      to,
    });
  }

  @Get('{uid}')
  @OperationId('getTradeDetail')
  @Security('bearerAuth', [])
  @Middlewares([confirmRateLimit, idempotencyMiddleware])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('403', 'Forbidden')
  @Response<ErrorResponse>('404', 'Not Found')
  public async getTradeDetail(
    @Path() uid: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<TradeDetailDto> {
    return this.service.getTradeDetailForUser(req.user!.idNumber, uid);
  }

@Post('{uid}/rating')
  @OperationId('rateTrade')
  @Security('bearerAuth', []) // 跟上面保持一致，不要用 jwt/ bearerAuth 混用
  @Middlewares([confirmRateLimit, idempotencyMiddleware])
  @SuccessResponse('200', 'OK')
  @Response<ErrorResponse>('400', 'Bad Request')
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('403', 'Forbidden')
  @Response<ErrorResponse>('404', 'Not Found')
  public async rateTrade(
    @Path() uid: string,
    @Request() req: AuthenticatedRequest,
    @Body() body: RateTradeRequest,
  ): Promise<TradeRatingResponse> {
    const stars = body.stars;
    const resultStars = await this.service.rateTrade({
      tradeUid: uid,
      raterIdNumber: req.user!.idNumber, // 你現有邏輯用 idNumber 當 userId
      stars,
    });

    return { tradeUid: uid, stars: resultStars };
  }

}
