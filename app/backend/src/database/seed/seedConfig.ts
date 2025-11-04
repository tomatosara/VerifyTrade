import '@config/env';
import { Faker, en } from '@faker-js/faker';
import { z } from 'zod';
import type { SeedProfile } from './types';

const profileSchema = z.enum(['dev', 'test']);

const fakerSeeds: Record<SeedProfile, number> = {
  dev: 17371,
  test: 24042
};

function extractProfileArg(argv: string[]): string | undefined {
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--profile=')) {
      const [, value] = token.split('=');
      return value;
    }
    if (token === '--profile' || token === '-p') {
      return argv[index + 1];
    }
  }
  return undefined;
}

export function resolveSeedProfile(argv = process.argv, env = process.env): SeedProfile {
  const args = argv.slice(2);
  const fromArgs = extractProfileArg(args);
  const value = (fromArgs ?? env.SEED_PROFILE ?? 'dev').toLowerCase();
  try {
    return profileSchema.parse(value);
  } catch {
    throw new Error(
      `Unsupported seed profile "${value}". Supported profiles: ${profileSchema.options.join(', ')}.`
    );
  }
}

export function createSeedFaker(profile: SeedProfile) {
  const faker = new Faker({ locale: [en] });
  faker.seed(fakerSeeds[profile]);
  return faker;
}

export function resolveSeedConfig(argv = process.argv, env = process.env) {
  const profile = resolveSeedProfile(argv, env);
  const faker = createSeedFaker(profile);
  return {
    profile,
    faker
  };
}

export const seedConstants = {
  fakerSeeds
} as const;
