import type { Request as ExpressRequest } from 'express';
import { AuthController } from './dev-auth.controller';

describe('AuthController', () => {
  it('throws an http error when /me is called without a user', async () => {
    const controller = new AuthController();
    await expect(controller.me({} as ExpressRequest)).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized'
    });
  });
});
