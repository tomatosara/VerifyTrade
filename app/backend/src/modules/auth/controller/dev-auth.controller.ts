import { Body, Controller, Example, OperationId, Post, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { appConfig } from '@config/app';
import { signJwt } from '@modules/auth/jwt';
import { ForbiddenError } from '@utils/errors';
import { DevTokenRequest, DevTokenRequestSchema, DevTokenResponse } from '../dto/dev-token.dto';

interface DevTokenError {
  error: string;
  requestId?: string;
}

@Route('auth')
export class AuthController extends Controller {
  @Post('dev-token')
  @Tags('Auth')
  @OperationId('generateDevToken')
  @SuccessResponse('201', 'Token generated')
  @Response<DevTokenError>('403', 'Disabled in production')
  @Example<DevTokenResponse>({
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    expiresIn: '1h',
    role: 'user'
  })
  public generateDevToken(@Body() body: DevTokenRequest): DevTokenResponse {
    if (appConfig.nodeEnv === 'production') {
      throw new ForbiddenError('Dev token endpoint disabled in production');
    }

    const dto = DevTokenRequestSchema.parse(body);
    const role = dto.role ?? 'user';
    const token = signJwt({
      sub: dto.userId,
      role,
      email: dto.email,
      name: dto.name
    });

    this.setStatus(201);

    return {
      token,
      expiresIn: '1h',
      role
    };
  }
}
