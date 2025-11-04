import type { Faker } from '@faker-js/faker';
import { v5 as uuidv5 } from 'uuid';
import type { AuditAction, TradeFormStatus } from '@modules/tradeform/entity/tradeform.entity';
import type { TradeConfirmationRole } from '@modules/tradeform/entity/trade-confirmation.entity';
import type { SeedProfile, TradeSeed, UserSeed } from '../types';

type AuditDetailsBlueprint =
  | Record<string, unknown>
  | null
  | ((ctx: { title: string; amount: string | null; status: TradeFormStatus }) => Record<string, unknown> | null);

interface AuditEventBlueprint {
  action: AuditAction;
  actorKey: UserSeed['key'];
  at: string;
  details?: AuditDetailsBlueprint;
}

interface ConfirmationBlueprint {
  role: TradeConfirmationRole;
  actorKey: UserSeed['key'];
  confirmedAt: string;
}

interface TradeBlueprint {
  key: string;
  uid: string;
  creatorKey: UserSeed['key'];
  counterpartyKey?: UserSeed['key'] | null;
  amount: string | null;
  status: TradeFormStatus;
  createdAt: string;
  updatedAt: string;
  uidExpiresAt?: string | null;
  vcVerifiedAt?: string | null;
  finalizedAt?: string | null;
  finalizeAttempts: number;
  finalizeFailedAt?: string | null;
  finalizeError?: string | null;
  confirmedByUser1: boolean;
  confirmedByUser2: boolean;
  meta?: Record<string, unknown>;
  titleBuilder: (faker: Faker) => string;
  descriptionBuilder: (faker: Faker) => string;
  audit: AuditEventBlueprint[];
  confirmations: ConfirmationBlueprint[];
}

const AUDIT_EVENT_NAMESPACE = '13aeb9f0-e4d2-4e4b-8d8d-0ea1f3c1bc42';
const CONFIRMATION_NAMESPACE = 'ba3df71f-3dc8-4d1b-b9d7-a7bcac804456';

const devTradeBlueprints: TradeBlueprint[] = [
  {
    key: 'draftTrade',
    uid: 'pT6cR8fJ4mW9sQ2xD5vL7nH0yB',
    creatorKey: 'alice',
    counterpartyKey: null,
    amount: '1500.00',
    status: 'draft',
    createdAt: '2024-05-01T09:00:00.000Z',
    updatedAt: '2024-05-01T09:00:00.000Z',
    uidExpiresAt: '2024-05-02T09:00:00.000Z',
    vcVerifiedAt: null,
    finalizedAt: null,
    finalizeAttempts: 0,
    finalizeFailedAt: null,
    finalizeError: null,
    confirmedByUser1: false,
    confirmedByUser2: false,
    meta: {},
    titleBuilder: (faker) => `Draft OTC ${faker.commerce.productName()}`,
    descriptionBuilder: (faker) => faker.lorem.sentences(2),
    audit: [
      {
        action: 'create',
        actorKey: 'alice',
        at: '2024-05-01T09:00:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      }
    ],
    confirmations: []
  },
  {
    key: 'pendingTrade',
    uid: 'sQ9nV2bH5kL8mC1xF4zR7pT0dE',
    creatorKey: 'bob',
    counterpartyKey: null,
    amount: '9800.50',
    status: 'pending',
    createdAt: '2024-05-02T10:15:00.000Z',
    updatedAt: '2024-05-02T10:15:00.000Z',
    uidExpiresAt: '2024-05-04T10:15:00.000Z',
    vcVerifiedAt: null,
    finalizedAt: null,
    finalizeAttempts: 0,
    finalizeFailedAt: null,
    finalizeError: null,
    confirmedByUser1: false,
    confirmedByUser2: false,
    meta: {},
    titleBuilder: (faker) => `Pending settlement for ${faker.commerce.productMaterial()}`,
    descriptionBuilder: (faker) => faker.lorem.sentences(2),
    audit: [
      {
        action: 'create',
        actorKey: 'bob',
        at: '2024-05-02T10:15:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      }
    ],
    confirmations: []
  },
  {
    key: 'verifiedTrade',
    uid: 'xA7dF2hK9pL3sQ8vT1zW4yR6nM',
    creatorKey: 'alice',
    counterpartyKey: 'bob',
    amount: '3250.75',
    status: 'verified',
    createdAt: '2024-05-03T12:00:00.000Z',
    updatedAt: '2024-05-03T13:45:00.000Z',
    uidExpiresAt: null,
    vcVerifiedAt: '2024-05-03T13:45:00.000Z',
    finalizedAt: null,
    finalizeAttempts: 0,
    finalizeFailedAt: null,
    finalizeError: null,
    confirmedByUser1: false,
    confirmedByUser2: false,
    meta: {},
    titleBuilder: (faker) => `Verified VC escrow ${faker.commerce.productAdjective()}`,
    descriptionBuilder: (faker) => faker.lorem.paragraph(),
    audit: [
      {
        action: 'create',
        actorKey: 'alice',
        at: '2024-05-03T12:00:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      },
      {
        action: 'verifyVC',
        actorKey: 'bob',
        at: '2024-05-03T13:45:00.000Z',
        details: {
          credentialCheck: 'kyc-basic',
          verifier: 'platform-service'
        }
      }
    ],
    confirmations: []
  },
  {
    key: 'confirmedTrade',
    uid: 'zR6nM3pL9vT2xQ8sF1hK4yA7dE',
    creatorKey: 'alice',
    counterpartyKey: 'bob',
    amount: '17450.90',
    status: 'confirmed',
    createdAt: '2024-05-04T11:00:00.000Z',
    updatedAt: '2024-05-04T12:12:00.000Z',
    uidExpiresAt: null,
    vcVerifiedAt: '2024-05-04T11:45:00.000Z',
    finalizedAt: null,
    finalizeAttempts: 0,
    finalizeFailedAt: null,
    finalizeError: null,
    confirmedByUser1: true,
    confirmedByUser2: true,
    meta: {},
    titleBuilder: (faker) => `Confirmed bilateral deal for ${faker.commerce.productName()}`,
    descriptionBuilder: (faker) => faker.lorem.paragraphs({ min: 1, max: 2 }),
    audit: [
      {
        action: 'create',
        actorKey: 'alice',
        at: '2024-05-04T11:00:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      },
      {
        action: 'verifyVC',
        actorKey: 'bob',
        at: '2024-05-04T11:45:00.000Z',
        details: { credentialCheck: 'kyc-full' }
      },
      {
        action: 'confirm',
        actorKey: 'bob',
        at: '2024-05-04T12:10:00.000Z',
        details: { role: 'user2' }
      },
      {
        action: 'confirm',
        actorKey: 'alice',
        at: '2024-05-04T12:12:00.000Z',
        details: { role: 'user1' }
      }
    ],
    confirmations: [
      {
        role: 'user2',
        actorKey: 'bob',
        confirmedAt: '2024-05-04T12:10:00.000Z'
      },
      {
        role: 'user1',
        actorKey: 'alice',
        confirmedAt: '2024-05-04T12:12:00.000Z'
      }
    ]
  },
  {
    key: 'cancelledTrade',
    uid: 'nM4pT7xQ1sV5zR8wY2fH6dK9aL',
    creatorKey: 'bob',
    counterpartyKey: 'alice',
    amount: '4500.50',
    status: 'cancelled',
    createdAt: '2024-05-05T09:20:00.000Z',
    updatedAt: '2024-05-05T11:15:00.000Z',
    uidExpiresAt: null,
    vcVerifiedAt: '2024-05-05T10:00:00.000Z',
    finalizedAt: null,
    finalizeAttempts: 0,
    finalizeFailedAt: null,
    finalizeError: null,
    confirmedByUser1: false,
    confirmedByUser2: false,
    meta: {},
    titleBuilder: (faker) => `Cancelled escrow for ${faker.commerce.product()} review`,
    descriptionBuilder: (faker) => faker.lorem.sentences(3),
    audit: [
      {
        action: 'create',
        actorKey: 'bob',
        at: '2024-05-05T09:20:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      },
      {
        action: 'verifyVC',
        actorKey: 'alice',
        at: '2024-05-05T10:00:00.000Z',
        details: { credentialCheck: 'kyc-basic' }
      },
      {
        action: 'cancel',
        actorKey: 'bob',
        at: '2024-05-05T11:15:00.000Z',
        details: { reason: 'Counterparty requested pricing changes' }
      }
    ],
    confirmations: []
  },
  {
    key: 'failedTrade',
    uid: 'vT3xQ6sP9lM2nB5hR8yC1dF4kG',
    creatorKey: 'alice',
    counterpartyKey: 'bob',
    amount: '3150.00',
    status: 'failed',
    createdAt: '2024-05-06T09:30:00.000Z',
    updatedAt: '2024-05-06T12:30:00.000Z',
    uidExpiresAt: null,
    vcVerifiedAt: '2024-05-06T10:10:00.000Z',
    finalizedAt: null,
    finalizeAttempts: 2,
    finalizeFailedAt: '2024-05-06T12:30:00.000Z',
    finalizeError: 'Chain configuration missing RPC endpoint',
    confirmedByUser1: true,
    confirmedByUser2: true,
    meta: {},
    titleBuilder: (faker) => `Failed on-chain swap for ${faker.commerce.productMaterial()}`,
    descriptionBuilder: (faker) => faker.lorem.paragraphs({ min: 1, max: 2 }),
    audit: [
      {
        action: 'create',
        actorKey: 'alice',
        at: '2024-05-06T09:30:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      },
      {
        action: 'verifyVC',
        actorKey: 'bob',
        at: '2024-05-06T10:10:00.000Z',
        details: { credentialCheck: 'kyc-enhanced' }
      },
      {
        action: 'confirm',
        actorKey: 'bob',
        at: '2024-05-06T10:20:00.000Z',
        details: { role: 'user2' }
      },
      {
        action: 'confirm',
        actorKey: 'alice',
        at: '2024-05-06T10:22:00.000Z',
        details: { role: 'user1' }
      },
      {
        action: 'retry',
        actorKey: 'platform',
        at: '2024-05-06T11:50:00.000Z',
        details: { attempt: 2 }
      },
      {
        action: 'fail',
        actorKey: 'platform',
        at: '2024-05-06T12:30:00.000Z',
        details: { reason: 'Chain configuration missing RPC endpoint' }
      }
    ],
    confirmations: [
      {
        role: 'user2',
        actorKey: 'bob',
        confirmedAt: '2024-05-06T10:20:00.000Z'
      },
      {
        role: 'user1',
        actorKey: 'alice',
        confirmedAt: '2024-05-06T10:22:00.000Z'
      }
    ]
  },
  {
    key: 'doneTrade',
    uid: 'tY8vR5nM2xQ9sL4pH7dK1fC3gJ',
    creatorKey: 'alice',
    counterpartyKey: 'bob',
    amount: '27450.1234',
    status: 'done',
    createdAt: '2024-05-07T07:50:00.000Z',
    updatedAt: '2024-05-07T09:30:00.000Z',
    uidExpiresAt: null,
    vcVerifiedAt: '2024-05-07T08:20:00.000Z',
    finalizedAt: '2024-05-07T09:30:00.000Z',
    finalizeAttempts: 1,
    finalizeFailedAt: null,
    finalizeError: null,
    confirmedByUser1: true,
    confirmedByUser2: true,
    meta: {
      chain_tx_hash: '0x6f7a89c3d5b4e1ff23a91c0d4bc8ff7a'
    },
    titleBuilder: (faker) => `Completed settlement for ${faker.commerce.productName()}`,
    descriptionBuilder: (faker) => faker.lorem.paragraphs({ min: 1, max: 2 }),
    audit: [
      {
        action: 'create',
        actorKey: 'alice',
        at: '2024-05-07T07:50:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      },
      {
        action: 'verifyVC',
        actorKey: 'bob',
        at: '2024-05-07T08:20:00.000Z',
        details: { credentialCheck: 'kyc-full' }
      },
      {
        action: 'confirm',
        actorKey: 'bob',
        at: '2024-05-07T08:40:00.000Z',
        details: { role: 'user2' }
      },
      {
        action: 'confirm',
        actorKey: 'alice',
        at: '2024-05-07T08:42:00.000Z',
        details: { role: 'user1' }
      },
      {
        action: 'finalize',
        actorKey: 'platform',
        at: '2024-05-07T09:30:00.000Z',
        details: { finalizedBy: 'platform' }
      }
    ],
    confirmations: [
      {
        role: 'user2',
        actorKey: 'bob',
        confirmedAt: '2024-05-07T08:40:00.000Z'
      },
      {
        role: 'user1',
        actorKey: 'alice',
        confirmedAt: '2024-05-07T08:42:00.000Z'
      }
    ]
  }
];

const testTradeBlueprints: TradeBlueprint[] = [
  {
    key: 'testVerifiedTrade',
    uid: 'qW8eR5tY2uI9oP4aS7dF1gH3jK',
    creatorKey: 'testCreator',
    counterpartyKey: 'testCounterparty',
    amount: '1200.00',
    status: 'verified',
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2024-01-10T11:00:00.000Z',
    uidExpiresAt: '2024-01-11T10:00:00.000Z',
    vcVerifiedAt: '2024-01-10T11:00:00.000Z',
    finalizedAt: null,
    finalizeAttempts: 0,
    finalizeFailedAt: null,
    finalizeError: null,
    confirmedByUser1: false,
    confirmedByUser2: false,
    meta: {},
    titleBuilder: (faker) => `Test escrow verification ${faker.location.city()}`,
    descriptionBuilder: (faker) => faker.lorem.sentences(2),
    audit: [
      {
        action: 'create',
        actorKey: 'testCreator',
        at: '2024-01-10T10:00:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      },
      {
        action: 'verifyVC',
        actorKey: 'testCounterparty',
        at: '2024-01-10T11:00:00.000Z',
        details: { credentialCheck: 'test-basic' }
      }
    ],
    confirmations: []
  },
  {
    key: 'testDoneTrade',
    uid: 'wQ7eR4tY1uI8oP3aS6dF0gH2jK',
    creatorKey: 'testCreator',
    counterpartyKey: 'testCounterparty',
    amount: '2500.5000',
    status: 'done',
    createdAt: '2024-01-12T10:15:00.000Z',
    updatedAt: '2024-01-12T12:00:00.000Z',
    uidExpiresAt: null,
    vcVerifiedAt: '2024-01-12T11:30:00.000Z',
    finalizedAt: '2024-01-12T12:00:00.000Z',
    finalizeAttempts: 1,
    finalizeFailedAt: null,
    finalizeError: null,
    confirmedByUser1: true,
    confirmedByUser2: true,
    meta: {
      chain_tx_hash: '0x1234abcd5678ef90fedcba0987654321'
    },
    titleBuilder: (faker) => `Test settlement ${faker.commerce.productName()}`,
    descriptionBuilder: (faker) => faker.lorem.sentences(2),
    audit: [
      {
        action: 'create',
        actorKey: 'testCreator',
        at: '2024-01-12T10:15:00.000Z',
        details: (ctx) => ({ title: ctx.title })
      },
      {
        action: 'verifyVC',
        actorKey: 'testCounterparty',
        at: '2024-01-12T11:30:00.000Z',
        details: { credentialCheck: 'test-full' }
      },
      {
        action: 'confirm',
        actorKey: 'testCounterparty',
        at: '2024-01-12T11:45:00.000Z',
        details: { role: 'user2' }
      },
      {
        action: 'confirm',
        actorKey: 'testCreator',
        at: '2024-01-12T11:47:00.000Z',
        details: { role: 'user1' }
      },
      {
        action: 'finalize',
        actorKey: 'testPlatform',
        at: '2024-01-12T12:00:00.000Z',
        details: { finalizedBy: 'test-platform' }
      }
    ],
    confirmations: [
      {
        role: 'user2',
        actorKey: 'testCounterparty',
        confirmedAt: '2024-01-12T11:45:00.000Z'
      },
      {
        role: 'user1',
        actorKey: 'testCreator',
        confirmedAt: '2024-01-12T11:47:00.000Z'
      }
    ]
  }
];

const blueprintMap: Record<SeedProfile, TradeBlueprint[]> = {
  dev: devTradeBlueprints,
  test: testTradeBlueprints
};

function clampText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
}

export function buildTradeSeeds(
  profile: SeedProfile,
  faker: Faker,
  users: UserSeed[]
): TradeSeed[] {
  const userIndex = new Map(users.map((user) => [user.key, user]));

  return blueprintMap[profile].map((blueprint) => {
    const creator = userIndex.get(blueprint.creatorKey);
    if (!creator) {
      throw new Error(`Missing user seed for creator "${blueprint.creatorKey}"`);
    }

    const counterparty =
      blueprint.counterpartyKey != null ? userIndex.get(blueprint.counterpartyKey) ?? null : null;
    if (blueprint.counterpartyKey && !counterparty) {
      throw new Error(`Missing user seed for counterparty "${blueprint.counterpartyKey}"`);
    }

    const title = clampText(blueprint.titleBuilder(faker), 160);
    const description = clampText(blueprint.descriptionBuilder(faker), 4000);
    const context = {
      title,
      amount: blueprint.amount,
      status: blueprint.status
    } as const;

    const auditEvents = blueprint.audit.map((event, index) => {
      const actor = userIndex.get(event.actorKey);
      if (!actor) {
        throw new Error(`Missing user seed for audit actor "${event.actorKey}"`);
      }

      const rawDetails =
        typeof event.details === 'function' ? event.details(context) : event.details ?? null;
      const normalizedDetails =
        rawDetails && Object.keys(rawDetails).length === 0 ? null : rawDetails;

      const id = uuidv5(`${blueprint.uid}:${event.action}:${index}`, AUDIT_EVENT_NAMESPACE);
      const atIso = new Date(event.at).toISOString();

      return {
        id,
        tradeUid: blueprint.uid,
        actorId: actor.id,
        action: event.action,
        at: new Date(event.at),
        details: normalizedDetails,
        logEntry: {
          id,
          tradeUid: blueprint.uid,
          actorId: actor.id,
          action: event.action,
          at: atIso,
          details: normalizedDetails
        }
      };
    });

    const confirmations = blueprint.confirmations.map((confirmation, index) => {
      const actor = userIndex.get(confirmation.actorKey);
      if (!actor) {
        throw new Error(`Missing user seed for confirmation actor "${confirmation.actorKey}"`);
      }
      const id = uuidv5(
        `${blueprint.uid}:${confirmation.role}:${confirmation.actorKey}:${index}`,
        CONFIRMATION_NAMESPACE
      );
      return {
        id,
        tradeUid: blueprint.uid,
        actorId: actor.id,
        role: confirmation.role,
        confirmedAt: new Date(confirmation.confirmedAt)
      };
    });

    const auditLog = auditEvents.map((event) => event.logEntry);

    return {
      key: blueprint.key,
      record: {
        uid: blueprint.uid,
        creatorId: creator.id,
        counterpartyId: counterparty ? counterparty.id : null,
        title,
        description,
        amount: blueprint.amount,
        status: blueprint.status,
        meta: blueprint.meta ?? {},
        auditLog,
        confirmedByUser1: blueprint.confirmedByUser1,
        confirmedByUser2: blueprint.confirmedByUser2,
        vcVerifiedAt: blueprint.vcVerifiedAt ? new Date(blueprint.vcVerifiedAt) : null,
        uidExpiresAt: blueprint.uidExpiresAt ? new Date(blueprint.uidExpiresAt) : null,
        finalizedAt: blueprint.finalizedAt ? new Date(blueprint.finalizedAt) : null,
        finalizeAttempts: blueprint.finalizeAttempts,
        finalizeFailedAt: blueprint.finalizeFailedAt ? new Date(blueprint.finalizeFailedAt) : null,
        finalizeError: blueprint.finalizeError ?? null,
        createdAt: new Date(blueprint.createdAt),
        updatedAt: new Date(blueprint.updatedAt)
      },
      auditEvents: auditEvents.map(({ id, tradeUid, actorId, action, at, details }) => ({
        id,
        tradeUid,
        actorId,
        action,
        at,
        details: details ?? null
      })),
      confirmations
    };
  });
}
