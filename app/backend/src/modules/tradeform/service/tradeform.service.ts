import { DataSource } from 'typeorm';
import { nanoid } from 'nanoid';
import { AppDataSource } from '@database/data-source';
import { featureFlags, type FeatureFlags } from '@config/featureFlags';
import { appConfig } from '@config/app';
import { TradeFormRepository } from '../repo/tradeform.repository';
import { type TradeFormStatus, TradeFormEntity } from '../entity/tradeform.entity';
import { TradeConfirmationRole } from '../entity/trade-confirmation.entity';
import {
  CancelDto,
  ConfirmDto,
  CreateTradeFormDto,
  TradeFormListQuery,
  TradeFormView,
  TradeFormMinimalView,
  AuditEventView,
  TradeFormListResponse,
  TradeFormListItemView
} from '../dto/tradeform.dto';
import { validateVC } from '@modules/vc/validateVC';
import {
  ConflictError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnauthorizedError
} from '@utils/errors';
import { logger } from '@utils/logger';
import { TradeFinalizationService } from '../persistence/finalize';
import { createAuditEvent, normalizeAuditLog } from './audit.helpers';

interface TradeFormCreationResult {
  uid: string;
  status: TradeFormStatus;
  shareUrl: string;
}

interface ConfirmResult {
  status: TradeFormStatus;
  finalizeTriggered: boolean;
}

interface VerifyVCResult {
  valid: boolean;
  status: TradeFormStatus;
  reason?: string;
}

interface CancelResult {
  status: TradeFormStatus;
}

type TradeFormResponse = TradeFormView | TradeFormMinimalView;

function mapToView(trade: TradeFormEntity): TradeFormView {
  return {
    uid: trade.uid,
    title: trade.title,
    description: trade.description,
    amount: trade.amount ?? null,
    status: trade.status,
    creatorId: trade.creatorId,
    counterpartyId: trade.counterpartyId,
    meta: trade.meta ?? {},
    createdAt: trade.createdAt,
    updatedAt: trade.updatedAt,
    auditLog: normalizeAuditLog(trade.auditLog).map((event) => ({
      ...event,
      at: new Date(event.at)
    }))
  };
}

function isUidExpired(trade: TradeFormEntity): boolean {
  if (!trade.uidExpiresAt) {
    return false;
  }

  if (trade.status !== 'pending' && trade.status !== 'draft') {
    return false;
  }

  return trade.uidExpiresAt.getTime() < Date.now();
}

export class TradeFormService {
  private readonly dataSource: DataSource;
  private readonly flags: FeatureFlags;
  private readonly finalizationService: TradeFinalizationService;

  constructor(dataSource: DataSource = AppDataSource, flags: FeatureFlags = featureFlags) {
    this.dataSource = dataSource;
    this.flags = flags;
    this.finalizationService = new TradeFinalizationService(this.dataSource, this.flags);
  }

  async createTradeForm(dto: CreateTradeFormDto, creatorId: string): Promise<TradeFormCreationResult> {
    return this.dataSource.transaction(async (manager) => {
      const repo = new TradeFormRepository(manager);
      const uid = nanoid(26);

      const trade = manager.create(TradeFormEntity, {
        uid,
        creatorId,
        counterpartyId: null,
        title: dto.title,
        description: dto.description,
        amount: dto.amount ?? null,
        status: 'pending' as TradeFormStatus,
        meta: {},
        auditLog: [],
        uidExpiresAt: new Date(Date.now() + this.flags.uidTtlMinutes * 60 * 1000)
      });

      await repo.save(trade);

      const auditEvent = createAuditEvent(uid, creatorId, 'create', {
        title: dto.title
      });

      await repo.appendAuditEvent(trade, auditEvent);

      logger.info({ tradeUid: uid, creatorId }, 'trade form created');

      return {
        uid,
        status: trade.status,
        shareUrl: `${appConfig.shareUrlBase}/${uid}`
      };
    });
  }

  async getTradeForm(uid: string, actorId: string): Promise<TradeFormResponse> {
    const repo = new TradeFormRepository();
    const trade = await repo.findByUid(uid);
    if (!trade) {
      throw new NotFoundError('Trade form not found');
    }

    if (isUidExpired(trade)) {
      throw new GoneError('Trade form UID expired');
    }

    const isCreator = trade.creatorId === actorId;
    const isCounterparty = trade.counterpartyId === actorId;
    const isValidatedCounterparty = isCounterparty && Boolean(trade.vcVerifiedAt);

    if (!isCreator && !isValidatedCounterparty) {
      return {
        uid: trade.uid,
        status: trade.status
      };
    }

    return mapToView(trade);
  }

  async verifyVC(
    uid: string,
    actorId: string,
    credential?: Record<string, unknown>
  ): Promise<VerifyVCResult> {
    return this.dataSource.transaction(async (manager) => {
      const repo = new TradeFormRepository(manager);
      const trade = await repo.findByUidForUpdate(uid);
      if (!trade) {
        throw new NotFoundError('Trade form not found');
      }

      if (isUidExpired(trade)) {
        throw new GoneError('Trade form UID expired');
      }

      if (trade.status !== 'pending' && trade.status !== 'verified') {
        throw new ConflictError('Trade form not in a verifiable state');
      }

      if (trade.creatorId === actorId) {
        throw new ForbiddenError('Creator cannot verify as counterparty');
      }

      if (trade.counterpartyId && trade.counterpartyId !== actorId) {
        throw new ForbiddenError('Trade form already associated with a counterparty');
      }

      const result = await validateVC({
        userId: actorId,
        tradeUid: trade.uid,
        credential
      });

      if (!result.valid) {
        logger.warn(
          { tradeUid: trade.uid, actorId, reason: result.reason },
          'vc verification failed'
        );
        return { valid: false, status: trade.status, reason: result.reason };
      }

      trade.status = 'verified';
      trade.counterpartyId = actorId;
      trade.vcVerifiedAt = new Date();

      await repo.save(trade);

      const auditEvent = createAuditEvent(trade.uid, actorId, 'verifyVC');
      await repo.appendAuditEvent(trade, auditEvent);

      logger.info({ tradeUid: trade.uid, actorId }, 'vc verification succeeded');

      return {
        valid: true,
        status: trade.status
      };
    });
  }

  async confirmTradeForm(
    uid: string,
    actorId: string,
    dto: ConfirmDto
  ): Promise<ConfirmResult> {
    const { role } = dto;

    const { finalizeTriggered, status } = await this.dataSource.transaction(async (manager) => {
      const repo = new TradeFormRepository(manager);
      const trade = await repo.findByUidForUpdate(uid);
      if (!trade) {
        throw new NotFoundError('Trade form not found');
      }

      if (isUidExpired(trade)) {
        throw new GoneError('Trade form UID expired');
      }

      if (trade.status !== 'verified' && trade.status !== 'confirmed' && trade.status !== 'done') {
        throw new ConflictError('Trade form cannot be confirmed in its current state');
      }

      if (role === 'user1') {
        if (trade.creatorId !== actorId) {
          throw new ForbiddenError('Only creator may confirm as user1');
        }
        if (this.flags.requireVcForCreator && !trade.vcVerifiedAt) {
          throw new ConflictError('VC verification required before confirmation');
        }
      } else {
        if (!trade.counterpartyId) {
          throw new ConflictError('Trade form has no counterparty');
        }
        if (trade.counterpartyId === trade.creatorId) {
          throw new ConflictError('Counterparty must differ from creator');
        }
        if (trade.counterpartyId !== actorId) {
          throw new ForbiddenError('Only counterparty may confirm as user2');
        }
        if (!trade.vcVerifiedAt) {
          throw new ConflictError('VC verification required before confirmation');
        }
      }

      const alreadyConfirmed =
        role === 'user1' ? trade.confirmedByUser1 : trade.confirmedByUser2;

      if (!alreadyConfirmed) {
        const recorded = await repo.recordConfirmation({
          tradeUid: trade.uid,
          actorId,
          role: role as TradeConfirmationRole
        });

        if (recorded) {
          if (role === 'user1') {
            trade.confirmedByUser1 = true;
          } else {
            trade.confirmedByUser2 = true;
          }
          const auditEvent = createAuditEvent(trade.uid, actorId, 'confirm', {
            role
          });
          await repo.appendAuditEvent(trade, auditEvent);
          logger.info({ tradeUid: trade.uid, actorId, role }, 'trade confirmation recorded');
        }
      }

      if (trade.confirmedByUser1 && trade.confirmedByUser2) {
        if (trade.status === 'verified') {
          trade.status = 'confirmed';
        }
      }

      await repo.save(trade);

      return {
        status: trade.status,
        finalizeTriggered: trade.confirmedByUser1 && trade.confirmedByUser2
      };
    });

    if (finalizeTriggered) {
      void this.finalizationService.finalize(uid, actorId, 'auto').catch((error) => {
        logger.error({ tradeUid: uid, err: error }, 'auto finalization failed');
      });
    }

    return {
      status,
      finalizeTriggered
    };
  }

  async cancelTradeForm(uid: string, actorId: string, dto: CancelDto): Promise<CancelResult> {
    return this.dataSource.transaction(async (manager) => {
      const repo = new TradeFormRepository(manager);
      const trade = await repo.findByUidForUpdate(uid);
      if (!trade) {
        throw new NotFoundError('Trade form not found');
      }

      if (!['pending', 'verified', 'confirmed'].includes(trade.status)) {
        throw new ConflictError('Trade form cannot be cancelled in its current state');
      }

      const isParticipant = trade.creatorId === actorId || trade.counterpartyId === actorId;
      if (!isParticipant) {
        throw new UnauthorizedError('Only trade participants may cancel');
      }

      if (trade.finalizeAttempts > 0) {
        throw new ConflictError('Trade form already undergoing finalization');
      }

      trade.status = 'cancelled';
      await repo.save(trade);

      const auditEvent = createAuditEvent(trade.uid, actorId, 'cancel', {
        reason: dto.reason
      });
      await repo.appendAuditEvent(trade, auditEvent);

      logger.info({ tradeUid: trade.uid, actorId }, 'trade cancelled');

      return { status: trade.status };
    });
  }

  async finalize(uid: string, actorId: string) {
    return this.finalizationService.finalize(uid, actorId, 'manual');
  }

  async retryFinalize(uid: string, actorId: string) {
    return this.finalizationService.finalize(uid, actorId, 'retry');
  }

  async listTradeForms(
    actorId: string,
    query: TradeFormListQuery
  ): Promise<TradeFormListResponse> {
    const { status, created_from, created_to, page, page_size } = query;
    const take = page_size;
    const skip = (page - 1) * page_size;

    const repo = new TradeFormRepository();
    const qb = repo.createQueryBuilder('trade');
    qb.where('(trade.creatorId = :actorId OR trade.counterpartyId = :actorId)', { actorId });

    if (status) {
      qb.andWhere('trade.status = :status', { status });
    }

    if (created_from) {
      qb.andWhere('trade.createdAt >= :from', { from: created_from });
    }

    if (created_to) {
      qb.andWhere('trade.createdAt <= :to', { to: created_to });
    }

    qb.orderBy('trade.createdAt', 'DESC');
    qb.skip(skip);
    qb.take(take);

    const [rows, total] = await qb.getManyAndCount();

    const data: TradeFormListItemView[] = rows.map((trade) => ({
      ...mapToView(trade),
      shareUrl: `${appConfig.shareUrlBase}/${trade.uid}`
    }));

    return {
      data,
      page,
      pageSize: page_size,
      total
    };
  }

  async getAuditLog(uid: string, actorId: string): Promise<AuditEventView[]> {
    const repo = new TradeFormRepository();
    const trade = await repo.findByUid(uid);
    if (!trade) {
      throw new NotFoundError('Trade form not found');
    }

    const isParticipant =
      trade.creatorId === actorId || (trade.counterpartyId === actorId && trade.vcVerifiedAt);
    if (!isParticipant) {
      throw new ForbiddenError('Audit log available only to participants');
    }

    return normalizeAuditLog(trade.auditLog).map((event) => ({
      ...event,
      at: new Date(event.at)
    }));
  }
}
