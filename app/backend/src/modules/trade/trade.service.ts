// src/modules/trade/trade.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TradeFormEntity } from '@modules/tradeform/entity/trade-form.entity';
import { TradeFormStatus } from '@modules/tradeform/enums/TradeFormEnums';
import { TradeAuditEventEntity } from '@modules/tradeform/entity/trade-audit-event.entity';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { TradeRatingEntity } from '@modules/trade/entity/trade-rating.entity';
import { TradeDetailDto } from '@modules/trade/dto/trade-detail.dto';
import { TradeSummaryDto } from './dto/trade-summary.dto';
import { TradeAuditEventDto } from './dto/trade-audit-event.dto';
import createHttpError from 'http-errors';

export class TradeService {
  private tradeRepo: Repository<TradeFormEntity>;
  private auditRepo: Repository<TradeAuditEventEntity>;
  private userRepo: Repository<UserEntity>;
  private ratingRepo: Repository<TradeRatingEntity>;

  constructor() {
    this.tradeRepo = AppDataSource.getRepository(TradeFormEntity);
    this.auditRepo = AppDataSource.getRepository(TradeAuditEventEntity);
    this.userRepo = AppDataSource.getRepository(UserEntity);
    this.ratingRepo = AppDataSource.getRepository(TradeRatingEntity);
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

    // 查出目前登入者針對這些交易的評價
    const tradeUids = rows.map((t) => t.uid);
    const ratingRepo = AppDataSource.getRepository(TradeRatingEntity);

    const ratings = await ratingRepo
      .createQueryBuilder('r')
      .where('r.tradeUid IN (:...tradeUids)', { tradeUids })
      .andWhere('r.fromIdNumber = :userId', { userId })
      .getMany();

    // 轉成快速查表
    const ratingMap = new Map<string, number>();
    ratings.forEach((r) => ratingMap.set(r.tradeUid, r.stars));

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
      stars: ratingMap.get(t.uid) ?? null, // ✅ 加入評價
    }));

    return { items, total };
  }

  async getTradeDetailForUser(userId: string, uid: string): Promise<TradeDetailDto> {
    const trade = await this.tradeRepo.findOne({
      where: { uid },
      relations: ['creator', 'counterparty'],
    });

    if (!trade) throw createHttpError(404, 'Trade not found');
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

  async rateTrade(params: {
    tradeUid: string;
    raterIdNumber: string;
    stars: number;
  }): Promise<number> {
    const { tradeUid, raterIdNumber, stars } = params;

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw createHttpError(400, 'stars must be between 1 and 5');
    }

    const trade = await this.tradeRepo.findOne({
      where: { uid: tradeUid },
    });

    if (!trade) {
      throw createHttpError(404, 'Trade not found');
    }

    // 確認是交易雙方之一（用 idNumber）
    const isCreator = trade.creatorId === raterIdNumber;
    const isCounterparty = trade.counterpartyId === raterIdNumber;

    if (!isCreator && !isCounterparty) {
      throw createHttpError(403, 'Not a participant of this trade');
    }

    // 可選：只允許已完成交易
    if (
      trade.status !== TradeFormStatus.CONFIRMED &&
      trade.status !== TradeFormStatus.DONE
    ) {
      // 依你實際 enum 調整
      throw createHttpError(400, 'Trade not completed, cannot rate');
    }

    // 被評價者 idNumber
    const rateeIdNumber = isCreator
      ? trade.counterpartyId
      : trade.creatorId;

    if (!rateeIdNumber) {
      throw createHttpError(400, 'No counterparty to rate');
    }

    // 在 transaction 裡處理 rating + user.score
    await AppDataSource.transaction(async (manager) => {
      const ratingRepo = manager.getRepository(TradeRatingEntity);
      const userRepo = manager.getRepository(UserEntity);

      const existing = await ratingRepo.findOne({
        where: {
          tradeUid,
          fromIdNumber: raterIdNumber,
          toIdNumber: rateeIdNumber,
        },
        lock: { mode: 'pessimistic_write' },
      });

      const ratee = await userRepo.findOne({
        where: { idNumber: rateeIdNumber },
        lock: { mode: 'pessimistic_write' },
      });

      if (!ratee) {
        throw createHttpError(500, 'Rate target user not found');
      }

      if (!existing) {
        // 新增
        const rating = ratingRepo.create({
          tradeUid,
          fromIdNumber: raterIdNumber,
          toIdNumber: rateeIdNumber,
          stars,
        });
        await ratingRepo.save(rating);

        ratee.ratingSum += stars;
        ratee.ratingCount += 1;
      } else {
        // 更新
        const diff = stars - existing.stars;
        existing.stars = stars;
        await ratingRepo.save(existing);

        ratee.ratingSum += diff;
      }

      // 重算分數（保留兩位）
      if (ratee.ratingCount <= 0) {
        ratee.score = 0 as any;
      } else {
        const avg = ratee.ratingSum / ratee.ratingCount;
        ratee.score = Number(avg.toFixed(2)) as any;
      }

      await userRepo.save(ratee);
    });

    return stars;
  }

}
