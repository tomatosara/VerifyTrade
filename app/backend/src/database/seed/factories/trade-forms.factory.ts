import {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormMeta,
  TradeFormPaymentMethod,
  TradeFormStatus
} from '@modules/tradeform/entity/trade-form.entity';
import type { SeedProfile, TradeSeed, UserSeed } from '../types';

interface TradeBlueprint {
  key: string;
  uid: string;
  creatorKey: string | null;
  counterpartyKey?: string | null;
  creatorVerifiedIdentities: string[];
  itemName: string;
  itemDescription: string;
  itemCondition: TradeFormItemCondition;
  amount: string;
  tradeChannel: TradeFormChannel;
  paymentMethod: TradeFormPaymentMethod;
  matchmakingChannel: TradeFormMatchmakingChannel;
  identityRequirements: TradeFormIdentityRequirement[];
  userRating: number;
  status: TradeFormStatus;
  meta: TradeFormMeta;
  confirmedByUser1: boolean;
  confirmedByUser2: boolean;
  vcVerifiedAt: string | null;
  uidExpiresAt: string | null;
  finalizedAt: string | null;
  finalizeAttempts: number;
  finalizeFailedAt: string | null;
  finalizeError: string | null;
  createdAt: string;
  updatedAt: string;
}

const devTrades: TradeBlueprint[] = [
  {
    key: 'bike-sale',
    uid: 'TDEVSALEFORM0000000000001',
    creatorKey: 'alice',
    counterpartyKey: 'bob',
    creatorVerifiedIdentities: ['TWN_ID_CARD'],
    itemName: 'Used Gravel Bike',
    itemDescription: 'Ride-ready gravel bike with upgraded drivetrain.',
    itemCondition: TradeFormItemCondition.LIKE_NEW,
    amount: '22000',
    tradeChannel: TradeFormChannel.IN_PERSON,
    paymentMethod: TradeFormPaymentMethod.CASH_ON_DELIVERY,
    matchmakingChannel: TradeFormMatchmakingChannel.SOCIAL_PLATFORM,
    identityRequirements: [TradeFormIdentityRequirement.STUDENT_ID],
    userRating: 5,
    status: TradeFormStatus.PENDING,
    meta: {
      identity_requirements: {
        requiredClaims: ['STUDENT_ID'],
        allowedIssuers: ['did:twn:moe']
      }
    },
    confirmedByUser1: true,
    confirmedByUser2: false,
    vcVerifiedAt: null,
    uidExpiresAt: '2024-09-01T00:00:00.000Z',
    finalizedAt: null,
    finalizeAttempts: 0,
    finalizeFailedAt: null,
    finalizeError: null,
    createdAt: '2024-05-10T08:00:00.000Z',
    updatedAt: '2024-05-10T08:00:00.000Z'
  },
  {
    key: 'monitor-swap',
    uid: 'TDEVSALEFORM0000000000002',
    creatorKey: 'bob',
    counterpartyKey: null,
    creatorVerifiedIdentities: ['COMPANY_EMAIL'],
    itemName: '27" 4K Monitor',
    itemDescription: 'Calibrated 4K IPS panel, seldom used.',
    itemCondition: TradeFormItemCondition.BRAND_NEW,
    amount: '14500',
    tradeChannel: TradeFormChannel.COURIER,
    paymentMethod: TradeFormPaymentMethod.BANK_TRANSFER,
    matchmakingChannel: TradeFormMatchmakingChannel.ONLINE_MARKETPLACE,
    identityRequirements: [
      TradeFormIdentityRequirement.EMPLOYEE_ID,
      TradeFormIdentityRequirement.PROOF_OF_ORIGIN
    ],
    userRating: 4,
    status: TradeFormStatus.VERIFIED,
    meta: {
      vc_user2: { valid: true, at: '2024-05-12T09:15:00.000Z' }
    },
    confirmedByUser1: false,
    confirmedByUser2: false,
    vcVerifiedAt: '2024-05-12T09:15:00.000Z',
    uidExpiresAt: '2024-08-15T00:00:00.000Z',
    finalizedAt: null,
    finalizeAttempts: 1,
    finalizeFailedAt: null,
    finalizeError: null,
    createdAt: '2024-05-09T07:45:00.000Z',
    updatedAt: '2024-05-12T09:20:00.000Z'
  }
];

const testTrades: TradeBlueprint[] = [
  {
    key: 'test-console',
    uid: 'TTESTFORM000000000000001',
    creatorKey: 'creator',
    counterpartyKey: 'counterparty',
    creatorVerifiedIdentities: ['TWN_ID_CARD'],
    itemName: 'Handheld Console',
    itemDescription: 'Lightly used gaming console with carrying case.',
    itemCondition: TradeFormItemCondition.SECOND_HAND,
    amount: '6800',
    tradeChannel: TradeFormChannel.CONVENIENCE_STORE_DELIVERY,
    paymentMethod: TradeFormPaymentMethod.LINE_PAY,
    matchmakingChannel: TradeFormMatchmakingChannel.ONLINE_MARKETPLACE,
    identityRequirements: [TradeFormIdentityRequirement.STUDENT_ID],
    userRating: 4,
    status: TradeFormStatus.CONFIRMED,
    meta: {},
    confirmedByUser1: true,
    confirmedByUser2: true,
    vcVerifiedAt: '2024-01-15T10:00:00.000Z',
    uidExpiresAt: '2024-02-01T00:00:00.000Z',
    finalizedAt: '2024-01-18T04:30:00.000Z',
    finalizeAttempts: 1,
    finalizeFailedAt: null,
    finalizeError: null,
    createdAt: '2024-01-10T09:30:00.000Z',
    updatedAt: '2024-01-18T04:30:00.000Z'
  }
];

const tradeBlueprints: Record<SeedProfile, TradeBlueprint[]> = {
  dev: devTrades,
  test: testTrades
};

const toDate = (value: string | null): Date | null => (value ? new Date(value) : null);

const resolveUserId = (usersByKey: Map<string, UserSeed>, key: string | null | undefined): string | null => {
  if (!key) {
    return null;
  }
  const user = usersByKey.get(key);
  if (!user) {
    throw new Error(`seed blueprint references missing user key "${key}"`);
  }
  return user.id;
};

export function buildTradeSeeds(profile: SeedProfile, users: UserSeed[]): TradeSeed[] {
  const usersByKey = new Map(users.map((user) => [user.key, user]));
  const blueprints = tradeBlueprints[profile] ?? [];

  return blueprints.map((blueprint) => {
    const record = {
      uid: blueprint.uid,
      creatorId: resolveUserId(usersByKey, blueprint.creatorKey),
      counterpartyId: resolveUserId(usersByKey, blueprint.counterpartyKey),
      creatorVerifiedIdentities: blueprint.creatorVerifiedIdentities,
      itemName: blueprint.itemName,
      itemDescription: blueprint.itemDescription,
      itemCondition: blueprint.itemCondition,
      amount: blueprint.amount,
      tradeChannel: blueprint.tradeChannel,
      paymentMethod: blueprint.paymentMethod,
      matchmakingChannel: blueprint.matchmakingChannel,
      identityRequirements: blueprint.identityRequirements,
      userRating: blueprint.userRating,
      status: blueprint.status,
      meta: blueprint.meta,
      confirmedByUser1: blueprint.confirmedByUser1,
      confirmedByUser2: blueprint.confirmedByUser2,
      vcVerifiedAt: toDate(blueprint.vcVerifiedAt),
      uidExpiresAt: toDate(blueprint.uidExpiresAt),
      finalizedAt: toDate(blueprint.finalizedAt),
      finalizeAttempts: blueprint.finalizeAttempts,
      finalizeFailedAt: toDate(blueprint.finalizeFailedAt),
      finalizeError: blueprint.finalizeError,
      createdAt: new Date(blueprint.createdAt),
      updatedAt: new Date(blueprint.updatedAt)
    };

    return {
      key: blueprint.key,
      record,
      auditEvents: []
    };
  });
}

