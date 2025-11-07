// src/modules/trade/trade.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TradeFormEntity } from '@modules/tradeform/entity/trade-form.entity';
import { TradeFormStatus } from '@modules/tradeform/enums/TradeFormEnums';
import { TradeAuditEventEntity } from '@modules/tradeform/entity/trade-audit-event.entity';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { TradeDetailDto } from '@modules/trade/dto/trade-detail.dto';
import { TradeSummaryDto } from './dto/trade-summary.dto';
import { TradeAuditEventDto } from './dto/trade-audit-event.dto';
import createHttpError from 'http-errors';

export class TradeService {
  private tradeRepo: Repository<TradeFormEntity>;
  private auditRepo: Repository<TradeAuditEventEntity>;
  private userRepo: Repository<UserEntity>;

  constructor() {
    this.tradeRepo = AppDataSource.getRepository(TradeFormEntity);
    this.auditRepo = AppDataSource.getRepository(TradeAuditEventEntity);
    this.userRepo = AppDataSource.getRepository(UserEntity);
  }

  async getUserTrades(params: {
    userId: string;
    status?: string;
    page: number;
    pageSize: number;
    from?: string;
    to?: string;
  }): Promise<{ items: TradeSummaryDto[]; total: number }> {
    const { userId, status, page, pageSize, from, to } = params;

    const qb = this.tradeRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.creator', 'creator')
      .leftJoinAndSelect('t.counterparty', 'counterparty')
      .where('(t.creatorId = :userId OR t.counterpartyId = :userId)', { userId })
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (status) {
      qb.andWhere('t.status = :status', {
        status: status as TradeFormStatus,
      });
    }
    if (from) {
      qb.andWhere('t.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('t.createdAt <= :to', { to });
    }

    const [rows, total] = await qb.getManyAndCount();

    const items: TradeSummaryDto[] = rows.map((t) => ({
      uid: t.uid,
      itemName: t.itemName,
      amount: t.amount,
      status: t.status,
      tradeChannel: t.tradeChannel,
      paymentMethod: t.paymentMethod,
      createdAt: t.createdAt.toISOString(),
      finalizedAt: t.finalizedAt ? t.finalizedAt.toISOString() : null,
      creatorName: t.creator?.name ?? null,
      counterpartyName: t.counterparty?.name ?? null,
    }));

    return { items, total };
  }

  async getTradeDetailForUser(userId: string, uid: string): Promise<TradeDetailDto> {
    const trade = await this.tradeRepo.findOne({
      where: { uid },
      relations: ['creator', 'counterparty'],
    });

    if (!trade) throw createHttpError(404, 'Trade not found');
    console.log("trade.creatorId", trade.creatorId)
    console.log("trade.userId",userId)
    const isParticipant =
      trade.creatorId === userId || trade.counterpartyId === userId;
    // 如果之後有 admin role，可以在這裡放行
    if (!isParticipant) throw createHttpError(403, 'No access to this trade');

    const events = await this.auditRepo.find({
      where: { tradeUid: uid },
      relations: ['actor'],
      order: { at: 'ASC' },
    });

    const auditEvents: TradeAuditEventDto[] = events.map((e) => ({
      id: e.id,
      action: e.action,
      at: e.at.toISOString(),
      actorId: e.actorId,
      actorName: e.actor?.name ?? null,
      details: e.details,
    }));

    const dto: TradeDetailDto = {
      uid: trade.uid,
      itemName: trade.itemName,
      itemDescription: trade.itemDescription,
      amount: trade.amount,
      itemCondition: trade.itemCondition,
      status: trade.status,

      creatorId: trade.creatorId,
      creatorName: trade.creator?.name ?? null,
      counterpartyId: trade.counterpartyId,
      counterpartyName: trade.counterparty?.name ?? null,

      tradeChannel: trade.tradeChannel,
      paymentMethod: trade.paymentMethod,
      matchmakingChannel: trade.matchmakingChannel,
      identityRequirements: trade.identityRequirements,
      userRating: trade.userRating,

      meta: trade.meta,
      confirmedByUser1: trade.confirmedByUser1,
      confirmedByUser2: trade.confirmedByUser2,

      vcVerifiedAt: trade.vcVerifiedAt?.toISOString() ?? null,
      uidExpiresAt: trade.uidExpiresAt?.toISOString() ?? null,
      finalizedAt: trade.finalizedAt?.toISOString() ?? null,
      createdAt: trade.createdAt.toISOString(),
      updatedAt: trade.updatedAt.toISOString(),

      auditEvents,
    };

    return dto;
  }
}
