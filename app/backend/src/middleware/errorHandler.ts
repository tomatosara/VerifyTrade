import { NextFunction, Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import { ZodError } from 'zod';
import { logger } from '@utils/logger';
import { AppError, InternalServerError } from '@utils/errors';

interface ErrorResponse {
  error: string;
  details?: unknown;
  requestId?: string;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let status = 500;
  let body: ErrorResponse = {
    error: 'Internal Server Error'
  };

  if (err instanceof AppError) {
    status = err.statusCode;
    body = {
      error: err.message,
      details: err.details,
      requestId: req.requestId
    };
  } else if (err instanceof ValidateError) {
    status = 422;
    body = {
      error: 'Validation Failed',
      details: err?.fields,
      requestId: req.requestId
    };
  } else if (err instanceof ZodError) {
    status = 422;
    body = {
      error: 'Validation Failed',
      details: err.flatten(),
      requestId: req.requestId
    };
  } else if (err instanceof Error) {
    status = (err as InternalServerError).statusCode ?? 500;
    body = {
      error: err.message,
      requestId: req.requestId
    };
  }

  logger.error(
    {
      err,
      status,
      path: req.path,
      requestId: req.requestId,
      userId: req.user?.id
    },
    'request error'
  );

  res.status(status).json(body);
}
