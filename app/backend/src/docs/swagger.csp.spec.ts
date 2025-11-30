import https from 'https';
import request from 'supertest';

const ORIGINAL_ENV = { ...process.env };

// Self-signed certificate for local-only test server to keep transport HTTPS.
const LOCAL_DEV_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8CfV1czh3Yb1V
f7bgfYprkR3cSWiFhFLCliRiwIteEUtQeeJ5OsHKR5KXgiAF/u0VcxP/w2XTUapL
DrybqpEgK8mqYRT6sJbH/mFIgWtd6W1Edv0Vbkrb5a6BJJ5BPTGm/fx409H3Kwz7
b+paBEuS04F5K37DZxEp7QXQAsYEA1P7He7EgG4TTnKybzH/UMZPmkX1ACiQtgsg
4u/zpdy5i9pyZvqrotuieg1JMcNJBquXstRTVp0ndO1jAcrORPUID1myBKfcCSfn
Q433nEa077QzgFiwUhK7O4cQV7icjYoigw+cOQvJiwwqPYwxBYielWaVYZGIhViW
pIKK+6DFAgMBAAECggEACoFt7s1sqrLRvqyffYRWDvNxHSUWy1rcutVjnAbQ4oUJ
1amxnv9K42/DP2a8PkmDWm7u/5udnURTRNVCcVoCuK7pmfTJlMX37p2GNuRQKNOJ
UMlrE17xnL6E1N9EXjW6h+9pwyBmey4zD/stNzFFPaNGeQwWjXk9Kr/80qXNBV1H
lsXSzAyOnQmteeKGyqZEtVOcu8L2aTztTEUc0NXC7zzBuONr7W7fEwor/VnuH+uW
2TpqXgJI3E/mE/Btn4YOReMuys6RY7IKKI17zMptr8lQgBmzT3tw+Tif697FGqDo
26aa0WiwEA7MrGj7UbOfc1ShrVcvwqEBLsLW/qMVswKBgQDzQl9TKIQfD3EOf4qy
rGnsY7806SMFHo5n0fq8OKcjLFypm5rBx5aJSCohFH1QQ1oLniVyhLeaG2RIWS9E
snp7qvWpZUd2xuzBrvb79CaphRUrWWdnLvMigBxfPVufwrbTgZU6uQhxlH15OdrW
aF/7y/HVajJghRtX0zzQ6L4WZwKBgQDF4zCsDHTwRXYWqCSHWhlXT23+Ca7FiKT2
CncAPY8ecP6Z+87/L0rliJ1jaYhVY1ASRDRw+/yI3GYOPUfW+Hhw6GCkPWbvjVZw
vGWTbXjd4Tt0O4MnMEjq8N0BICjPg/HyZzckNP3zH8XkqC+MzL2pJG+MapLH3xvZ
aqTsS6Sb8wKBgQCymorOzbKj83x4vqAhK4Hh9CKRQJNb0OGRzJQh2h6tLociaIMp
v9cBGKEGBLs1UR4t5YFtIZCEb5QjooeYEsrnPdB8/UWJKejvE/13Y/12/aVbXJsV
IV2WeSVbr/szw4zkogHlSbGvYuz1MstAHQZMI6N9pCk0wMYgp5HBeQEIBQKBgE7N
ZCp/Y2nzH01yc+l6lbDRLqoFTRXYjmh0TmNIIGAs+xZy0kGIobi6KILYGbR3MgG0
K3X6wtv1eKae/Ka8l6nOv/1nfkBS9mM6gvCsnX8uHDDzKg1HCyKT/E5gciABGS5A
sBK5D4/rzTB7UUQunDBpFArEveLeFAcGktqOXOTFAoGBALZym/Pa3PQbsyei0NDQ
aR+deUXLYT/d6nv3qJAkXsANU9f/IoAtcAPYhoQVbZRz+d342LK1go8Y4hope7zY
aAuuvOoAr3OfGqoEiHhTlrdUd3oAWZkYcfxuGOrLVZw/HI1BYUhq5IKCyOgPkIEo
x46byajPEP0zix2IZQxooMHW
-----END PRIVATE KEY-----`;

const LOCAL_DEV_CERT = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIUNvpuA+Yzg5mVgogJcobnurfoOuIwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI1MTEzMDEzNTIwMFoXDTI2MTEz
MDEzNTIwMFowFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAvAn1dXM4d2G9VX+24H2Ka5Ed3ElohYRSwpYkYsCLXhFL
UHnieTrBykeSl4IgBf7tFXMT/8Nl01GqSw68m6qRICvJqmEU+rCWx/5hSIFrXelt
RHb9FW5K2+WugSSeQT0xpv38eNPR9ysM+2/qWgRLktOBeSt+w2cRKe0F0ALGBANT
+x3uxIBuE05ysm8x/1DGT5pF9QAokLYLIOLv86XcuYvacmb6q6LbonoNSTHDSQar
l7LUU1adJ3TtYwHKzkT1CA9ZsgSn3Akn50ON95xGtO+0M4BYsFISuzuHEFe4nI2K
IoMPnDkLyYsMKj2MMQWInpVmlWGRiIVYlqSCivugxQIDAQABo1MwUTAdBgNVHQ4E
FgQU7VI4lWHTe3pBaUfjiN0pWHHcaJwwHwYDVR0jBBgwFoAU7VI4lWHTe3pBaUfj
iN0pWHHcaJwwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAuqsG
RguYDkEtYF7cbrU21wRzo+s5PLu8lr06iSlEr2XMRPFovOayPBbQUbROoXkdMHHj
vn2EP57T2UBvkr5GmLyewv9ZnpiO1CSV7LkZKPBCK50iMJpSjbsEVCLkRdJMkSg7
0lH6o3oD948iSuCrvZajzeCSzhm7yrM1oMObd6U1nLnIKJSsUVMMCruOzJHaziNF
WQiqePR4xVAHCpSB6TEzung4BQSq07uZOg0H0ftgp4gkQaH0MkWPdRm3nhAg/MHh
8pVVziZvQ51RCHi47Sl7PiIc7XSXVq9xtGitPlMmuvw/1VmRcaJkRCweicSdp0sN
tiQHYTFLFe4qws5lhg==
-----END CERTIFICATE-----`;

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
    const server = await new Promise<https.Server>((resolve) => {
      const srv = https.createServer(
        {
          key: LOCAL_DEV_KEY,
          cert: LOCAL_DEV_CERT
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
