import type { EntityManager, FindManyOptions } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@database/data-source';
import { TradeAuditEventEntity } from '../entity/trade-audit-event.entity';
import { TradeConfirmationEntity, TradeConfirmationRole } from '../entity/trade-confirmation.entity';
import { TradeFormEntity, type AuditEvent } from '../entity/tradeform.entity';

export class TradeFormRepository {
  private readonly manager: EntityManager;

  constructor(manager?: EntityManager) {
    this.manager = manager ?? AppDataSource.manager;
  }

  private get tradeRepo() {
    return this.manager.getRepository(TradeFormEntity);
  }

  private get auditRepo() {
    return this.manager.getRepository(TradeAuditEventEntity);
  }

  createQueryBuilder(alias = 'trade') {
    return this.tradeRepo.createQueryBuilder(alias);
  }

  private get confirmationRepo() {
    return this.manager.getRepository(TradeConfirmationEntity);
  }

  findByUid(uid: string) {
    return this.tradeRepo.findOne({ where: { uid } });
  }

  findByUidForUpdate(uid: string) {
    return this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.uid = :uid', { uid })
      .setLock('pessimistic_write')
      .getOne();
  }

  save(trade: TradeFormEntity) {
    return this.tradeRepo.save(trade);
  }

  async appendAuditEvent(trade: TradeFormEntity, event: AuditEvent): Promise<void> {
    const nextLog = [...(trade.auditLog ?? []), event];
    trade.auditLog = nextLog;
    const updatePayload = {
      auditLog: nextLog as TradeFormEntity['auditLog']
    } as QueryDeepPartialEntity<TradeFormEntity>;
    await this.tradeRepo.update({ uid: trade.uid }, updatePayload);
    const auditRecord = this.auditRepo.create({
      tradeUid: event.tradeUid,
      actorId: event.actorId,
      action: event.action,
      details: event.details ?? null,
      at: new Date(event.at)
    });
    await this.auditRepo.save(auditRecord);
  }

  list(options: FindManyOptions<TradeFormEntity>) {
    return this.tradeRepo.find(options);
  }

  async recordConfirmation({
    tradeUid,
    actorId,
    role
  }: {
    tradeUid: string;
    actorId: string;
    role: TradeConfirmationRole;
  }) {
    const insertResult = await this.confirmationRepo
      .createQueryBuilder()
      .insert()
      .values({
        tradeUid,
        actorId,
        role
      })
      .orIgnore()
      .execute();

    return insertResult.identifiers.length > 0;
  }
}
