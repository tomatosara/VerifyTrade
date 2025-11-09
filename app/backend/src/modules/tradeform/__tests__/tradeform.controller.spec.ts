import 'reflect-metadata';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { TradeFormController } from '../controller/tradeform.controller';
import { TradeFormService } from '../tradeform.service';
import { UnauthorizedError, ValidationError } from '@utils/errors';
import { TradeFormResponse } from '../dto/trade-form.response';
import {
  TradeFormChannel,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '../enums/TradeFormEnums';
import type { AuthenticatedRequest } from '@middleware/auth';

const makeResponse = (): TradeFormResponse => ({
  id: 1,
  uid: 'trade-abc',
  creatorId: 'A131095852',
  counterpartyId: null,
  creatorVerifiedIdentities: ['tw_national_id'],
  itemName: 'Ledger',
  itemDescription: 'Like new',
  itemCondition: TradeFormItemCondition.NEW,
  amount: '10',
  tradeChannel: TradeFormChannel.P2P,
  paymentMethod: TradeFormPaymentMethod.BANK_TRANSFER,
  matchmakingChannel: TradeFormMatchmakingChannel.IN_APP,
  identityRequirements: ['tw_national_id'],
  userRating: 0,
  status: 'pending',
  meta: {},
  confirmedByUser1: false,
  confirmedByUser2: false,
  vcVerifiedAt: null,
  uidExpiresAt: null,
  finalizedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

describe('TradeFormController.create', () => {
  const body = {
    uid: 'trade-abc',
    creatorId: 'A131095852',
    creatorVerifiedIdentities: ['tw_national_id'],
    itemName: 'Ledger',
    itemDescription: 'Like new',
    itemCondition: TradeFormItemCondition.NEW,
    amount: '10',
    tradeChannel: TradeFormChannel.P2P,
    paymentMethod: TradeFormPaymentMethod.BANK_TRANSFER,
    matchmakingChannel: TradeFormMatchmakingChannel.IN_APP,
    identityRequirements: ['tw_national_id']
  };

  it('passes payload to the service and returns response', async () => {
    const service = {
      create: jest.fn().mockResolvedValue(makeResponse())
    } as unknown as TradeFormService;

    const controller = new TradeFormController(service);
    const req = { user: { idNumber: 'A131095852', id: 'user-uuid' } } as AuthenticatedRequest;

    const result = await controller.create(body, req);
    expect(result.uid).toBe('trade-abc');
    expect(service.create).toHaveBeenCalledWith(body, 'A131095852', 'user-uuid');
  });

  it('throws UnauthorizedError when request user missing', async () => {
    const service = {
      create: jest.fn()
    } as unknown as TradeFormService;
    const controller = new TradeFormController(service);

    await expect(
      controller.create(body, {} as AuthenticatedRequest)
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('maps class-validator errors to ValidationError', async () => {
    const classError = new ClassValidatorError();
    classError.property = 'amount';
    classError.constraints = { matches: 'invalid' };

    const service = {
      create: jest.fn().mockRejectedValue([classError])
    } as unknown as TradeFormService;

    const controller = new TradeFormController(service);
    const req = { user: { idNumber: 'A131095852', id: 'user-uuid' } } as AuthenticatedRequest;

    await expect(controller.create(body, req)).rejects.toBeInstanceOf(ValidationError);
  });
});
