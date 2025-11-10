import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  OperationId,
  Path,
  Post,
  Put,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags
} from 'tsoa';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { TradeFormService } from '../tradeform.service';
import { CreateTradeFormDto } from '../dto/create-trade-form.dto';
import { UpdateTradeFormDto } from '../dto/update-trade-form.dto';
import { TradeFormResponse, TradeFormViewResponse } from '../dto/trade-form.response';
import { UnauthorizedError, ValidationError } from '@utils/errors';
import { ConfirmTradeResponseDto } from '../dto/trade-form.actions.dto';
import type { ErrorResponse } from '../../../http/dto/error-response';
import { confirmRateLimit } from '@middleware/rateLimit';
import { idempotencyMiddleware } from '@middleware/idempotency';
import type { AuthenticatedRequest } from '@middleware/auth';

@Route('tradeforms')
@Tags('TradeForm')
export class TradeFormController extends Controller {
  private readonly service: TradeFormService;

  constructor(service: TradeFormService = new TradeFormService()) {
    super();
    this.service = service;
  }

  @Post()
  @OperationId('createTradeForm')
  @Security('bearerAuth', [])
  @SuccessResponse('201', 'Created')
  @Response<ErrorResponse>('422', 'Validation error')
  @Response<ErrorResponse>('409', 'Trade UID already exists')
  public async create(
    @Body() body: CreateTradeFormDto,
    @Request() req: AuthenticatedRequest
  ): Promise<TradeFormResponse> {
    try {
      if (!req.user?.idNumber) {
        throw new UnauthorizedError();
      }
      const result = await this.service.create(body, req.user.idNumber, req.user.id);
      this.setStatus(201);
      return result;
    } catch (error) {
      throw mapValidationError(error);
    }
  }

  @Put('{uid}')
  @OperationId('updateTradeForm')
  @Security('bearerAuth', [])
  public async update(
    @Path() uid: string,
    @Body() body: UpdateTradeFormDto
  ): Promise<TradeFormResponse> {
    try {
      return await this.service.update(uid, body);
    } catch (error) {
      throw mapValidationError(error);
    }
  }

  @Get('uid/{uid}')
  @OperationId('viewTradeFormByUid')
  @Security('bearerAuth', [])
  @Response<ErrorResponse>('404', 'Not Found')
  public async viewByUid(
    @Path() uid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<TradeFormViewResponse> {
    return this.service.findByUidForActor(uid, req.user?.idNumber ?? null);
  }

  @Delete('{id}')
  @OperationId('deleteTradeForm')
  @Security('bearerAuth', [])
  @Response<undefined>('204', 'Deleted')
  public async remove(@Path() id: number): Promise<void> {
    await this.service.remove(id);
    this.setStatus(204);
  }

  @Post('{uid}/confirm')
  @OperationId('confirmTradeForm')
  @Security('bearerAuth', [])
  @Middlewares([confirmRateLimit, idempotencyMiddleware])
  @Response<ErrorResponse>('404', 'Not Found')
  @Response<ErrorResponse>(
    '403',
    'Forbidden – Only participants may confirm; User 2 must have a valid VC'
  )
  @Response<ErrorResponse>('409', 'Conflict – Trade status or counterparty mismatch')
  public async confirm(
    @Path() uid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<ConfirmTradeResponseDto> {
    if (!req.user?.idNumber) {
      throw new UnauthorizedError();
    }

    return this.service.confirm(uid, req.user.idNumber, req.user.id);
  }
}

function mapValidationError(error: unknown): unknown {
  if (Array.isArray(error) && error[0] instanceof ClassValidatorError) {
    const details = error.map((err) => ({
      property: err.property,
      constraints: err.constraints
    }));
    return new ValidationError('Validation failed', details);
  }

  return error;
}
