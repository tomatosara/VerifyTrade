import {
  Body,
  Controller,
  Example,
  Get,
  Middlewares,
  OperationId,
  Path,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags
} from 'tsoa';
import { requireAuth, requirePlatformRole } from '@modules/auth/requireAuth';
import { idempotencyMiddleware } from '@middleware/idempotency';
import { confirmRateLimit, verifyVCRateLimit } from '@middleware/rateLimit';
import {
  CancelDto,
  CancelSchema,
  ConfirmDto,
  ConfirmSchema,
  CreateTradeFormDto,
  CreateTradeFormSchema,
  VerifyVcDto,
  VerifyVcSchema,
  TradeFormMinimalView,
  TradeFormView,
  AuditEventView
} from '../dto/tradeform.dto';
import { TradeFormService } from '../service/tradeform.service';
import type { TradeFormStatus } from '../entity/tradeform.entity';
import type { FinalizeResult } from '../persistence/finalize';
import type { ErrorResponse } from '../../../http/dto/error-response';

type AuthenticatedRequest = {
  user?: {
    id: string;
    role: string;
  };
};

@Route('tradeforms')
export class TradeFormController extends Controller {
  private readonly service = new TradeFormService();

  @Post()
  @Tags('TradeForm')
  @OperationId('createTradeForm')
  @Security('bearerAuth')
  @SuccessResponse('201', 'Created')
  @Middlewares([requireAuth, idempotencyMiddleware])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('422', 'Validation error')
  @Example<{ uid: string; status: TradeFormStatus; shareUrl: string }>({
    uid: 'dQ7rFZc1o7g0uX9A1c2b',
    status: 'pending',
    shareUrl: 'https://app.example.com/join/dQ7rFZc1o7g0uX9A1c2b'
  })
  public async createTradeForm(
    @Body() body: CreateTradeFormDto,
    @Request() req: any
  ): Promise<{ uid: string; status: TradeFormStatus; shareUrl: string }> {
    const request = req as AuthenticatedRequest;
    const dto = CreateTradeFormSchema.parse(body);
    const result = await this.service.createTradeForm(dto, request.user!.id);
    this.setStatus(201);
    return result;
  }

  @Get('{uid}')
  @Tags('TradeForm')
  @OperationId('getTradeForm')
  @Security('bearerAuth')
  @Middlewares([requireAuth])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('404', 'Not Found')
  @Response<ErrorResponse>('410', 'Expired')
  @Example<TradeFormView>({
    uid: 'dQ7rFZc1o7g0uX9A1c2b',
    title: 'USDT OTC escrow',
    description: 'P2P escrow with VC verification',
    amount: '1000.00',
    status: 'verified',
    creatorId: '35ad1c74-53f5-4fc2-849e-2e120a6a6ba9',
    counterpartyId: '1fb3ac97-3a92-49aa-8bdb-051a1aec2ae9',
    meta: {},
    createdAt: new Date('2024-06-01T12:00:00.000Z'),
    updatedAt: new Date('2024-06-01T12:30:00.000Z'),
    auditLog: [
      {
        id: '5a9d0bf4-4135-4ca8-8b46-25b8d0f32c4f',
        tradeUid: 'dQ7rFZc1o7g0uX9A1c2b',
        actorId: '35ad1c74-53f5-4fc2-849e-2e120a6a6ba9',
        action: 'create',
        at: new Date('2024-06-01T12:00:00.000Z'),
        details: { title: 'USDT OTC escrow' }
      }
    ]
  })
  public async getTradeForm(
    @Path() uid: string,
    @Request() req: any
  ): Promise<TradeFormView | TradeFormMinimalView> {
    const request = req as AuthenticatedRequest;
    return this.service.getTradeForm(uid, request.user!.id);
  }

  @Post('{uid}/verify-vc')
  @Tags('TradeForm')
  @OperationId('verifyTradeFormCredential')
  @Security('bearerAuth')
  @Middlewares([requireAuth, verifyVCRateLimit, idempotencyMiddleware])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('404', 'Not Found')
  @Response<ErrorResponse>('409', 'Conflict')
  @Example<{ valid: boolean; status: TradeFormStatus; reason?: string }>({
    valid: true,
    status: 'verified'
  })
  public async verifyVc(
    @Path() uid: string,
    @Body() body: VerifyVcDto,
    @Request() req: any
  ): Promise<{ valid: boolean; status: TradeFormStatus; reason?: string }> {
    const dto = VerifyVcSchema.parse(body ?? {});
    const request = req as AuthenticatedRequest;
    const result = await this.service.verifyVC(uid, request.user!.id, dto.credential);
    return result;
  }

  @Post('{uid}/confirm')
  @Tags('TradeForm')
  @OperationId('confirmTradeForm')
  @Security('bearerAuth')
  @Middlewares([requireAuth, confirmRateLimit, idempotencyMiddleware])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('403', 'Forbidden')
  @Response<ErrorResponse>('404', 'Not Found')
  @Response<ErrorResponse>('409', 'Conflict')
  @Example<{ status: TradeFormStatus; finalizeTriggered: boolean }>({
    status: 'confirmed',
    finalizeTriggered: true
  })
  public async confirmTradeForm(
    @Path() uid: string,
    @Body() body: ConfirmDto,
    @Request() req: any
  ): Promise<{ status: TradeFormStatus; finalizeTriggered: boolean }> {
    const dto = ConfirmSchema.parse(body);
    const request = req as AuthenticatedRequest;
    return this.service.confirmTradeForm(uid, request.user!.id, dto);
  }

  @Post('{uid}/cancel')
  @Tags('TradeForm')
  @OperationId('cancelTradeForm')
  @Security('bearerAuth')
  @Middlewares([requireAuth, idempotencyMiddleware])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('403', 'Forbidden')
  @Response<ErrorResponse>('404', 'Not Found')
  @Response<ErrorResponse>('409', 'Conflict')
  @Example<{ status: TradeFormStatus }>({
    status: 'cancelled'
  })
  public async cancelTradeForm(
    @Path() uid: string,
    @Body() body: CancelDto,
    @Request() req: any
  ): Promise<{ status: TradeFormStatus }> {
    const dto = CancelSchema.parse(body ?? {});
    const request = req as AuthenticatedRequest;
    return this.service.cancelTradeForm(uid, request.user!.id, dto);
  }

  @Post('{uid}/finalize')
  @Tags('TradeForm', 'Internal')
  @OperationId('finalizeTradeForm')
  @Security('bearerAuth')
  @Middlewares([requirePlatformRole, idempotencyMiddleware])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('403', 'Forbidden')
  @Response<ErrorResponse>('404', 'Not Found')
  @Response<ErrorResponse>('409', 'Conflict')
  @Example<FinalizeResult>({
    status: 'done',
    meta: {
      finalizedBy: 'platform'
    }
  })
  public async finalizeTradeForm(
    @Path() uid: string,
    @Request() req: any
  ): Promise<FinalizeResult> {
    const request = req as AuthenticatedRequest;
    return this.service.finalize(uid, request.user!.id);
  }

  @Post('{uid}/finalize/retry')
  @Tags('TradeForm', 'Internal')
  @OperationId('retryFinalizeTradeForm')
  @Security('bearerAuth')
  @Middlewares([requirePlatformRole, idempotencyMiddleware])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('403', 'Forbidden')
  @Response<ErrorResponse>('404', 'Not Found')
  @Example<FinalizeResult>({
    status: 'failed',
    meta: {
      finalizedBy: 'platform',
      retry: true
    },
    error: 'Chain configuration missing'
  })
  public async retryFinalizeTradeForm(
    @Path() uid: string,
    @Request() req: any
  ): Promise<FinalizeResult> {
    const request = req as AuthenticatedRequest;
    return this.service.retryFinalize(uid, request.user!.id);
  }

  @Get('{uid}/audit')
  @Tags('Audit')
  @OperationId('getTradeFormAuditLog')
  @Security('bearerAuth')
  @Middlewares([requireAuth])
  @Response<ErrorResponse>('401', 'Unauthorized')
  @Response<ErrorResponse>('403', 'Forbidden')
  @Response<ErrorResponse>('404', 'Not Found')
  @Example<AuditEventView[]>([
    {
      id: '5a9d0bf4-4135-4ca8-8b46-25b8d0f32c4f',
      tradeUid: 'dQ7rFZc1o7g0uX9A1c2b',
      actorId: '35ad1c74-53f5-4fc2-849e-2e120a6a6ba9',
      action: 'create',
      at: new Date('2024-06-01T12:00:00.000Z'),
      details: {
        title: 'USDT OTC escrow'
      }
    }
  ])
  public async getAuditLog(
    @Path() uid: string,
    @Request() req: any
  ): Promise<AuditEventView[]> {
    const request = req as AuthenticatedRequest;
    return this.service.getAuditLog(uid, request.user!.id);
  }

}
