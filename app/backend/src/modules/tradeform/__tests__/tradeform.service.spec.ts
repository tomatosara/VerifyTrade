import type { DataSource } from 'typeorm';
import { TradeFormService } from '../tradeform.service';
import {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod,
  TradeFormEntity,
  TradeFormStatus
} from '../entity/trade-form.entity';
import type { TradeFormRepository } from '../tradeform.repository';
import { ForbiddenError, NotFoundError } from '@utils/errors';
import { getVcMeta, upsertVcMeta } from '../tradeform.meta';
import { validateVC } from '@modules/vc/validateVC';

jest.mock('@modules/vc/validateVC', () => ({
  validateVC: jest.fn()
}));

const now = new Date('2025-01-15T03:00:00.000Z');

const baseEntity: TradeFormEntity = {
  id: 1,
  uid: 'uid-1',
  creatorId: 'creator-1',
  counterpartyId: null,
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
  userRating: 5,
  status: TradeFormStatus.PENDING,
  meta: {},
  confirmedByUser1: false,
  confirmedByUser2: false,
  vcVerifiedAt: null,
  uidExpiresAt: new Date(now.getTime() + 60 * 60 * 1000),
  finalizedAt: null,
  finalizeAttempts: 0,
  finalizeFailedAt: null,
  finalizeError: null,
  createdAt: now,
  updatedAt: now
};

const cloneTrade = (): TradeFormEntity => ({
  ...baseEntity,
  creatorVerifiedIdentities: [...baseEntity.creatorVerifiedIdentities],
  identityRequirements: [...baseEntity.identityRequirements],
  meta: { ...(baseEntity.meta ?? {}) },
  uidExpiresAt: baseEntity.uidExpiresAt ? new Date(baseEntity.uidExpiresAt) : null,
  createdAt: new Date(baseEntity.createdAt),
  updatedAt: new Date(baseEntity.updatedAt),
  finalizedAt: baseEntity.finalizedAt ? new Date(baseEntity.finalizedAt) : null
});

const makeRepository = () => {
  const repo: Partial<Record<keyof TradeFormRepository, jest.Mock>> = {
    create: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findByUid: jest.fn(),
    findWithFilters: jest.fn(),
    delete: jest.fn()
  };

  return repo as unknown as TradeFormRepository & typeof repo;
};

const makeDataSource = () => {
  const auditRepository = {
    create: jest.fn((payload) => payload),
    save: jest.fn(async (payload) => payload)
  };

  const dataSource = {
    getRepository: jest.fn(() => auditRepository)
  } as unknown as DataSource;

  return { dataSource, auditRepository };
};

describe('TradeFormService', () => {
  const validateVCMock = validateVC as jest.MockedFunction<typeof validateVC>;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('creates a trade form with normalized response', async () => {
    const repository = makeRepository();
    repository.create.mockReturnValue({ ...baseEntity, id: undefined });
    repository.save.mockResolvedValue({ ...baseEntity });

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);
    const result = await service.create(
      {
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
      },
      'creator-1'
    );

    expect(repository.create).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(result.itemName).toBe('iPad Pro 11"');
    expect(result.id).toBe(1);
  });

  it('lists trade forms using repository filters', async () => {
    const repository = makeRepository();
    repository.findWithFilters.mockResolvedValue([[baseEntity], 1]);

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);
    const result = await service.findAll({
      tradeChannel: TradeFormChannel.IN_PERSON
    });

    expect(repository.findWithFilters).toHaveBeenCalledWith({
      itemCondition: undefined,
      tradeChannel: TradeFormChannel.IN_PERSON,
      paymentMethod: undefined,
      matchmakingChannel: undefined,
      identityRequirement: undefined
    });
    expect(result.total).toBe(1);
    expect(result.data[0].id).toBe(1);
  });

  it('retrieves a single trade form', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(baseEntity);

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);
    const result = await service.findOne(1);

    expect(repository.findById).toHaveBeenCalledWith(1);
    expect(result.itemDescription).toContain('盒裝');
  });

  it('throws NotFound when retrieving missing trade form', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates an existing trade form', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue({ ...baseEntity });
    repository.save.mockImplementation(async (entity: TradeFormEntity) => ({
      ...entity,
      updatedAt: new Date('2025-01-16T00:00:00.000Z')
    }));

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);
    const result = await service.update(1, {
      itemDescription: '含原廠鍵盤與 Apple Pencil',
      userRating: 4
    });

    expect(repository.save).toHaveBeenCalled();
    expect(result.userRating).toBe(4);
    expect(result.itemDescription).toContain('Apple Pencil');
  });

  it('throws NotFound when updating missing trade form', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);
    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);

    await expect(
      service.update(999, { itemName: 'New Name' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('removes an existing trade form', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue({ ...baseEntity });
    repository.delete.mockResolvedValue(undefined);

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);
    await service.remove(1);

    expect(repository.delete).toHaveBeenCalledWith(1);
  });

  it('throws NotFound when removing missing trade form', async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);

    await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  describe('verifyVc', () => {
    const baseVcResult = {
      valid: true,
      claims: ['STUDENT_ID', 'PROOF_OF_ORIGIN'],
      issuer: 'did:example:issuer',
      credentialType: 'KYC',
      level: 3,
      expiresAt: '2026-01-01T00:00:00.000Z'
    };

    it('verifies VC successfully and locks in counterparty', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      repository.findByUid.mockResolvedValue(trade);
      repository.save.mockImplementation(async (entity: TradeFormEntity) => {
        Object.assign(trade, entity);
        return trade;
      });

      validateVCMock.mockResolvedValue({ ...baseVcResult });

      const { dataSource, auditRepository } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);
      const result = await service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' });

      expect(result.valid).toBe(true);
      expect(result.status).toBe(TradeFormStatus.VERIFIED);
      expect(result.matched?.issuer).toBe(baseVcResult.issuer);
      expect(trade.counterpartyId).toBe('user-2');
      const vcMeta = getVcMeta(trade.meta);
      expect(vcMeta?.valid).toBe(true);
      expect(vcMeta?.claimsMatched).toEqual(expect.arrayContaining(baseVcResult.claims));
      expect(vcMeta?.issuer).toBe(baseVcResult.issuer);
      expect(trade.vcVerifiedAt).toBeInstanceOf(Date);
      expect(auditRepository.save).toHaveBeenCalledTimes(1);
    });

    it('passes when no identity requirements are defined', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      trade.identityRequirements = [];
      trade.meta = {};
      repository.findByUid.mockResolvedValue(trade);
      repository.save.mockImplementation(async (entity: TradeFormEntity) => {
        Object.assign(trade, entity);
        return trade;
      });

      validateVCMock.mockResolvedValue({
        ...baseVcResult,
        claims: []
      });

      const { dataSource } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);
      const result = await service.verifyVc(trade.uid, 'user-2', { proof: true });

      expect(result.valid).toBe(true);
      expect(getVcMeta(trade.meta)?.claimsMatched).toBeUndefined();
    });

    it('rejects when required claim missing', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      repository.findByUid.mockResolvedValue(trade);
      repository.save.mockImplementation(async (entity: TradeFormEntity) => {
        Object.assign(trade, entity);
        return trade;
      });

      validateVCMock.mockResolvedValue({
        ...baseVcResult,
        claims: ['STUDENT_ID']
      });

      const { dataSource } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);

      await expect(
        service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' })
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(getVcMeta(trade.meta)).toBeUndefined();
      expect(trade.counterpartyId).toBeNull();
    });

    it('rejects when issuer not allowed', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      trade.meta = {
        identity_requirements: {
          requiredClaims: ['STUDENT_ID'],
          allowedIssuers: ['did:example:trusted']
        }
      };
      repository.findByUid.mockResolvedValue(trade);

      validateVCMock.mockResolvedValue({
        ...baseVcResult,
        issuer: 'did:example:issuer'
      });

      const { dataSource } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);

      await expect(
        service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' })
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(getVcMeta(trade.meta)).toBeUndefined();
    });

    it('rejects when credential type mismatches', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      trade.meta = {
        identity_requirements: {
          requiredClaims: ['STUDENT_ID'],
          credentialTypes: ['GovernmentID']
        }
      };
      repository.findByUid.mockResolvedValue(trade);

      validateVCMock.mockResolvedValue({
        ...baseVcResult,
        credentialType: 'EmployeeID'
      });

      const { dataSource } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);

      await expect(
        service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' })
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(getVcMeta(trade.meta)).toBeUndefined();
    });

    it('rejects when VC level below minimum', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      trade.meta = {
        identity_requirements: {
          requiredClaims: ['STUDENT_ID'],
          minLevel: 3
        }
      };
      repository.findByUid.mockResolvedValue(trade);

      validateVCMock.mockResolvedValue({
        ...baseVcResult,
        level: 1
      });

      const { dataSource } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);

      await expect(
        service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' })
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(getVcMeta(trade.meta)).toBeUndefined();
    });

    it('rejects expired VC credential', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      repository.findByUid.mockResolvedValue(trade);

      validateVCMock.mockResolvedValue({
        ...baseVcResult,
        expiresAt: '2020-01-01T00:00:00.000Z'
      });

      const { dataSource } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);

      await expect(
        service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' })
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(getVcMeta(trade.meta)).toBeUndefined();
    });

    it('is idempotent when VC already valid for user 2', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      repository.findByUid.mockResolvedValue(trade);
      repository.save.mockImplementation(async (entity: TradeFormEntity) => {
        Object.assign(trade, entity);
        return trade;
      });

      validateVCMock.mockResolvedValue({ ...baseVcResult });

      const { dataSource, auditRepository } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);
      await service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' });
      expect(auditRepository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);

      const second = await service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' });
      expect(second.valid).toBe(true);
      expect(auditRepository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('rejects verification from a different user once counterparty locked', async () => {
      const repository = makeRepository();
      const trade = cloneTrade();
      repository.findByUid.mockResolvedValue(trade);
      repository.save.mockImplementation(async (entity: TradeFormEntity) => {
        Object.assign(trade, entity);
        return trade;
      });

      validateVCMock.mockResolvedValue({ ...baseVcResult });

      const { dataSource } = makeDataSource();
      const service = new TradeFormService(dataSource, repository);
      await service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' });

      await expect(
        service.verifyVc(trade.uid, 'user-3', { proof: 'opaque' })
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  it('prevents counterparty confirmation before VC success', async () => {
    const repository = makeRepository();
    const trade = cloneTrade();
    repository.findByUid.mockResolvedValue(trade);
    repository.save.mockImplementation(async (entity: TradeFormEntity) => {
      Object.assign(trade, entity);
      return trade;
    });

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);

    await expect(service.confirm(trade.uid, 'user-2')).rejects.toBeInstanceOf(ForbiddenError);
    expect(trade.confirmedByUser2).toBe(false);
  });

  it('blocks confirmation when VC expired', async () => {
    const repository = makeRepository();
    const trade = cloneTrade();
    trade.meta = upsertVcMeta(trade.meta, {
      valid: true,
      claimsMatched: ['STUDENT_ID'],
      issuer: 'did:example:issuer',
      credentialType: 'KYC',
      level: 3,
      expiresAt: '2020-01-01T00:00:00.000Z'
    });
    trade.counterpartyId = 'user-2';
    repository.findByUid.mockResolvedValue(trade);

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);

    await expect(service.confirm(trade.uid, 'user-2')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('finalizes trade after both parties confirm post VC', async () => {
    const repository = makeRepository();
    const trade = cloneTrade();
    repository.findByUid.mockResolvedValue(trade);
    repository.save.mockImplementation(async (entity: TradeFormEntity) => {
      Object.assign(trade, entity);
      return trade;
    });

    validateVCMock.mockResolvedValue({
      valid: true,
      claims: ['STUDENT_ID', 'PROOF_OF_ORIGIN'],
      issuer: 'did:example:issuer',
      credentialType: 'KYC',
      level: 3,
      expiresAt: '2026-01-01T00:00:00.000Z'
    });

    const { dataSource } = makeDataSource();
    const service = new TradeFormService(dataSource, repository);

    await service.verifyVc(trade.uid, 'user-2', { proof: 'opaque' });
    expect(trade.status).toBe(TradeFormStatus.VERIFIED);

    const confirmUser2 = await service.confirm(trade.uid, 'user-2');
    expect(confirmUser2.trade.confirmedByUser2).toBe(true);
    expect(confirmUser2.trade.status).toBe(TradeFormStatus.VERIFIED);

    const confirmUser1 = await service.confirm(trade.uid, trade.creatorId!);
    expect(confirmUser1.trade.status).toBe(TradeFormStatus.DONE);
    expect(confirmUser1.trade.confirmedByUser1).toBe(true);
    expect(confirmUser1.trade.confirmedByUser2).toBe(true);
    expect(trade.finalizedAt).toBeInstanceOf(Date);
  });
});
jest.mock('nanoid', () => ({
  nanoid: () => 'mock-uid'
}));
