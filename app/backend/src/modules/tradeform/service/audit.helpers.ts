import { randomUUID } from 'crypto';
import type { AuditEvent } from '../entity/tradeform.entity';

const AUDIT_ACTIONS = new Set([
  'create',
  'verifyVC',
  'confirm',
  'cancel',
  'finalize',
  'fail',
  'retry'
]);

export function createAuditEvent(
  tradeUid: string,
  actorId: string,
  action: AuditEvent['action'],
  details?: Record<string, unknown>
): AuditEvent {
  if (!AUDIT_ACTIONS.has(action)) {
    throw new Error(`Unsupported audit action: ${action}`);
  }

  return {
    id: randomUUID(),
    tradeUid,
    actorId,
    action,
    at: new Date().toISOString(),
    details: details ?? null
  };
}

export function normalizeAuditLog(log?: AuditEvent[]): AuditEvent[] {
  return [...(log ?? [])]
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .map((event) => ({
      ...event,
      at: new Date(event.at).toISOString()
    }));
}
