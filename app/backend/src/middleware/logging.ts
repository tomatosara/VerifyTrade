import pinoHttp, { type HttpLogger } from 'pino-http';
import type { Request, Response } from 'express';
import { logger } from '@utils/logger';

export const loggingMiddleware: HttpLogger<Request, Response> = pinoHttp<Request, Response>({
  logger,
  customProps: (req: Request) => ({
    requestId: req.requestId,
    userId: req.user?.id
  })
});
