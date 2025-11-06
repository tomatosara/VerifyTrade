import '@config/env';
import type { DataSource, EntityManager } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@utils/logger';
import { clearAllForSeed } from './utils/clear';
import { UserEntity } from '@modules/auth/entity/user.entity';
import {
  TradeFormChannel,
  TradeFormEntity,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '@modules/tradeform/entity/trade-form.entity';

interface RunSeedOptions {
  dataSource?: DataSource;
  manageConnection?: boolean;
}

interface SeedSummary {
  users: number;
  tradeForms: number;
}

const seedUsersData: Array<Pick<UserEntity, 'email' | 'name' | 'role'>> = [
  {
    email: 'amy.chen@example.com',
    name: 'Amy Chen',
    role: 'user'
  },
  {
    email: 'will.lin@example.com',
    name: 'Will Lin',
    role: 'user'
  },
  {
    email: 'platform.ops@example.com',
    name: 'Platform Ops',
    role: 'platform'
  }
];

const tradeFormSeeds: Array<
  Pick<
    TradeFormEntity,
    | 'uid'
    | 'creatorVerifiedIdentities'
    | 'itemName'
    | 'itemDescription'
    | 'itemCondition'
    | 'amount'
    | 'tradeChannel'
    | 'paymentMethod'
    | 'matchmakingChannel'
    | 'identityRequirements'
    | 'userRating'
  >
> = [
  {
    uid: 'seed-trade-001',
    creatorVerifiedIdentities: ['StudentID', 'CampusEmail'],
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
  {
    uid: 'seed-trade-002',
    creatorVerifiedIdentities: ['CompanyEmail'],
    itemName: 'Nintendo Switch OLED',
    itemDescription: '少用，原價購入，有購買憑證',
    itemCondition: TradeFormItemCondition.LIKE_NEW,
    amount: '8500',
    tradeChannel: TradeFormChannel.CONVENIENCE_STORE_DELIVERY,
    paymentMethod: TradeFormPaymentMethod.CASH_ON_DELIVERY,
    matchmakingChannel: TradeFormMatchmakingChannel.ONLINE_MARKETPLACE,
    identityRequirements: [TradeFormIdentityRequirement.EMPLOYEE_ID],
    userRating: 4
  },
  {
    uid: 'seed-trade-003',
    creatorVerifiedIdentities: [],
    itemName: '全新咖啡機',
    itemDescription: '未拆封，附購買發票，可面交測試',
    itemCondition: TradeFormItemCondition.BRAND_NEW,
    amount: '3800',
    tradeChannel: TradeFormChannel.COURIER,
    paymentMethod: TradeFormPaymentMethod.LINE_PAY,
    matchmakingChannel: TradeFormMatchmakingChannel.OFFLINE_AGREEMENT,
    identityRequirements: [TradeFormIdentityRequirement.PROOF_OF_ORIGIN],
    userRating: 5
  },
  {
    uid: 'seed-trade-004',
    creatorVerifiedIdentities: ['MakerCommunityBadge'],
    itemName: '二手3D列印機',
    itemDescription: '列印 200 小時，含備品與零件，提供指導',
    itemCondition: TradeFormItemCondition.SECOND_HAND,
    amount: '12000',
    tradeChannel: TradeFormChannel.POST_OFFICE,
    paymentMethod: TradeFormPaymentMethod.BANK_TRANSFER,
    matchmakingChannel: TradeFormMatchmakingChannel.SOCIAL_PLATFORM,
    identityRequirements: [
      TradeFormIdentityRequirement.EMPLOYEE_ID,
      TradeFormIdentityRequirement.PROOF_OF_ORIGIN
    ],
    userRating: 3
  }
];

async function seedUsers(manager: EntityManager): Promise<UserEntity[]> {
  const userRepo = manager.getRepository(UserEntity);
  const created: UserEntity[] = [];

  for (const seed of seedUsersData) {
    let user = await userRepo.findOne({ where: { email: seed.email } });
    if (!user) {
      user = userRepo.create({
        ...seed,
        passwordHash: null
      });
    } else {
      user.name = seed.name;
      user.role = seed.role;
    }

    created.push(await userRepo.save(user));
  }

  return created;
}

async function seedTradeForms(
  manager: EntityManager,
  users: UserEntity[]
): Promise<number> {
  const tradeRepo = manager.getRepository(TradeFormEntity);

  const owner = users[0] ?? null;

  const entities = tradeFormSeeds.map((seed) =>
    tradeRepo.create({
      ...seed,
      creatorId: owner ? owner.id : null
    })
  );

  await tradeRepo.save(entities);
  return entities.length;
}

export async function runSeed(options: RunSeedOptions = {}): Promise<SeedSummary> {
  const dataSource = options.dataSource ?? AppDataSource;
  const manageConnection = options.manageConnection ?? !dataSource.isInitialized;

  if (manageConnection && !dataSource.isInitialized) {
    await dataSource.initialize();
  }

  try {
    await dataSource.runMigrations();

    const summary = await dataSource.transaction(async (manager) => {
      await clearAllForSeed(manager);

      const users = await seedUsers(manager);
      const tradeFormCount = await seedTradeForms(manager, users);
      return {
        users: users.length,
        tradeForms: tradeFormCount
      };
    });

    logger.info(summary, 'seed data inserted');
    return summary;
  } finally {
    if (manageConnection && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  void runSeed().catch((error) => {
    logger.error({ err: error }, 'seed failed');
    process.exitCode = 1;
  });
}
