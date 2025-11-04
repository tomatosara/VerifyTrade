import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const headerId =
    (req.headers['x-request-id'] as string | undefined) ??
    (req.headers['x-correlation-id'] as string | undefined);
  req.requestId = headerId ?? randomUUID();
  next();
}
