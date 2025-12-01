import fs from 'fs';
import https from 'https';
import path from 'path';
import { constants as tlsConstants } from 'crypto';
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
    const keyPath = path.resolve(__dirname, '../test/fixtures/certs/local-dev.key.pem');
    const certPath = path.resolve(__dirname, '../test/fixtures/certs/local-dev.cert.pem');
    const server = await new Promise<https.Server>((resolve) => {
      const srv = https.createServer(
        {
          // Local-only self-signed certificate for test isolation; require modern TLS.
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
          minVersion: 'TLSv1.2',
          secureOptions:
            tlsConstants.SSL_OP_NO_SSLv2 |
            tlsConstants.SSL_OP_NO_SSLv3 |
            tlsConstants.SSL_OP_NO_TLSv1 |
            tlsConstants.SSL_OP_NO_TLSv1_1
        },
        app
      );
      srv.listen(0, '127.0.0.1', () => resolve(srv));
    });

    const response = await request(server).get('/docs');
    await new Promise<void>((resolve) => server.close(() => resolve()));

    expect(response.status).toBe(200);
    const csp = response.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
});
