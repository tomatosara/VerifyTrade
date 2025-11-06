import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@database/data-source';
import {
  TradeFormChannel,
  TradeFormEntity,
  TradeFormIdentityRequirement,
  TradeFormItemCondition,
  TradeFormMatchmakingChannel,
  TradeFormPaymentMethod
} from './entity/trade-form.entity';

export interface TradeFormFilters {
  itemCondition?: TradeFormItemCondition;
  tradeChannel?: TradeFormChannel;
  paymentMethod?: TradeFormPaymentMethod;
  matchmakingChannel?: TradeFormMatchmakingChannel;
  identityRequirement?: TradeFormIdentityRequirement;
}

export class TradeFormRepository {
  private readonly repo: Repository<TradeFormEntity>;

  constructor(dataSource: DataSource = AppDataSource) {
    this.repo = dataSource.getRepository(TradeFormEntity);
  }

  create(payload: Partial<TradeFormEntity>): TradeFormEntity {
    return this.repo.create(payload);
  }

  async save(entity: TradeFormEntity): Promise<TradeFormEntity> {
    return this.repo.save(entity);
  }

  async findById(id: number): Promise<TradeFormEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUid(uid: string): Promise<TradeFormEntity | null> {
    return this.repo.findOne({ where: { uid } });
  }

  async findAll(where: FindOptionsWhere<TradeFormEntity> = {}): Promise<TradeFormEntity[]> {
    return this.repo.find({
      where,
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async findWithFilters(filters: TradeFormFilters = {}): Promise<[TradeFormEntity[], number]> {
    const qb = this.repo.createQueryBuilder('tradeForm').orderBy('tradeForm.createdAt', 'DESC');

    if (filters.itemCondition) {
      qb.andWhere('tradeForm.itemCondition = :itemCondition', {
        itemCondition: filters.itemCondition
      });
    }

    if (filters.tradeChannel) {
      qb.andWhere('tradeForm.tradeChannel = :tradeChannel', {
        tradeChannel: filters.tradeChannel
      });
    }

    if (filters.paymentMethod) {
      qb.andWhere('tradeForm.paymentMethod = :paymentMethod', {
        paymentMethod: filters.paymentMethod
      });
    }

    if (filters.matchmakingChannel) {
      qb.andWhere('tradeForm.matchmakingChannel = :matchmakingChannel', {
        matchmakingChannel: filters.matchmakingChannel
      });
    }

    if (filters.identityRequirement) {
      qb.andWhere(':identityRequirement = ANY(tradeForm.identityRequirements)', {
        identityRequirement: filters.identityRequirement
      });
    }

    return qb.getManyAndCount();
  }

  async update(id: number, partial: Partial<TradeFormEntity>): Promise<void> {
    await this.repo.update(id, partial as QueryDeepPartialEntity<TradeFormEntity>);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
