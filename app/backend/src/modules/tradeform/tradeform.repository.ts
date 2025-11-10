import { DataSource, Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '@database/data-source';
import { TradeFormEntity } from './entity/trade-form.entity';

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

  async update(id: number, partial: Partial<TradeFormEntity>): Promise<void> {
    await this.repo.update(id, partial as QueryDeepPartialEntity<TradeFormEntity>);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
