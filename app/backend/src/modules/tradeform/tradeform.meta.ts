import type {
  TradeFormIdentityRequirementsMeta,
  TradeFormMeta,
  TradeFormVCUser2Meta
} from './entity/trade-form.entity';

export const VC_META_KEY = 'vc_user2';
export const IDENTITY_REQUIREMENTS_META_KEY = 'identity_requirements';

export function getVcMeta(meta?: TradeFormMeta | null): TradeFormVCUser2Meta | undefined {
  if (!meta) {
    return undefined;
  }

  const value = meta[VC_META_KEY];
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return value as TradeFormVCUser2Meta;
}

export function getIdentityRequirementsMeta(
  meta?: TradeFormMeta | null
): TradeFormIdentityRequirementsMeta | undefined {
  if (!meta) {
    return undefined;
  }

  const value = meta[IDENTITY_REQUIREMENTS_META_KEY];
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return value as TradeFormIdentityRequirementsMeta;
}

type UpdateInput = {
  valid: boolean;
  claimsMatched?: string[];
  issuer?: string;
  credentialType?: string;
  level?: number;
  reason?: string;
  expiresAt?: Date | string | null;
  rawRef?: string;
  at?: Date | string;
};

export function upsertVcMeta(meta: TradeFormMeta | null | undefined, input: UpdateInput): TradeFormMeta {
  const current = meta ? { ...meta } : {};
  const timestamp = input.at
    ? new Date(input.at).toISOString()
    : new Date().toISOString();

  const entry: TradeFormVCUser2Meta = {
    valid: input.valid,
    at: timestamp
  };

  if (input.claimsMatched && input.claimsMatched.length > 0) {
    entry.claimsMatched = [...new Set(input.claimsMatched)];
  }

  if (input.issuer) {
    entry.issuer = input.issuer;
  }

  if (input.credentialType) {
    entry.credentialType = input.credentialType;
  }

  if (typeof input.level === 'number') {
    entry.level = input.level;
  }

  if (input.reason) {
    entry.reason = input.reason;
  }

  if (input.expiresAt) {
    const expiresDate = new Date(input.expiresAt);
    if (!Number.isNaN(expiresDate.getTime())) {
      entry.expiresAt = expiresDate.toISOString();
    }
  }

  if (input.rawRef) {
    entry.rawRef = input.rawRef;
  }

  current[VC_META_KEY] = entry;
  return current;
}
