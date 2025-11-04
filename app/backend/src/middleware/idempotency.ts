import { createHash } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@database/data-source';
import { ConflictError, UnauthorizedError } from '@utils/errors';
import { IdempotencyKeyEntity } from '@modules/tradeform/entity/idempotency-key.entity';

const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

function hashResult(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers['idempotency-key'] as string | undefined)?.trim();

  if (!key) {
    return next();
  }

  if (!req.user) {
    throw new UnauthorizedError('Authentication required for idempotent requests');
  }

  req.idempotencyKey = key;
  const repo = AppDataSource.getRepository(IdempotencyKeyEntity);
  const now = Date.now();
  let record = await repo.findOne({ where: { key } });

  if (record && record.expiresAt.getTime() < now) {
    await repo.delete({ id: record.id });
    record = null;
  }

  if (record) {
    if (record.actorId !== req.user.id || record.route !== req.originalUrl) {
      throw new ConflictError('Idempotency key already used on a different request');
    }

    if (record.statusCode === 0) {
      throw new ConflictError('Request with this idempotency key is already in progress');
    }

    res.status(record.statusCode);
    res.setHeader('Idempotency-Key', record.key);
    return res.json(record.responseBody);
  }

  const placeholder = repo.create({
    key,
    route: req.originalUrl,
    actorId: req.user.id,
    statusCode: 0,
    responseBody: null,
    resultHash: '',
    expiresAt: new Date(now + IDEMPOTENCY_WINDOW_MS)
  });

  try {
    await repo.save(placeholder);
  } catch (error: unknown) {
    throw new ConflictError('Idempotency key already in use');
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    const resultHash = hashResult(body);
    const updatePayload = {
      statusCode: res.statusCode,
      responseBody: body as IdempotencyKeyEntity['responseBody'],
      resultHash,
      expiresAt: new Date(now + IDEMPOTENCY_WINDOW_MS)
    } as QueryDeepPartialEntity<IdempotencyKeyEntity>;
    void repo.update({ key }, updatePayload).catch(() => {
      // swallow update failure, response already going out
    });
    res.setHeader('Idempotency-Key', key);
    return originalJson(body);
  };

  return next();
}
