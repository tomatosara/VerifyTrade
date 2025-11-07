import type { OpenAPIV3_1 } from 'openapi-types';
import baseDocument from '../../openapi.json';
import { version as appVersion } from '../../package.json';
import { docsConfig } from '@config/docs';
import {
  TradeFormChannel,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from '@modules/tradeform/enums/TradeFormEnums';

const swaggerSpec: OpenAPIV3_1.Document = JSON.parse(
  JSON.stringify(baseDocument)
) as OpenAPIV3_1.Document;

const stripTrailingSlash = (value: string): string =>
  value ? value.replace(/\/+$/, '') : value;

const normalizeBasePath = (value: string | undefined): string => {
  if (!value || value === '/') {
    return '/';
  }
  const ensured = value.startsWith('/') ? value : `/${value}`;
  const trimmed = stripTrailingSlash(ensured);
  return trimmed || '/';
};

const generatedServers = Array.isArray(baseDocument.servers)
  ? baseDocument.servers
  : [];
const generatedBasePath = generatedServers.find(
  (server) => typeof server?.url === 'string' && server.url.startsWith('/')
)?.url;

export const swaggerApiBasePath = normalizeBasePath(generatedBasePath);

const appendBasePath = (baseUrl: string, basePath: string): string => {
  const normalizedBaseUrl = stripTrailingSlash(baseUrl);

  if (basePath === '/') {
    return normalizedBaseUrl || '/';
  }

  try {
    const url = new URL(normalizedBaseUrl);
    url.pathname = normalizeBasePath(url.pathname) === '/'
      ? basePath
      : `${stripTrailingSlash(url.pathname)}${basePath}`;
    return stripTrailingSlash(url.toString());
  } catch {
    if (normalizedBaseUrl.endsWith(basePath)) {
      return normalizedBaseUrl;
    }
    return `${normalizedBaseUrl}${basePath}`;
  }
};

export const swaggerConfiguredServerUrl = appendBasePath(
  docsConfig.apiBaseUrl,
  swaggerApiBasePath
);

export const buildSwaggerServerUrl = (origin: string): string =>
  appendBasePath(origin, swaggerApiBasePath);

swaggerSpec.openapi = '3.1.0';
swaggerSpec.info = {
  ...swaggerSpec.info,
  title: docsConfig.swaggerTitle,
  version: docsConfig.swaggerVersion
};
swaggerSpec.servers = [
  {
    url: swaggerConfiguredServerUrl,
    description: 'Configured API base URL'
  }
];

if (swaggerApiBasePath !== '/') {
  swaggerSpec.servers.push({
    url: swaggerApiBasePath,
    description: 'Relative base path'
  });
}

swaggerSpec.components = swaggerSpec.components ?? {};
swaggerSpec.components.securitySchemes = {
  ...(swaggerSpec.components.securitySchemes ?? {}),
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
  }
};

swaggerSpec.security = swaggerSpec.security?.length
  ? swaggerSpec.security
  : [
      {
        bearerAuth: []
      }
    ];

const tradeFormExample = {
  id: 1,
  uid: 'uid-1234567890abcdef',
  creatorId: '1d1c14b2-0a3e-4a76-97a5-4e7b63e6c001',
  counterpartyId: null,
  creatorVerifiedIdentities: ['StudentID', 'CompanyEmail'],
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
  userRating: 5,
  status: 'pending',
  meta: {},
  confirmedByUser1: false,
  confirmedByUser2: false,
  vcVerifiedAt: null,
  uidExpiresAt: '2025-01-15T04:00:00.000Z',
  finalizedAt: null,
  createdAt: '2025-01-15T03:00:00.000Z',
  updatedAt: '2025-01-15T03:00:00.000Z'
};

const ensureTag = (name: string, description: string) => {
  const tags = (swaggerSpec.tags ?? []) as OpenAPIV3_1.TagObject[];
  if (!tags.some((tag) => tag.name === name)) {
    tags.push({ name, description });
  }
  swaggerSpec.tags = tags;
};

ensureTag('TradeForm', 'Trade form marketplace operations');
ensureTag('Auth', 'Authentication helpers');
ensureTag('Health', 'Operational health checks');

const setExampleIfPresent = (
  operation: OpenAPIV3_1.OperationObject | undefined,
  example: unknown
) => {
  const response = operation?.responses?.['200'] as OpenAPIV3_1.ResponseObject | undefined;
  if (response?.content?.['application/json']) {
    response.content['application/json'].example = example;
  }
};

const setResponseExample = (
  operation: OpenAPIV3_1.OperationObject | undefined,
  status: string,
  example: unknown
) => {
  const response = operation?.responses?.[status] as OpenAPIV3_1.ResponseObject | undefined;
  if (response?.content?.['application/json']) {
    response.content['application/json'].example = example;
  }
};

const specPaths = swaggerSpec.paths ?? {};

const pathCandidates = (path: string): string[] => {
  if (path.startsWith('/api/v1')) {
    return [path, path.replace('/api/v1', '')];
  }
  return [path, `/api/v1${path}`];
};

const findPathItem = (
  path: string
): { key: string; item: OpenAPIV3_1.PathItemObject } | undefined => {
  for (const candidate of pathCandidates(path)) {
    const item = specPaths[candidate] as OpenAPIV3_1.PathItemObject | undefined;
    if (item) {
      return { key: candidate, item };
    }
  }
  return undefined;
};

const ensurePathItem = (path: string): OpenAPIV3_1.PathItemObject => {
  const existing = findPathItem(path);
  if (existing) {
    return existing.item;
  }
  const created: OpenAPIV3_1.PathItemObject = {};
  specPaths[path] = created;
  return created;
};

const uidPathEntry = findPathItem('/tradeforms/uid/{uid}');
const sharePath = '/tradeforms/{uid}';
if (uidPathEntry) {
  specPaths[sharePath] = uidPathEntry.item;
  delete specPaths[uidPathEntry.key];
}

const listOperation =
  findPathItem('/tradeforms')?.item.get ?? findPathItem('/api/v1/tradeforms')?.item.get;
setExampleIfPresent(listOperation, { data: [tradeFormExample], total: 1 });

const createOperation =
  findPathItem('/tradeforms')?.item.post ?? findPathItem('/api/v1/tradeforms')?.item.post;
if (createOperation?.requestBody && 'content' in createOperation.requestBody) {
  const body = createOperation.requestBody.content?.['application/json'];
  if (body) {
    body.example = {
      creatorVerifiedIdentities: ['StudentID', 'CompanyEmail'],
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
    };
  }
}

setExampleIfPresent(findPathItem('/tradeforms/{id}')?.item.get, tradeFormExample);
setExampleIfPresent(findPathItem('/tradeforms/{id}')?.item.put, {
  ...tradeFormExample,
  itemDescription: '含原廠鍵盤與 Apple Pencil'
});

const viewOperation = findPathItem('/tradeforms/{uid}')?.item.get ?? findPathItem(sharePath)?.item.get;
setExampleIfPresent(viewOperation, {
  view: 'limited',
  trade: {
    uid: tradeFormExample.uid,
    status: tradeFormExample.status,
    createdAt: tradeFormExample.createdAt,
    updatedAt: tradeFormExample.updatedAt
  }
});

const verifyOperation =
  findPathItem('/tradeforms/{uid}/verify-vc')?.item.post ??
  findPathItem('/api/v1/tradeforms/{uid}/verify-vc')?.item.post;
if (verifyOperation) {
  if (verifyOperation.requestBody && 'content' in verifyOperation.requestBody) {
    const body = verifyOperation.requestBody.content?.['application/json'];
    if (body) {
      body.example = {
        vcProof: {
          claims: ['STUDENT_ID', 'PROOF_OF_ORIGIN'],
          issuer: 'did:example:issuer',
          credentialType: 'KYC',
          level: 3,
          expiresAt: '2026-01-01T00:00:00.000Z'
        }
      };
    }
  }

  verifyOperation.description =
    'Validate User 2’s verifiable credential (VC) against the trade form requirements.';
  setExampleIfPresent(verifyOperation, {
    valid: true,
    status: 'verified',
    matched: {
      claims: ['STUDENT_ID', 'PROOF_OF_ORIGIN'],
      issuer: 'did:example:issuer',
      credentialType: 'KYC',
      level: 3,
      expiresAt: '2026-01-01T00:00:00.000Z'
    },
    trade: {
      ...tradeFormExample,
      counterpartyId: '2c9341ca-3f54-4a7d-8ebb-4e1a5cd9c222',
      status: 'verified',
      meta: {
        vc_user2: {
          valid: true,
          at: '2025-01-15T03:05:00.000Z',
          claimsMatched: ['STUDENT_ID', 'PROOF_OF_ORIGIN'],
          issuer: 'did:example:issuer',
          credentialType: 'KYC',
          level: 3,
          expiresAt: '2026-01-01T00:00:00.000Z'
        }
      },
      confirmedByUser2: false
    }
  });
  setResponseExample(verifyOperation, '403', {
    error: 'VC requirements not satisfied',
    details: {
      code: 'VC_REQUIREMENT_NOT_MET',
      reason: 'Missing required claims: STUDENT_ID'
    }
  });
  setResponseExample(verifyOperation, '422', {
    error: 'Invalid VC proof',
    details: {
      formErrors: [],
      fieldErrors: {
        vcProof: ['Expected object']
      }
    }
  });
}

const confirmOperation =
  findPathItem('/tradeforms/{uid}/confirm')?.item.post ??
  findPathItem('/api/v1/tradeforms/{uid}/confirm')?.item.post;
if (confirmOperation) {
  confirmOperation.description =
    'Confirm the trade as a participant. User 2 must complete VC verification and remain valid before confirming.';
  setExampleIfPresent(confirmOperation, {
    trade: {
      ...tradeFormExample,
      status: 'confirmed',
      counterpartyId: '610afc64-8ccc-4c94-90a3-e99bc692f053',
      confirmedByUser2: true
    }
  });
  setResponseExample(confirmOperation, '403', {
    error: 'VC verification required before confirmation',
    details: {
      code: 'VC_NOT_VERIFIED'
    }
  });
  setResponseExample(confirmOperation, '409', {
    error: 'Trade already confirmed by another counterparty',
    details: {
      reason: 'Trade already confirmed by another counterparty'
    }
  });
}

const livenessOperation = {
  operationId: 'getLivenessStatus',
  tags: ['Health'],
  description:
    'Checks whether the process is running and the event loop is responsive. Alias of `/healthz`.',
  security: [],
  responses: {
    '200': {
      description: 'Process is running',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status', 'uptimeSec', 'version'],
            properties: {
              status: {
                type: 'string',
                example: 'ok'
              },
              uptimeSec: {
                type: 'number',
                format: 'float',
                example: 12.34,
                description: 'Process uptime in seconds'
              },
              version: {
                type: 'string',
                example: appVersion,
                description: 'Application version'
              }
            }
          },
          example: {
            status: 'ok',
            uptimeSec: 12.34,
            version: appVersion
          }
        }
      }
    }
  }
} satisfies OpenAPIV3_1.OperationObject;

const healthPath = ensurePathItem('/health');
healthPath.get = livenessOperation;

const healthzPath = ensurePathItem('/healthz');
healthzPath.get = {
  ...livenessOperation,
  operationId: 'getHealthzStatus',
  description: 'Liveness probe indicating the service process is up.'
};

const readinessPath = ensurePathItem('/ready');
readinessPath.get = {
  operationId: 'getReadinessStatus',
  tags: ['Health'],
  description:
    'Checks whether core dependencies (e.g. database, cache) are reachable within a short timeout.',
  security: [],
  responses: {
    '200': {
      description: 'All dependencies are reachable',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status', 'checks'],
            properties: {
              status: {
                type: 'string',
                example: 'ok'
              },
              checks: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  required: ['ok'],
                  properties: {
                    ok: {
                      type: 'boolean',
                      example: true
                    },
                    reason: {
                      type: 'string',
                      nullable: true,
                      example: null
                    }
                  }
                },
                example: {
                  db: { ok: true }
                }
              }
            }
          },
          example: {
            status: 'ok',
            checks: {
              db: { ok: true }
            }
          }
        }
      }
    },
    '503': {
      description: 'At least one dependency is unavailable',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['status', 'checks'],
            properties: {
              status: {
                type: 'string',
                example: 'degraded'
              },
              checks: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  required: ['ok'],
                  properties: {
                    ok: {
                      type: 'boolean',
                      example: false
                    },
                    reason: {
                      type: 'string',
                      example: 'timeout'
                    }
                  }
                },
                example: {
                  db: { ok: false, reason: 'timeout' }
                }
              }
            }
          },
          example: {
            status: 'degraded',
            checks: {
              db: { ok: false, reason: 'timeout' }
            }
          }
        }
      }
    }
  }
};

export { swaggerSpec };
