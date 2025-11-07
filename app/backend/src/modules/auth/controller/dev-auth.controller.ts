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

// 小工具：設置/清除 refresh cookie（與你現有版本一致即可）
import { serialize } from 'cookie';
const setRefreshCookie = (token: string) =>
  serialize('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth',
    maxAge: 60 * 60 * 24 * 7,
  });
const clearRefreshCookie = () =>
  serialize('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth',
    maxAge: 0,
  });

export interface LoginByVerifierRequest { transactionId: string; }
export interface LoginResponse { accessToken: string; expiresIn: string; }
export interface RefreshResponse { accessToken: string; expiresIn: string; }
export interface LogoutResponse { success: true; }

@Route('auth')
export class AuthController extends Controller {
  @Post('login-by-verifier')
  @Tags('Auth')
  @OperationId('loginByVerifier')
  @SuccessResponse('200', 'Logged in')
  public async loginByVerifier(@Body() body: LoginByVerifierRequest): Promise<LoginResponse> {
    const verifier = new VerifierService();
    const claims = await verifier.getClaimsByTransactionId(body.transactionId);
    if (!claims) {
      throw new ForbiddenError('Invalid or incomplete verification transaction');
    }

    // 直接用 claims 組 payload（sub 用穩定鍵：idn:<身分證字號>）
    const accessExp = '15m';
    const refreshExp = '7d';

    const accessPayload = {
      sub: `idn:${claims.idNumber}`,
      role: 'user' as const,
      idNumber: claims.idNumber,
      name: claims.name,
      birthday: claims.birthday,
    };

    const accessToken = signJwt(accessPayload, { expiresIn: accessExp });

    // 建議把最基本身分也放進 refresh，refresh → access 不必再碰 DB
    const refreshPayload = {
      sub: accessPayload.sub,
      typ: 'refresh' as const,
      idNumber: claims.idNumber,
      name: claims.name,
      role: 'user' as const,
    };
    const refreshToken = signJwt(refreshPayload, {
      expiresIn: refreshExp,
      secret: process.env.JWT_REFRESH_SECRET,
    });

    this.setHeader('Set-Cookie', setRefreshCookie(refreshToken));
    return { accessToken, expiresIn: accessExp };
  }

  @Post('refresh')
  @Tags('Auth')
  @OperationId('refreshAccessToken')
  public async refresh(@Request() req: ExpressRequest): Promise<RefreshResponse> {
    const cookie = req.headers.cookie || '';
    const refresh = cookie
      .split(';')
      .map(s => s.trim())
      .find(s => s.startsWith('refresh_token='))
      ?.split('=')[1];

    if (!refresh) {
      this.setStatus(401);
      return { accessToken: '', expiresIn: '0' };
    }

    const payload = verifyJwt<any>(refresh, process.env.JWT_REFRESH_SECRET!);
    if (!payload?.sub || payload?.typ !== 'refresh') {
      this.setStatus(401);
      return { accessToken: '', expiresIn: '0' };
    }

    // 用 refresh 的資訊重簽 access
    const accessExp = '15m';
    const accessToken = signJwt(
      {
        sub: payload.sub,
        role: payload.role ?? 'user',
        idNumber: payload.idNumber,
        name: payload.name,
      },
      { expiresIn: accessExp }
    );

    return { accessToken, expiresIn: accessExp };
  }

  @Post('logout')
  @Tags('Auth')
  @OperationId('logout')
  public async logout(): Promise<LogoutResponse> {
    this.setHeader('Set-Cookie', clearRefreshCookie());
    return { success: true };
  }

  @Get('me')
  @Tags('Auth')
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
}
