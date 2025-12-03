// src/modules/auth/controller/auth.controller.ts
import {
  Body, Controller, OperationId, Post, Route, SuccessResponse,
  Tags, Request, Get, Security
} from 'tsoa';
import type { Request as ExpressRequest } from 'express';
import VerifierService from '@modules/verifier/service/verifier.service';
import { signJwt, verifyJwt } from '@modules/auth/jwt';
import { ForbiddenError } from '@utils/errors';
import createError from 'http-errors';
import { AppDataSource } from '@database/data-source';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { clearRefreshCookie, makeRefreshCookie } from '../cookies';
import {
  CSRF_COOKIE_NAME,
  clearCsrfCookie,
  generateCsrfToken,
  makeCsrfCookie,
  parseRequestCookies,
  readCsrfHeaderToken
} from '../csrf';
import { getSecurityConfig } from '@config/security';

export interface LoginByVerifierRequest { transactionId: string; }
export interface LoginResponse { accessToken: string; expiresIn: string; }
export interface RefreshResponse { accessToken: string; expiresIn: string; }
export interface LogoutResponse { success: true; }

@Tags('Auth')
@Route('auth')
export class AuthController extends Controller {
  @Post('login-by-verifier')
  @OperationId('loginByVerifier')
  @SuccessResponse('200', 'Logged in')
  public async loginByVerifier(@Body() body: LoginByVerifierRequest): Promise<LoginResponse> {
    const verifier = new VerifierService();
    const claims = await verifier.getClaimsByTransactionId(body.transactionId);
    if (!claims) {
      throw new ForbiddenError('Invalid or incomplete verification transaction');
    }
    const userRepo = AppDataSource.getRepository(UserEntity);
    let user = await userRepo.findOne({ where: { idNumber: claims.idNumber } });
    if (!user) {
      user = userRepo.create({
        idNumber: claims.idNumber,
        name: claims.name,
        birthday: claims.birthday
      });
      user = await userRepo.save(user);
    }

    // 直接用 claims 組 payload（sub 用穩定鍵：idn:<身分證字號>）
    const accessExp = '15m';
    const refreshExp = '7d';
    const { jwtRefreshSecret } = getSecurityConfig();

    const accessPayload = {
      id: user.id,
      sub: `idn:${claims.idNumber}`,
      role: 'user' as const,
      idNumber: claims.idNumber,
      name: claims.name,
      birthday: claims.birthday,
    };

    const accessToken = signJwt(accessPayload, { expiresIn: accessExp });

    // 建議把最基本身分也放進 refresh，refresh → access 不必再碰 DB
    const refreshPayload = {
      id: user.id,
      sub: accessPayload.sub,
      typ: 'refresh' as const,
      idNumber: claims.idNumber,
      name: claims.name,
      role: 'user' as const,
    };
    const refreshToken = signJwt(refreshPayload, {
      expiresIn: refreshExp,
      secret: jwtRefreshSecret
    });

    const csrfToken = generateCsrfToken();
    this.setHeader('Set-Cookie', [
      makeRefreshCookie(refreshToken),
      makeCsrfCookie(csrfToken, '/api/v1')
    ]);
    return { accessToken, expiresIn: accessExp };
  }

  @Post('refresh')
  @OperationId('refreshAccessToken')
  @Security('refreshTokenCookie', [])
  public async refresh(@Request() req: ExpressRequest): Promise<RefreshResponse> {
    const cookies = parseRequestCookies(req);
    const refresh = cookies.refresh_token;

    if (!refresh) {
      this.setStatus(401);
      return { accessToken: '', expiresIn: '0' };
    }

    const { jwtRefreshSecret } = getSecurityConfig();
    const payload = verifyJwt<any>(refresh, jwtRefreshSecret);
    if (!payload?.sub || payload?.typ !== 'refresh') {
      this.setStatus(401);
      return { accessToken: '', expiresIn: '0' };
    }
    const csrfCookie = cookies[CSRF_COOKIE_NAME];
    const csrfHeader = readCsrfHeaderToken(req);
    if (csrfCookie && csrfCookie !== csrfHeader) {
      this.setStatus(403);
      return { accessToken: '', expiresIn: '0' };
    }
    let actorId: string | undefined = payload.id;
    console.log('Refresh token payload:', payload);
    if (!actorId && payload.idNumber) {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const user = await userRepo.findOne({ where: { idNumber: payload.idNumber } });
      actorId = user?.id;
    }

    // 用 refresh 的資訊重簽 access
    const accessExp = '15m';
    const accessToken = signJwt(
      {
        id: actorId,
        sub: payload.sub,
        role: payload.role ?? 'user',
        idNumber: payload.idNumber,
        name: payload.name,
        birthday: payload.birthday,
      },
      { expiresIn: accessExp }
    );

    const csrfToken = csrfCookie ?? generateCsrfToken();
    this.setHeader('Set-Cookie', [
      makeRefreshCookie(refresh, '/api/v1/auth'),
      makeCsrfCookie(csrfToken, '/api/v1')
    ]);
    return { accessToken, expiresIn: accessExp };
  }

  @Post('logout')
  @OperationId('logout')
  @Security('bearerAuth', [])
  public async logout(): Promise<LogoutResponse> {
    this.setHeader('Set-Cookie', [clearRefreshCookie(), clearCsrfCookie('/api/v1')]);
    return { success: true };
  }

  @Get('me')
  @Security('bearerAuth', [])
  @OperationId('whoAmI')
  @SuccessResponse('200', 'OK')
  public async me(@Request() req: ExpressRequest) {
    const user = (req as any).user;
    if (!user) throw createError(401, 'Unauthorized');

    return {
      sub: `idn:${user.idNumber}`,  // 用 idNumber 生成 sub
      ...user
    };
  }

  @Get('csrf')
  @OperationId('getCsrfToken')
  public async csrf(@Request() req: ExpressRequest): Promise<{ csrfToken: string }> {
    const cookies = parseRequestCookies(req);
    const refresh = cookies.refresh_token;

    const { jwtRefreshSecret } = getSecurityConfig();
    const payload = refresh && verifyJwt<any>(refresh, jwtRefreshSecret);
    const hasValidSession = Boolean(payload?.sub && payload?.typ === 'refresh');

    const csrfToken = cookies[CSRF_COOKIE_NAME] ?? generateCsrfToken();
    this.setHeader('Set-Cookie', makeCsrfCookie(csrfToken, '/api/v1'));
    if (!hasValidSession) {
      // Issue a token for the double-submit header even before login;
      // the middleware still requires a refresh_token cookie before enforcing CSRF.
      return { csrfToken };
    }
    return { csrfToken };
  }
}
