import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { TradeFormService } from '../tradeform.service';
import {
  TradeFormChannel,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '../enums/TradeFormEnums';
import { TradeFormEntity } from '../entity/trade-form.entity';
import { TradeFormRepository } from '../tradeform.repository';
import { ValidationError, ConflictError } from '@utils/errors';
import { secureRandomInt } from '@utils/crypto-random';

jest.mock('@utils/crypto-random', () => {
  const actual = jest.requireActual('@utils/crypto-random');
  return {
    ...actual,
    secureRandomInt: jest.fn(actual.secureRandomInt)
  };
});

class InMemoryTradeFormRepository implements Partial<TradeFormRepository> {
  private store = new Map<string, TradeFormEntity>();
  private sequence = 0;

  create(payload: Partial<TradeFormEntity>): TradeFormEntity {
    return {
      id: 0,
      uid: '',
      creatorId: '',
      counterpartyId: null,
      creatorVerifiedIdentities: [],
      itemName: '',
      itemDescription: '',
      itemCondition: TradeFormItemCondition.NEW,
      amount: '0',
      tradeChannel: TradeFormChannel.P2P,
      paymentMethod: TradeFormPaymentMethod.BANK_TRANSFER,
      matchmakingChannel: TradeFormMatchmakingChannel.IN_APP,
      identityRequirements: [],
      userRating: 0,
      status: 'pending',
      meta: {},
      confirmedByUser1: false,
      confirmedByUser2: false,
      vcVerifiedAt: null,
      uidExpiresAt: null,
      finalizedAt: null,
      finalizeAttempts: 0,
      finalizeFailedAt: null,
      finalizeError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...payload
    } as TradeFormEntity;
  }

  async save(entity: TradeFormEntity): Promise<TradeFormEntity> {
    if (!entity.id) {
      this.sequence += 1;
      entity.id = this.sequence;
    }
    this.store.set(entity.uid, { ...entity });
    return { ...entity };
  }

  async findByUid(uid: string): Promise<TradeFormEntity | null> {
    const found = this.store.get(uid);
    return found ? { ...found } : null;
  }
}

const createService = () => {
  const repository = new InMemoryTradeFormRepository();
  const auditRepo = {
    create: jest.fn().mockImplementation((payload) => payload),
    save: jest.fn().mockResolvedValue(undefined)
  };
  const dataSource = {
    getRepository: jest.fn().mockReturnValue(auditRepo)
  } as unknown as DataSource;

  const service = new TradeFormService(
    dataSource,
    repository as unknown as TradeFormRepository
  );

  return { service, repository };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TradeFormService.create', () => {
  const baseInput = {
    uid: 'trade-e2e-123',
    creatorId: 'A131095852',
    creatorVerifiedIdentities: ['TW_NATIONAL_ID', 'phone_verified'],
    itemName: 'Ledger Nano',
    itemDescription: 'Barely used, includes box',
    itemCondition: TradeFormItemCondition.USED_LIKE_NEW,
    amount: '1000.5000',
    tradeChannel: TradeFormChannel.P2P,
    paymentMethod: TradeFormPaymentMethod.BANK_TRANSFER,
    matchmakingChannel: TradeFormMatchmakingChannel.IN_APP,
    identityRequirements: ['tw_national_id', 'phone_verified']
  };

  it('persists a trade form with normalized amount and arrays', async () => {
    const { service, repository } = createService();
    const result = await service.create(baseInput, 'A131095852');

    expect(result.uid).toBe(baseInput.uid);
    expect(result.amount).toBe('1000.5');
    expect(result.identityRequirements).toEqual(['tw_national_id', 'phone_verified']);
    expect(result.creatorVerifiedIdentities).toEqual(['tw_national_id', 'phone_verified']);

    const stored = await repository.findByUid(baseInput.uid);
    expect(stored?.amount).toBe('1000.5');
    expect(Array.isArray(stored?.identityRequirements)).toBe(true);
  });

  it('rejects invalid amount strings', async () => {
    const { service } = createService();
    await expect(
      service.create(
        {
          ...baseInput,
          uid: 'trade-invalid-amount',
          amount: 'abc'
        },
        'A131095852'
      )
    ).rejects.toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'amount' })])
    );
  });

  it('rejects empty identity requirements after normalization', async () => {
    const { service } = createService();
    await expect(
      service.create(
        {
          ...baseInput,
          uid: 'trade-empty-identity',
          identityRequirements: ['   ']
        },
        'A131095852'
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ConflictError when uid already exists', async () => {
    const { service } = createService();
    await service.create(baseInput, 'A131095852');
    await expect(service.create(baseInput, 'A131095852')).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('TradeFormService.resolveUid', () => {
  it('uses secure randomness when generating a UID', async () => {
    const { service } = createService();
    // @ts-expect-error accessing private method for test verification
    const generated = await service.resolveUid(null);
    expect(typeof generated).toBe('string');
    expect(generated).toHaveLength(24);
    expect(secureRandomInt).toHaveBeenCalled();
  });
});
