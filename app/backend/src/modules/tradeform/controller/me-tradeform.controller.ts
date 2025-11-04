import {
  Controller,
  Example,
  Get,
  Middlewares,
  OperationId,
  Queries,
  Request,
  Response,
  Route,
  Security,
  Tags
} from 'tsoa';
import { requireAuth } from '@modules/auth/requireAuth';
import { TradeFormService } from '../service/tradeform.service';
import {
  TradeFormListQuery,
  TradeFormListQueryParams,
  TradeFormListQuerySchema,
  TradeFormListResponse
} from '../dto/tradeform.dto';
import type { ErrorResponse } from '../../../http/dto/error-response';

type AuthenticatedRequest = {
  user?: {
    id: string;
    role: string;
  };
};

@Route('me')
export class MeTradeFormController extends Controller {
  private readonly service = new TradeFormService();

  @Get('tradeforms')
  @Tags('TradeForm')
  @OperationId('listMyTradeForms')
  @Security('bearerAuth')
  @Middlewares([requireAuth])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Example<TradeFormListResponse>({
    data: [
      {
        uid: 'dQ7rFZc1o7g0uX9A1c2b',
        title: 'USDT OTC escrow',
        description: 'P2P escrow with VC verification',
        amount: '1000.00',
        status: 'pending',
        creatorId: '35ad1c74-53f5-4fc2-849e-2e120a6a6ba9',
        counterpartyId: null,
        meta: {},
        createdAt: new Date('2024-06-01T12:00:00.000Z'),
        updatedAt: new Date('2024-06-01T12:00:00.000Z'),
        auditLog: [],
        shareUrl: 'https://app.example.com/join/dQ7rFZc1o7g0uX9A1c2b'
      }
    ],
    page: 1,
    pageSize: 20,
    total: 1
  })
  public async listMyTradeForms(
    @Queries() rawQuery: TradeFormListQueryParams,
    @Request() req: any
  ): Promise<TradeFormListResponse> {
    const request = req as AuthenticatedRequest;
    const query: TradeFormListQuery = TradeFormListQuerySchema.parse(rawQuery ?? {});
    return this.service.listTradeForms(request.user!.id, query);
  }
}
