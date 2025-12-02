import type { Request, Response } from 'express';

describe('csrfProtectionMiddleware', () => {
  const originalOrigins = process.env.CSRF_ALLOWED_ORIGINS;

  const loadModule = () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./csrf') as typeof import('./csrf');
  };

  beforeAll(() => {
    process.env.CSRF_ALLOWED_ORIGINS = 'https://frontend.test';
  });

  afterAll(() => {
    process.env.CSRF_ALLOWED_ORIGINS = originalOrigins;
    jest.resetModules();
  });

  const run = async (overrideReq: Partial<Request>) => {
    const csrf = loadModule();
    const req: Partial<Request> = {
      method: 'POST',
      protocol: 'https',
      hostname: 'api.example.test',
      headers: {
        host: 'api.example.test',
        ...overrideReq.headers
      },
      ...overrideReq
    };

    const json = jest.fn();
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json
    };

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    csrf.csrfProtectionMiddleware(req as Request, res as Response, next);
    return { csrf, res, json, nextCalled };
  };

  it('accepts matching cookie/header pairs from an allowed origin', async () => {
    const csrfToken = 'token-' + Date.now();
    const { nextCalled, json } = await run({
      headers: {
        cookie: `refresh_token=refresh; csrf_token=${csrfToken}`,
        origin: 'https://frontend.test',
        'x-csrf-token': csrfToken
      }
    });

    expect(nextCalled).toBe(true);
    expect(json).not.toHaveBeenCalled();
  });

  it('rejects missing CSRF headers when a session cookie is present', async () => {
    const csrfToken = 'token-' + Date.now();
    const { res, json, nextCalled } = await run({
      headers: {
        cookie: `refresh_token=refresh; csrf_token=${csrfToken}`,
        origin: 'https://frontend.test'
      }
    });

    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: 'Invalid CSRF token' });
    expect(nextCalled).toBe(false);
  });

  it('rejects disallowed origins even with a valid token pair', async () => {
    const csrfToken = 'token-' + Date.now();
    const { res, json, nextCalled } = await run({
      headers: {
        cookie: `refresh_token=refresh; csrf_token=${csrfToken}`,
        origin: 'https://evil.example',
        'x-csrf-token': csrfToken
      }
    });

    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: 'Forbidden: origin not allowed' });
    expect(nextCalled).toBe(false);
  });
});
