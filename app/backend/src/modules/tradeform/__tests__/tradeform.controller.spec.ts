import type { DataSource } from 'typeorm';
import type { TradeFormResponse } from '../dto/trade-form.response';
import {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod,
  TradeFormStatus
} from '../entity/trade-form.entity';

const examplePayload = {
  creatorVerifiedIdentities: ['StudentID', 'CompanyEmail'],
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

describe('TradeForm controller integration', () => {
  let controller: import('../controller/tradeform.controller').TradeFormController;

  beforeEach(async () => {
    jest.resetModules();

    jest.doMock('../tradeform.repository', () => {
      const store = new Map<number, TradeFormResponse>();
      let sequence = 1;

      class InMemoryTradeFormRepository {
        create(payload: Partial<TradeFormResponse>) {
          return {
            ...payload
          };
        }

        async save(entity: Partial<TradeFormResponse>): Promise<TradeFormResponse> {
          const now = new Date();
          if (!entity.id) {
            entity.id = sequence++;
            entity.createdAt = now;
            entity.uid = `uid-${entity.id}`;
            entity.status = TradeFormStatus.PENDING;
          } else {
            const existing = store.get(entity.id);
            entity.createdAt = existing?.createdAt ?? now;
            entity.uid = existing?.uid ?? `uid-${entity.id}`;
            entity.status = existing?.status ?? TradeFormStatus.PENDING;
          }
          entity.updatedAt = now;
          const saved: TradeFormResponse = {
            id: entity.id as number,
            uid: entity.uid as string,
            creatorId: entity.creatorId ?? null,
            counterpartyId: entity.counterpartyId ?? null,
            creatorVerifiedIdentities: entity.creatorVerifiedIdentities ?? [],
            itemName: entity.itemName as string,
            itemDescription: entity.itemDescription as string,
            itemCondition: entity.itemCondition as TradeFormItemCondition,
            amount: entity.amount as string,
            tradeChannel: entity.tradeChannel as TradeFormChannel,
            paymentMethod: entity.paymentMethod as TradeFormPaymentMethod,
            matchmakingChannel: entity.matchmakingChannel as TradeFormMatchmakingChannel,
            identityRequirements: entity.identityRequirements as TradeFormIdentityRequirement[],
            userRating: entity.userRating as number,
            status: entity.status as TradeFormStatus,
            meta: entity.meta ?? {},
            confirmedByUser1: Boolean(entity.confirmedByUser1),
            confirmedByUser2: Boolean(entity.confirmedByUser2),
            vcVerifiedAt: (entity.vcVerifiedAt as Date | null | undefined) ?? null,
            uidExpiresAt: (entity.uidExpiresAt as Date | null | undefined) ?? null,
            finalizedAt: (entity.finalizedAt as Date | null | undefined) ?? null,
            createdAt: entity.createdAt!,
            updatedAt: entity.updatedAt!
          };
          store.set(saved.id, saved);
          return saved;
        }

        async findById(id: number) {
          return store.get(id) ?? null;
        }

        async findByUid(uid: string) {
          return Array.from(store.values()).find((item) => item.uid === uid) ?? null;
        }

        async findWithFilters() {
          const values = Array.from(store.values());
          return [values, values.length] as const;
        }

        async delete(id: number) {
          store.delete(id);
        }
      }

      return { TradeFormRepository: InMemoryTradeFormRepository };
    });

    const [{ TradeFormController }, { TradeFormService }, { TradeFormRepository }] = await Promise.all([
      import('../controller/tradeform.controller'),
      import('../tradeform.service'),
      import('../tradeform.repository')
    ]);

    const repository = new TradeFormRepository();
    const auditRepository = {
      create: jest.fn((payload) => payload),
      save: jest.fn(async (payload) => payload)
    };
    const dataSource = {
      getRepository: jest.fn(() => auditRepository)
    } as unknown as DataSource;

    controller = new TradeFormController(new TradeFormService(dataSource, repository));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('supports create → list → get → update → delete lifecycle', async () => {
    const createResult = await controller.create(examplePayload, {
      user: { id: 'creator-1' }
    });

    expect(createResult.id).toBe(1);
    expect(createResult.itemName).toBe('iPad Pro 11"');

    const listResult = await controller.list({});
    expect(listResult.total).toBe(1);

    const found = await controller.findOne(1);
    expect(found.userRating).toBe(5);

    const updated = await controller.update(1, {
      userRating: 4,
      creatorVerifiedIdentities: ['StudentID']
    });
    expect(updated.userRating).toBe(4);
    expect(updated.creatorVerifiedIdentities).toEqual(['StudentID']);

    await controller.remove(1);

    const afterDelete = await controller.list({});
    expect(afterDelete.total).toBe(0);
  });
});
jest.mock('nanoid', () => ({
  nanoid: () => 'mock-uid'
}));
