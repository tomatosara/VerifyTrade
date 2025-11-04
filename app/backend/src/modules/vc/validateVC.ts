import { featureFlags } from '@config/featureFlags';

export interface VCValidationInput {
  userId: string;
  tradeUid: string;
  credential?: Record<string, unknown>;
}

export interface VCValidationResult {
  valid: boolean;
  reason?: string;
}

type VCCriteria = {
  allowUsers?: string[];
  denyUsers?: string[];
  requiredFields?: string[];
};

const criteria = featureFlags.vcMinCriteria as VCCriteria;

export async function validateVC({
  userId,
  credential
}: VCValidationInput): Promise<VCValidationResult> {
  if (criteria.denyUsers?.includes(userId)) {
    return { valid: false, reason: 'User denied by VC policy' };
  }

  if (criteria.allowUsers && !criteria.allowUsers.includes(userId)) {
    return { valid: false, reason: 'User not on allow list' };
  }

  if (criteria.requiredFields && credential) {
    const missing = criteria.requiredFields.filter((field) => credential[field] == null);
    if (missing.length > 0) {
      return { valid: false, reason: `Missing required VC fields: ${missing.join(', ')}` };
    }
  }

  return { valid: true };
}
