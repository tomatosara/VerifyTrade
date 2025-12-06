import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { CSRF_REQUEST_ID_HEADER_NAME } from '@modules/auth/csrf';

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // CSRF fix: added per-request nonce awareness so the CSRF nonce drives correlation IDs.
  const headerId =
    (req.headers[CSRF_REQUEST_ID_HEADER_NAME] as string | undefined) ??
    (req.headers['x-request-id'] as string | undefined) ??
    (req.headers['x-correlation-id'] as string | undefined);
  req.requestId = headerId ?? randomUUID();
  next();
}
