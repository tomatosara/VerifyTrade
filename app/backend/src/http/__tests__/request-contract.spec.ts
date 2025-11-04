import request from 'supertest';

describe('HTTP request contracts', () => {
  let app: import('express').Express;
  let token: string;

  beforeAll(async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-1234567890';
    process.env.PLATFORM_JWT_SECRET = 'test-secret-1234567890';
    process.env.JWT_ISSUER = 'verifytrade-test';
    process.env.JWT_AUDIENCE = 'verifytrade-clients';
    process.env.SHARE_URL_BASE = 'https://app.contract-test/join';
    process.env.RATE_LIMIT_MAX = '200';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.PORT = '4010';
    process.env.HOST = '127.0.0.1';

    jest.doMock('@middleware/idempotency', () => ({
      idempotencyMiddleware: (_req: unknown, _res: unknown, next: () => void) => next()
    }));

    jest.doMock('@middleware/rateLimit', () => {
      const passthrough = (_req: unknown, _res: unknown, next: () => void) => next();
      return {
        createRateLimit: () => passthrough,
        verifyVCRateLimit: passthrough,
        confirmRateLimit: passthrough
      };
    });

    const appModule = await import('../../app');
    app = appModule.createApp();

    const authModule = await import('@modules/auth/jwt');
    token = authModule.signJwt({
      sub: 'user-1',
      role: 'user',
      email: 'user@example.com',
      name: 'Test User'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows optional filters when listing own trade forms', async () => {
    const serviceModule = await import('@modules/tradeform/service/tradeform.service');
    const mockResponse = {
      data: [],
      page: 1,
      pageSize: 20,
      total: 0
    };

    const spy = jest
      .spyOn(serviceModule.TradeFormService.prototype, 'listTradeForms')
      .mockResolvedValue(mockResponse);

    const response = await request(app)
      .get('/api/v1/me/tradeforms')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(mockResponse);
    expect(spy).toHaveBeenCalledWith('user-1', {
      status: undefined,
      created_from: undefined,
      created_to: undefined,
      page: 1,
      page_size: 20
    });

    spy.mockRestore();
  });

  it('rejects invalid trade form amount per schema', async () => {
    const response = await request(app)
      .post('/api/v1/tradeforms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bad Trade',
        description: 'Invalid amount test',
        amount: 'abc'
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Validation Failed');
  });

  it('validates VC payload shape', async () => {
    const serviceModule = await import('@modules/tradeform/service/tradeform.service');
    const spy = jest
      .spyOn(serviceModule.TradeFormService.prototype, 'verifyVC')
      .mockResolvedValue({
        valid: true,
        status: 'verified'
      });

    const response = await request(app)
      .post('/api/v1/tradeforms/trade-123/verify-vc')
      .set('Authorization', `Bearer ${token}`)
      .send({
        credential: 'not-an-object'
      });

    expect(response.status).toBe(422);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
