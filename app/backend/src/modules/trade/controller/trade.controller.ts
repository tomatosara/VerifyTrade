import {
  Get,
  Route,
  Tags,
  Query,
  Path,
  Security,
  Controller,
  OperationId,
  Request,
  Response,
  Middlewares
} from 'tsoa';
import { TradeService } from '../trade.service';
import { TradeDetailDto } from '../dto/trade-detail.dto';
import { TradeSummaryDto } from '../dto/trade-summary.dto';
import type { ErrorResponse } from '../../../http/dto/error-response';
import { confirmRateLimit } from '@middleware/rateLimit';
import { idempotencyMiddleware } from '@middleware/idempotency';
import { AuthenticatedRequest } from '@middleware/auth';

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
}
