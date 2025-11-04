import { DataSource } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { featureFlags, type FeatureFlags } from '@config/featureFlags';
import { appConfig } from '@config/app';
import { TradeFormRepository } from '../repo/tradeform.repository';
import { TradeFormEntity, type TradeFormStatus } from '../entity/tradeform.entity';
import { createAuditEvent } from '../service/audit.helpers';
import { ConflictError, NotFoundError } from '@utils/errors';
import { logger } from '@utils/logger';

type FinalizeReason = 'auto' | 'manual' | 'retry';

export interface FinalizeResult {
  status: TradeFormStatus;
  meta: Record<string, unknown>;
  error?: string;
}

const ALLOWED_STATUSES_FOR_FINALIZE: TradeFormStatus[] = ['confirmed', 'failed'];

export class TradeFinalizationService {
  private readonly flags: FeatureFlags;

  constructor(private readonly dataSource: DataSource = AppDataSource, flags: FeatureFlags = featureFlags) {
    this.flags = flags;
  }

  async finalize(uid: string, actorId: string, reason: FinalizeReason = 'auto'): Promise<FinalizeResult> {
    return this.dataSource.transaction(async (manager) => {
      const repo = new TradeFormRepository(manager);
      const trade = await repo.findByUidForUpdate(uid);
      if (!trade) {
        throw new NotFoundError('Trade form not found');
      }

      if (!ALLOWED_STATUSES_FOR_FINALIZE.includes(trade.status) && trade.status !== 'done') {
        throw new ConflictError('Trade form not ready for finalization');
      }

      if (trade.status === 'done') {
        logger.info({ tradeUid: trade.uid }, 'finalize noop - already done');
        return { status: trade.status, meta: trade.meta ?? {} };
      }

      trade.finalizeAttempts += 1;
      const attemptAt = new Date();

      const persistStrategy = this.flags.persistStrategy;
      const metaUpdates: Record<string, unknown> = {};

      try {
        if (persistStrategy === 'chain' || persistStrategy === 'db+chain') {
          const txHash = await this.anchorOnChain(trade);
          metaUpdates.chain_tx_hash = txHash;
        }

        if (persistStrategy === 'db' || persistStrategy === 'db+chain') {
          await this.persistToDatabase(trade);
        }

        trade.meta = this.mergeMeta(trade.meta ?? {}, metaUpdates);
        trade.status = 'done';
        trade.finalizedAt = attemptAt;
        trade.finalizeFailedAt = null;
        trade.finalizeError = null;

        await repo.save(trade);
        const auditEvent = createAuditEvent(trade.uid, actorId, 'finalize', {
          strategy: persistStrategy,
          reason
        });
        await repo.appendAuditEvent(trade, auditEvent);

        logger.info({ tradeUid: trade.uid, strategy: persistStrategy }, 'trade finalized');

        return { status: trade.status, meta: trade.meta ?? {} };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Finalization failed';
        trade.status = 'failed';
        trade.finalizeFailedAt = attemptAt;
        trade.finalizeError = message;
        trade.meta = this.mergeMeta(trade.meta ?? {}, metaUpdates);

        await repo.save(trade);
        const auditEvent = createAuditEvent(trade.uid, actorId, 'fail', {
          strategy: persistStrategy,
          reason,
          error: message
        });
        await repo.appendAuditEvent(trade, auditEvent);

        logger.error({ tradeUid: trade.uid, err: error }, 'trade finalization failed');

        return { status: trade.status, meta: trade.meta ?? {}, error: message };
      }
    });
  }

  private async persistToDatabase(trade: TradeFormEntity): Promise<void> {
    void trade;
    // Placeholder for additional persistence logic (e.g. archival storage)
    return Promise.resolve();
  }

  private async anchorOnChain(trade: TradeFormEntity): Promise<string> {
    void trade;
    if (!this.flags.chainRpcUrl || !this.flags.chainWalletKey) {
      // simulate missing chain config resulting in failure
      throw new Error('Chain configuration missing');
    }

    // Simulate asynchronous blockchain anchoring
    return Promise.resolve(`0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`);
  }

  private mergeMeta(current: Record<string, unknown>, updates: Record<string, unknown>) {
    const merged = { ...current };
    for (const [key, value] of Object.entries(updates)) {
      if (appConfig.allowedMetaKeys.has(key)) {
        merged[key] = value;
      }
    }
    return merged;
  }
}
