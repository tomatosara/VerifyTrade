import { validateVC } from '@modules/vc/validateVC';
import {
  TradeFormEntity,
  TradeFormIdentityRequirementsMeta
} from './entity/trade-form.entity';
import { getIdentityRequirementsMeta } from './tradeform.meta';

export interface CheckUser2Params {
  trade: TradeFormEntity;
  userId: string;
  vcProof: unknown;
}

export interface CheckUser2Result {
  ok: boolean;
  reason?: string;
  matched: {
    claims: string[];
    issuer?: string;
    credentialType?: string;
    level?: number;
    expiresAt?: string;
    rawRef?: string;
  };
}

const mergeRequirements = (
  trade: TradeFormEntity
): TradeFormIdentityRequirementsMeta | undefined => {
  const metaRequirements = getIdentityRequirementsMeta(trade.meta);
  if (metaRequirements) {
    return metaRequirements;
  }

  if (trade.identityRequirements && trade.identityRequirements.length > 0) {
    return {
      requiredClaims: [...trade.identityRequirements]
    };
  }

  return undefined;
};

const isExpired = (iso?: string): boolean => {
  if (!iso) {
    return false;
  }

  const expires = new Date(iso);
  if (Number.isNaN(expires.getTime())) {
    return false;
  }

  return expires.getTime() <= Date.now();
};

export async function checkUser2MeetsTradeRequirements(
  params: CheckUser2Params
): Promise<CheckUser2Result> {
  const { trade, userId, vcProof } = params;

  const validation = await validateVC({
    userId,
    tradeUid: trade.uid,
    vcProof
  });

  const claims = Array.from(new Set(validation.claims ?? []));

  const matched = {
    claims,
    issuer: validation.issuer,
    credentialType: validation.credentialType,
    level: validation.level,
    expiresAt: validation.expiresAt,
    rawRef: validation.rawRef
  };

  if (!validation.valid) {
    return {
      ok: false,
      reason: validation.reason ?? 'VC validation failed',
      matched
    };
  }

  if (isExpired(matched.expiresAt)) {
    return {
      ok: false,
      reason: 'VC credential has expired',
      matched
    };
  }

  const requirements = mergeRequirements(trade);
  if (!requirements) {
    return {
      ok: true,
      matched
    };
  }

  const claimsSet = new Set(claims);

  if (requirements.requiredClaims && requirements.requiredClaims.length > 0) {
    const missing = requirements.requiredClaims.filter(
      (claim) => !claimsSet.has(claim)
    );
    if (missing.length > 0) {
      return {
        ok: false,
        reason: `Missing required claims: ${missing.join(', ')}`,
        matched
      };
    }
  }

  if (
    requirements.allowedIssuers &&
    requirements.allowedIssuers.length > 0
  ) {
    if (!matched.issuer || !requirements.allowedIssuers.includes(matched.issuer)) {
      return {
        ok: false,
        reason: 'VC issuer not allowed',
        matched
      };
    }
  }

  if (
    requirements.credentialTypes &&
    requirements.credentialTypes.length > 0
  ) {
    if (
      !matched.credentialType ||
      !requirements.credentialTypes.includes(matched.credentialType)
    ) {
      return {
        ok: false,
        reason: 'VC credential type not accepted',
        matched
      };
    }
  }

  if (typeof requirements.minLevel === 'number') {
    if (typeof matched.level !== 'number' || matched.level < requirements.minLevel) {
      return {
        ok: false,
        reason: 'VC credential level too low',
        matched
      };
    }
  }

  return {
    ok: true,
    matched
  };
}
