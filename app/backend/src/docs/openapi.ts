import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import baseDocument from '../../openapi.json';
import { docsConfig } from '@config/docs';

const swaggerSpec: OpenAPIV3_1.Document = JSON.parse(
  JSON.stringify(baseDocument)
) as OpenAPIV3_1.Document;

const stripTrailingSlash = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.replace(/\/+$/, '');
};

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
    const currentPath = normalizeBasePath(url.pathname);

    if (currentPath === basePath) {
      url.pathname = basePath;
      return stripTrailingSlash(url.toString());
    }

    const prefix = currentPath === '/' ? '' : currentPath;
    const combinedPath = `${prefix}${basePath}`.replace(/\/{2,}/g, '/');
    url.pathname = combinedPath;
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

const ensureTag = (name: string, description: string) => {
  const tags = (swaggerSpec.tags ?? []) as OpenAPIV3_1.TagObject[];
  if (!tags.some((tag: OpenAPIV3_1.TagObject) => tag.name === name)) {
    tags.push({ name, description });
  }
  swaggerSpec.tags = tags;
};

swaggerSpec.tags = (swaggerSpec.tags ?? []).filter(
  (tag) => tag.name !== 'tradeforms'
);

ensureTag('TradeForm', 'Trade form lifecycle operations');
ensureTag('Audit', 'Audit trail for trade forms');
ensureTag('Health', 'Operational health endpoints');
ensureTag('Auth', 'Authentication helpers for local development');
ensureTag('Internal', 'Internal-only operations');

const pathEntries = (swaggerSpec.paths ?? {}) as Record<
  string,
  OpenAPIV3_1.PathItemObject
>;

const renameTags = (
  operation: OpenAPIV3_1.OperationObject | undefined,
  mapper: (tag: string) => string
) => {
  if (operation?.tags?.length) {
    operation.tags = operation.tags.map(mapper);
  }
};

/** Small type guard to ensure we’re dealing with an OperationObject */
const isOperationObject = (
  op: unknown
): op is OpenAPIV3_1.OperationObject => {
  return !!op && typeof op === 'object' && 'responses' in (op as any);
};

const tradeFormExamples = {
  uid: 'dQ7rFZc1o7g0uX9A1c2b',
  title: 'USDT OTC escrow',
  description: 'P2P escrow with VC verification',
  amount: '1000.00',
  status: 'pending',
  creatorId: '35ad1c74-53f5-4fc2-849e-2e120a6a6ba9',
  counterpartyId: null,
  meta: {},
  createdAt: '2024-06-01T12:00:00.000Z',
  updatedAt: '2024-06-01T12:00:00.000Z',
  auditLog: [
    {
      id: '5a9d0bf4-4135-4ca8-8b46-25b8d0f32c4f',
      tradeUid: 'dQ7rFZc1o7g0uX9A1c2b',
      actorId: '35ad1c74-53f5-4fc2-849e-2e120a6a6ba9',
      action: 'create',
      at: '2024-06-01T12:00:00.000Z',
      details: {
        title: 'USDT OTC escrow'
      }
    }
  ]
};

for (const [path, pathItem] of Object.entries(pathEntries)) {
  const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
  type Method = (typeof methods)[number];

  for (const method of methods) {
    const op = (pathItem as any)[method];
    if (!isOperationObject(op)) continue;
    const operation = op as OpenAPIV3_1.OperationObject;

    renameTags(operation, (tag) => (tag === 'tradeforms' ? 'TradeForm' : tag));

    if (path.endsWith('/audit')) {
      operation.tags = ['Audit'];
    }

    if (path === '/api/v1/auth/dev-token') {
      operation.tags = ['Auth'];
      operation.security = [];
    }

    if (path === '/api/v1/tradeforms' && method === 'post') {
      const body = operation.requestBody as
        | OpenAPIV3_1.RequestBodyObject
        | undefined;
      const jsonReq = body?.content?.['application/json'];
      if (jsonReq) {
        jsonReq.example = {
          title: 'USDT OTC escrow',
          description: 'P2P escrow with VC verification',
          amount: '1000.00'
        };
      }

      operation.responses = operation.responses ?? {};
      const response = operation.responses['201'] as
        | OpenAPIV3_1.ResponseObject
        | undefined;
      if (response?.content?.['application/json']) {
        response.content['application/json'].example = {
          uid: tradeFormExamples.uid,
          status: 'pending',
          shareUrl: 'https://app.example.com/join/dQ7rFZc1o7g0uX9A1c2b'
        };
      }
    }

    if (path === '/api/v1/tradeforms/{uid}' && method === 'get') {
      const response = operation.responses?.['200'] as
        | OpenAPIV3_1.ResponseObject
        | undefined;
      if (response?.content?.['application/json']) {
        response.content['application/json'].example = tradeFormExamples;
      }
    }

    if (path === '/api/v1/tradeforms/{uid}/verify-vc' && method === 'post') {
      const response = operation.responses?.['200'] as
        | OpenAPIV3_1.ResponseObject
        | undefined;
      if (response?.content?.['application/json']) {
        response.content['application/json'].example = {
          valid: true,
          status: 'verified'
        };
      }
    }

    if (path === '/api/v1/tradeforms/{uid}/confirm' && method === 'post') {
      const response = operation.responses?.['200'] as
        | OpenAPIV3_1.ResponseObject
        | undefined;
      if (response?.content?.['application/json']) {
        response.content['application/json'].example = {
          status: 'confirmed',
          finalizeTriggered: true
        };
      }
    }

    if (
      path === '/api/v1/tradeforms/{uid}/finalize' ||
      path === '/api/v1/tradeforms/{uid}/finalize/retry'
    ) {
      operation.tags = ['TradeForm', 'Internal'];
      (operation as Record<string, unknown>)['x-internal'] = true;
    }

    if (path === '/api/v1/me/tradeforms' && method === 'get') {
      const response = operation.responses?.['200'] as
        | OpenAPIV3_1.ResponseObject
        | undefined;
      if (response?.content?.['application/json']) {
        response.content['application/json'].example = {
          data: [
            {
              ...tradeFormExamples,
              shareUrl: 'https://app.example.com/join/dQ7rFZc1o7g0uX9A1c2b'
            }
          ],
          page: 1,
          pageSize: 20,
          total: 1
        };
      }

      const parameters = (operation.parameters ?? []) as OpenAPIV3.ParameterObject[];
      const updateQueryParameter = (
        paramName: string,
        updater: (schema: OpenAPIV3.SchemaObject, parameter: OpenAPIV3.ParameterObject) => void
      ) => {
        const parameter = parameters.find(
          (param) => param.in === 'query' && param.name === paramName
        );
        if (!parameter) {
          return;
        }
        parameter.required = false;
        const schema =
          (parameter.schema as OpenAPIV3.SchemaObject | undefined) ??
          ({ type: 'string' } as OpenAPIV3.SchemaObject);
        updater(schema, parameter);
        parameter.schema = schema;
      };

      updateQueryParameter('status', () => {
        // enum already provided by tsoa; no extra constraints required here
      });

      updateQueryParameter('created_from', (schema, parameter) => {
        schema.type = 'string';
        schema.format = 'date-time';
        parameter.description =
          parameter.description ??
          'Filter trade forms created on or after this ISO 8601 timestamp.';
      });

      updateQueryParameter('created_to', (schema, parameter) => {
        schema.type = 'string';
        schema.format = 'date-time';
        parameter.description =
          parameter.description ??
          'Filter trade forms created on or before this ISO 8601 timestamp.';
      });

      updateQueryParameter('page', (schema, parameter) => {
        schema.type = 'integer';
        schema.format = 'int32';
        schema.minimum = 1;
        schema.default = 1;
        parameter.description = parameter.description ?? 'Results page number (defaults to 1).';
      });

      updateQueryParameter('page_size', (schema, parameter) => {
        schema.type = 'integer';
        schema.format = 'int32';
        schema.minimum = 1;
        schema.maximum = 100;
        schema.default = 20;
        parameter.description =
          parameter.description ?? 'Number of records per page (1-100, defaults to 20).';
      });

      operation.parameters = parameters;
    }
  }
}

swaggerSpec.paths = pathEntries;

const schemas = swaggerSpec.components.schemas ?? {};

if (schemas.CreateTradeFormDto?.type === 'object' && schemas.CreateTradeFormDto.properties) {
  const props = schemas.CreateTradeFormDto
    .properties as Record<string, OpenAPIV3_1.SchemaObject | undefined>;
  if (props.title) {
    props.title.minLength = 3;
    props.title.maxLength = 160;
  }
  if (props.description) {
    props.description.minLength = 3;
    props.description.maxLength = 4000;
  }
  if (props.amount) {
    props.amount.pattern = '^\\d+(\\.\\d{1,8})?$';
    props.amount.description =
      props.amount.description ??
      'Decimal amount with up to eight fractional digits (e.g. "1000.00").';
  }
}

if (schemas.CancelDto?.type === 'object' && schemas.CancelDto.properties) {
  const props = schemas.CancelDto.properties as Record<string, OpenAPIV3_1.SchemaObject | undefined>;
  if (props.reason) {
    props.reason.maxLength = 500;
    props.reason.description =
      props.reason.description ?? 'Optional cancellation reason (max 500 characters).';
  }
}

if (schemas.DevTokenRequest?.type === 'object' && schemas.DevTokenRequest.properties) {
  const props = schemas.DevTokenRequest
    .properties as Record<string, OpenAPIV3_1.SchemaObject | undefined>;
  if (props.userId) {
    props.userId.format = 'uuid';
    props.userId.description = props.userId.description ?? 'Unique user identifier (UUID).';
  }
  if (props.email) {
    props.email.format = 'email';
  }
}

if (!schemas.TradeForm) {
  schemas.TradeForm = {
    type: 'object',
    required: [
      'uid',
      'creatorId',
      'title',
      'status',
      'meta',
      'createdAt',
      'updatedAt'
    ],
    properties: {
      uid: {
        type: 'string',
        example: tradeFormExamples.uid
      },
      creatorId: {
        type: 'string',
        format: 'uuid'
      },
      counterpartyId: {
        // nullable: true  ->  OpenAPI 3.1 way:
        oneOf: [
          { type: 'string', format: 'uuid' },
          { type: 'null' }
        ]
      },
      title: {
        type: 'string'
      },
      description: {
        type: 'string'
      },
      amount: {
        // nullable: true
        oneOf: [{ type: 'string' }, { type: 'null' }]
      },
      status: {
        $ref: '#/components/schemas/TradeFormStatus'
      },
      meta: {
        type: 'object',
        additionalProperties: true
      },
      createdAt: {
        type: 'string',
        format: 'date-time'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time'
      },
      auditLog: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/AuditEvent'
        }
      }
    }
  };
}

if (!schemas.AuditEvent) {
  schemas.AuditEvent = {
    type: 'object',
    required: ['id', 'tradeUid', 'actorId', 'action', 'at'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid'
      },
      tradeUid: {
        type: 'string'
      },
      actorId: {
        type: 'string',
        format: 'uuid'
      },
      action: {
        type: 'string',
        enum: [
          'create',
          'verifyVC',
          'confirm',
          'cancel',
          'finalize',
          'fail',
          'retry'
        ]
      },
      at: {
        type: 'string',
        format: 'date-time'
      },
      details: {
        // nullable: true
        oneOf: [
          {
            type: 'object',
            additionalProperties: true
          },
          { type: 'null' }
        ]
      }
    }
  };
}

schemas.PagedTradeFormList = {
  type: 'object',
  required: ['data', 'page', 'pageSize', 'total'],
  properties: {
    data: {
      type: 'array',
      items: {
        allOf: [
          {
            $ref: '#/components/schemas/TradeForm'
          },
          {
            type: 'object',
            properties: {
              shareUrl: {
                type: 'string',
                format: 'uri'
              }
            }
          }
        ]
      }
    },
    page: {
      type: 'integer',
      minimum: 1
    },
    pageSize: {
      type: 'integer',
      minimum: 1
    },
    total: {
      type: 'integer',
      minimum: 0
    }
  }
};

swaggerSpec.components.schemas = schemas;

pathEntries['/health/db'] = pathEntries['/health/db'] ?? {
  get: {
    tags: ['Health'],
    summary: 'Check database connectivity',
    description: 'Executes a lightweight query against the primary database.',
    operationId: 'getDatabaseHealth',
    responses: {
      200: {
        description: 'Database connection healthy',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ok: {
                  type: 'boolean',
                  example: true
                }
              }
            }
          }
        }
      },
      503: {
        description: 'Database unavailable',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ok: {
                  type: 'boolean',
                  example: false
                },
                error: {
                  type: 'string',
                  example: 'database not ready'
                }
              }
            }
          }
        }
      }
    }
  }
};

export { swaggerSpec };
