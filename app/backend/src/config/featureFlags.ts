import './env';
import { z } from 'zod';

const featureFlagSchema = z.object({
  PERSIST_STRATEGY: z.enum(['db', 'chain', 'db+chain']).default('db'),
  UID_TTL_MINUTES: z.coerce.number().int().min(1).default(60),
  VC_MIN_CRITERIA: z.string().default('{}'),
  CHAIN_RPC_URL: z.string().optional(),
  CHAIN_WALLET_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['info', 'debug', 'error']).default('info'),
  REQUIRE_VC_FOR_CREATOR: z.coerce.boolean().default(false)
});

const raw = featureFlagSchema.parse(process.env);

type FeatureFlagSchema = z.infer<typeof featureFlagSchema>;

function parseCriteria<T = Record<string, unknown>>(input: string): T {
  try {
    return (JSON.parse(input) ?? {}) as T;
  } catch {
    return {} as T;
  }
}

export const featureFlags = {
  persistStrategy: raw.PERSIST_STRATEGY,
  uidTtlMinutes: raw.UID_TTL_MINUTES,
  vcMinCriteria: parseCriteria(raw.VC_MIN_CRITERIA),
  chainRpcUrl: raw.CHAIN_RPC_URL,
  chainWalletKey: raw.CHAIN_WALLET_KEY,
  logLevel: raw.LOG_LEVEL,
  requireVcForCreator: raw.REQUIRE_VC_FOR_CREATOR
} as const satisfies {
  persistStrategy: FeatureFlagSchema['PERSIST_STRATEGY'];
  uidTtlMinutes: FeatureFlagSchema['UID_TTL_MINUTES'];
  vcMinCriteria: Record<string, unknown>;
  chainRpcUrl?: string;
  chainWalletKey?: string;
  logLevel: FeatureFlagSchema['LOG_LEVEL'];
  requireVcForCreator: FeatureFlagSchema['REQUIRE_VC_FOR_CREATOR'];
};

export type FeatureFlags = typeof featureFlags;
