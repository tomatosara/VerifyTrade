export interface QrCodeResponse {
  transactionId: string;
  qrcodeImage: string;
  authUri: string;
}

export type VerifierClaim = {
  ename: string;
  cname: string;
  value: string;
};

export type VerifierVCData = {
  credentialType: string;
  claims: VerifierClaim[];
};

export interface VerifierResultResponse {
  status: 'success' | 'failed';
  verifyResult: boolean;
  resultDescription?: string;
  transactionId: string;
  message?: string;
  data?: VerifierVCData[];
  user?: {
    name: string;
    idNumber: string;   
    birthday?: string;
  };
}

export interface UserProfile {
  id: string;
  sub: string;
  idNumber: string;
  name: string;
  role: string;
  birthday: string;
}

const identityRequirementCredentialMap: Record<string, string> = {
  tw_national_id: 'idcard_vc',
  student: 'student_idcard_vc',
  nutritionist: 'nutritionist_vc',
  lawyer: 'lawyer_vc',
};

export const normalizeCredentialType = (credentialType?: string | null): string | null => {
  if (!credentialType) return null;
  const trimmed = credentialType.trim();
  if (!trimmed) return null;
  // Strip leading numeric prefixes like "00000000_" then lowercase
  const withoutPrefix = trimmed.replace(/^[0-9]+_/, '');
  return withoutPrefix.toLowerCase();
};

/**
 * Map configured identity requirements to a credentialType returned by verifier API.
 * Falls back to the raw requirement string when no mapping is defined.
 */
export const resolveCredentialTypeFromIdentity = (
  identityRequirements?: string[]
): string | null => {
  const normalized = (identityRequirements ?? []).filter(Boolean);
  if (normalized.length === 0) return null;

  for (const requirement of normalized) {
    const mapped = identityRequirementCredentialMap[requirement];
    if (mapped) return normalizeCredentialType(mapped);
    return normalizeCredentialType(requirement);
  }
  return null;
};

/**
 * Map all identity requirements to a list of normalized credential types.
 * Deduplicates and filters out falsy values.
 */
export const resolveCredentialTypesFromIdentity = (
  identityRequirements?: string[]
): string[] => {
  const normalized = (identityRequirements ?? [])
    .filter(Boolean)
    .map((req) => identityRequirementCredentialMap[req] ?? req)
    .map((req) => normalizeCredentialType(req))
    .filter(Boolean) as string[];
  return Array.from(new Set(normalized));
};

const credentialTypeLabelMap: Record<string, string> = {
  idcard_vc: '數位身分證',
  student_idcard_vc: '數位學生證',
  nutritionist_vc: '數位營養師證照',
  lawyer_vc: '數位律師證照',
};

const identityRequirementLabelMap: Record<string, string> = {
  tw_national_id: credentialTypeLabelMap.idcard_vc,
  student: credentialTypeLabelMap.student_idcard_vc,
  nutritionist: credentialTypeLabelMap.nutritionist_vc,
  lawyer: credentialTypeLabelMap.lawyer_vc,
};

export const formatIdentityRequirementLabel = (req: string): string => {
  const normalizedReq = normalizeCredentialType(req);
  if (normalizedReq && credentialTypeLabelMap[normalizedReq]) {
    return credentialTypeLabelMap[normalizedReq];
  }
  if (identityRequirementLabelMap[req]) {
    return identityRequirementLabelMap[req];
  }
  return req;
};

export const formatIdentityRequirementList = (requirements?: string[]): string => {
  if (!requirements || requirements.length === 0) return '無';
  const labels = requirements.map((req) => formatIdentityRequirementLabel(req));
  return Array.from(new Set(labels)).join('、');
};
