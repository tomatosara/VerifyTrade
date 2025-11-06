import http from 'http';
import request from 'supertest';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('Swagger docs CSP', () => {
  it.skip('omits upgrade-insecure-requests in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-123';
    process.env.PLATFORM_JWT_SECRET = process.env.PLATFORM_JWT_SECRET ?? 'test-secret-123';
    process.env.SWAGGER_PATH = '/docs';

    jest.resetModules();
    const { createApp } = await import('../app');
    const app = createApp();
    const server = await new Promise<http.Server>((resolve) => {
      const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
    });

    const response = await request(server).get('/docs');
    await new Promise<void>((resolve) => server.close(() => resolve()));

    expect(response.status).toBe(200);
    const csp = response.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
});
