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
  Queries,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags
} from 'tsoa';
import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError as ClassValidatorError } from 'class-validator';
import { TradeFormService } from '../tradeform.service';
import { CreateTradeFormDto } from '../dto/create-trade-form.dto';
import { UpdateTradeFormDto } from '../dto/update-trade-form.dto';
import {
  TradeFormListQuery,
  TradeFormListResponse,
  TradeFormResponse,
  TradeFormViewResponse
} from '../dto/trade-form.response';
import { TradeFormQueryDto } from '../dto/trade-form-query.dto';
import { UnauthorizedError, ValidationError } from '@utils/errors';
import { VerifyVcRequestDto, VerifyVcResponseDto, ConfirmTradeResponseDto } from '../dto/trade-form.actions.dto';
import type { ErrorResponse } from '../../../http/dto/error-response';
import { verifyVCRateLimit, confirmRateLimit } from '@middleware/rateLimit';
import { idempotencyMiddleware } from '@middleware/idempotency';

type AuthenticatedRequest = {
  user?: {
    id: string;
  };
};

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
  public async create(
    @Body() body: CreateTradeFormDto,
    @Request() req: AuthenticatedRequest
  ): Promise<TradeFormResponse> {
    try {
      const result = await this.service.create(body, req.user?.id ?? null);
      this.setStatus(201);
      return result;
    } catch (error) {
      throw mapValidationError(error);
    }
  }

  @Get()
  @OperationId('listTradeForms')
  @Security('bearerAuth', [])
  public async list(
    @Queries() query: TradeFormListQuery
  ): Promise<TradeFormListResponse> {
    try {
      const dto = plainToInstance(TradeFormQueryDto, query ?? {});
      await validateOrReject(dto, { whitelist: true });
      return this.service.findAll(dto);
    } catch (error) {
      throw mapValidationError(error);
    }
  }

  @Get('{id}')
  @OperationId('getTradeForm')
  @Security('bearerAuth', [])
  @Response<ErrorResponse>('404', 'Not Found')
  public async findOne(@Path() id: number): Promise<TradeFormResponse> {
    return this.service.findOne(id);
  }

  @Get('uid/{uid}')
  @OperationId('viewTradeFormByUid')
  @Security('bearerAuth', [])
  @Response<ErrorResponse>('404', 'Not Found')
  public async viewByUid(
    @Path() uid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<TradeFormViewResponse> {
    return this.service.findByUidForActor(uid, req.user?.id ?? null);
  }

  @Put('{id}')
  @OperationId('updateTradeForm')
  @Security('bearerAuth', [])
  public async update(
    @Path() id: number,
    @Body() body: UpdateTradeFormDto
  ): Promise<TradeFormResponse> {
    try {
      return await this.service.update(id, body);
    } catch (error) {
      throw mapValidationError(error);
    }
  }

  @Delete('{id}')
  @OperationId('deleteTradeForm')
  @Security('bearerAuth', [])
  @Response<undefined>('204', 'Deleted')
  public async remove(@Path() id: number): Promise<void> {
    await this.service.remove(id);
    this.setStatus(204);
  }

  @Post('{uid}/verify-vc')
  @OperationId('verifyTradeFormVc')
  @Security('bearerAuth', [])
  @Middlewares([verifyVCRateLimit, idempotencyMiddleware])
  @Response<ErrorResponse>('404', 'Not Found')
  @Response<ErrorResponse>(
    '403',
    'Forbidden – VC requirement not met or caller not allowed'
  )
  @Response<ErrorResponse>('409', 'Conflict – Trade is not in a verifiable state')
  @Response<ErrorResponse>('410', 'Gone – Trade UID expired')
  @Response<ErrorResponse>('422', 'Invalid VC proof payload')
  public async verifyVc(
    @Path() uid: string,
    @Body() body: VerifyVcRequestDto,
    @Request() req: AuthenticatedRequest
  ): Promise<VerifyVcResponseDto> {
    if (!req.user?.id) {
      throw new UnauthorizedError();
    }
    return this.service.verifyVc(uid, req.user.id, body?.vcProof);
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
    if (!req.user?.id) {
      throw new UnauthorizedError();
    }

    return this.service.confirm(uid, req.user.id);
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
