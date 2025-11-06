import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTradeFormDto } from '../dto/create-trade-form.dto';
import { UpdateTradeFormDto } from '../dto/update-trade-form.dto';
import {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '../entity/trade-form.entity';

const validPayload = {
  creatorVerifiedIdentities: ['StudentID'],
  itemName: 'iPad Pro 11"',
  itemDescription: '盒裝完整，含原廠鍵盤',
  itemCondition: TradeFormItemCondition.LIKE_NEW,
  amount: '22000',
  tradeChannel: TradeFormChannel.IN_PERSON,
  paymentMethod: TradeFormPaymentMethod.BANK_TRANSFER,
  matchmakingChannel: TradeFormMatchmakingChannel.SOCIAL_PLATFORM,
  identityRequirements: [
    TradeFormIdentityRequirement.STUDENT_ID,
    TradeFormIdentityRequirement.PROOF_OF_ORIGIN
  ],
  userRating: 5
};

describe('TradeForm DTO validation', () => {
  it('rejects invalid enum values', async () => {
    const dto = plainToInstance(CreateTradeFormDto, {
      ...validPayload,
      itemCondition: 'USED_ONCE'
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('itemCondition');
  });

  it('rejects rating outside allowed range', async () => {
    const dto = plainToInstance(CreateTradeFormDto, {
      ...validPayload,
      userRating: 6
    });

    const errors = await validate(dto);
    expect(errors.some((err) => err.property === 'userRating')).toBe(true);
  });

  it('rejects empty identity requirements array', async () => {
    const dto = plainToInstance(CreateTradeFormDto, {
      ...validPayload,
      identityRequirements: []
    });

    const errors = await validate(dto);
    expect(errors.some((err) => err.property === 'identityRequirements')).toBe(true);
  });

  it('marks update fields optional while preserving validation rules', async () => {
    const dto = plainToInstance(UpdateTradeFormDto, {
      userRating: 0,
      amount: ''
    });

    const errors = await validate(dto);
    const properties = errors.map((err) => err.property);
    expect(properties).toContain('userRating');
    expect(properties).toContain('amount');
  });

  it('accepts a fully valid payload', async () => {
    const dto = plainToInstance(CreateTradeFormDto, validPayload);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
