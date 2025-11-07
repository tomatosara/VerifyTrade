import { z } from 'zod';
import { featureFlags } from '@config/featureFlags';
import { ValidationError } from '@utils/errors';

export type VCCheckInput = {
  userId: string;
  tradeUid: string;
  vcProof: unknown;
};

export type VCCheckResult = {
  valid: boolean;
  reason?: string;
  details?: Record<string, unknown>;
  claims: string[];
  issuer?: string;
  credentialType?: string;
  level?: number;
  expiresAt?: string;
  rawRef?: string;
};

type RawClaims = Record<string, unknown> | Array<string | number> | undefined;

const vcProofSchema = z
  .object({
    claims: z
      .union([
        z.array(z.union([z.string(), z.number()])).nonempty(),
        z.record(z.unknown())
      ])
      .optional(),
    issuer: z.string().optional(),
    credentialType: z.string().optional(),
    level: z.number().optional(),
    expiresAt: z.union([z.string(), z.date()]).optional(),
    reference: z.string().optional()
  })
  .passthrough();

type VCCriteria = {
  allowUsers?: string[];
  denyUsers?: string[];
  requiredClaims?: string[];
  requiredFields?: string[];
};

const criteria = featureFlags.vcMinCriteria as VCCriteria;

// Normalize proof.claims inputs – they can be objects or mixed arrays from various issuers.
// We only keep string claim identifiers to avoid introducing numeric ids that downstream logic never expects.
const normalizeClaims = (claims: RawClaims): string[] => {
  if (!claims) {
    return [];
  }

  if (Array.isArray(claims)) {
    return claims.filter((value): value is string => typeof value === 'string');
  }

  return Object.entries(claims)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);
};

const toClaimNames = (claims: string[]): string[] =>
  claims.map((value) => value.trim()).filter((value) => value.length > 0);

const normalizeTimestamp = (value?: string | Date): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

export async function validateVC(input: VCCheckInput): Promise<VCCheckResult> {
  const { userId, vcProof } = input;

  const parsed = vcProofSchema.safeParse(vcProof);
  if (!parsed.success) {
    throw new ValidationError('Invalid VC proof', parsed.error.flatten());
  }

  const proof = parsed.data;
  const claimNames = toClaimNames(normalizeClaims(proof.claims));
  const expiresAt = normalizeTimestamp(proof.expiresAt);

  if (criteria.denyUsers?.includes(userId)) {
    return {
      valid: false,
      reason: 'User denied by VC policy',
      claims: claimNames,
      issuer: proof.issuer,
      credentialType: proof.credentialType,
      level: proof.level,
      expiresAt,
      rawRef: proof.reference
    };
  }

  if (criteria.allowUsers && !criteria.allowUsers.includes(userId)) {
    return {
      valid: false,
      reason: 'User not on allow list',
      claims: claimNames,
      issuer: proof.issuer,
      credentialType: proof.credentialType,
      level: proof.level,
      expiresAt,
      rawRef: proof.reference
    };
  }

  const requiredClaims =
    criteria.requiredClaims ?? criteria.requiredFields ?? [];
  if (requiredClaims.length > 0) {
    const claimSet = new Set(claimNames);
    const missing = requiredClaims.filter((field) => !claimSet.has(field));
    if (missing.length > 0) {
      return {
        valid: false,
        reason: `Missing required VC claims: ${missing.join(', ')}`,
        details: { missing },
        claims: claimNames,
        issuer: proof.issuer,
        credentialType: proof.credentialType,
        level: proof.level,
        expiresAt,
        rawRef: proof.reference
      };
    }
  }

  return {
    valid: true,
    claims: claimNames,
    issuer: proof.issuer,
    credentialType: proof.credentialType,
    level: proof.level,
    expiresAt,
    rawRef: proof.reference
  };
}
