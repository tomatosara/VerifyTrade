import { DataSource, Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm/error/QueryFailedError';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { nanoid } from 'nanoid';
import { AppDataSource } from '@database/data-source';
import { UserEntity } from '@modules/auth/entity/user.entity';
import { featureFlags } from '@config/featureFlags';
import { TradeFormEntity, TradeFormVCUser2Meta } from './entity/trade-form.entity';
import { TradeFormStatus } from './enums/TradeFormEnums';
import { TradeAuditAction, TradeAuditEventEntity } from './entity/trade-audit-event.entity';
import { TradeFormRepository } from './tradeform.repository';
import { CreateTradeFormDto } from './dto/create-trade-form.dto';
import { UpdateTradeFormDto } from './dto/update-trade-form.dto';
import { TradeFormPublicResponse, TradeFormResponse, TradeFormViewResponse } from './dto/trade-form.response';
import { ConfirmTradeResponseDto } from './dto/trade-form.actions.dto';
import { getVcMeta } from './tradeform.meta';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError
} from '@utils/errors';
import { formatAmountForResponse, normalizeAmountString } from './utils/amount';

const UID_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const UID_LENGTH = 24;

const mapEntityToResponse = (entity: TradeFormEntity): TradeFormResponse => ({
  id: entity.id,
  uid: entity.uid,
  creatorId: entity.creatorId ?? '',
  counterpartyId: entity.counterpartyId,
  creatorVerifiedIdentities: entity.creatorVerifiedIdentities ?? [],
  itemName: entity.itemName,
  itemDescription: entity.itemDescription,
  itemCondition: entity.itemCondition,
  amount: formatAmountForResponse(entity.amount),
  tradeChannel: entity.tradeChannel,
  paymentMethod: entity.paymentMethod,
  matchmakingChannel: entity.matchmakingChannel,
  identityRequirements: entity.identityRequirements ?? [],
  userRating: entity.userRating,
  status: entity.status,
  meta: entity.meta ?? {},
  confirmedByUser1: entity.confirmedByUser1,
  confirmedByUser2: entity.confirmedByUser2,
  vcVerifiedAt: entity.vcVerifiedAt ?? null,
  uidExpiresAt: entity.uidExpiresAt ?? null,
  finalizedAt: entity.finalizedAt ?? null,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt
});

const mapEntityToPublicResponse = (entity: TradeFormEntity): TradeFormPublicResponse => ({
  uid: entity.uid,
  status: entity.status,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt
});

const isParticipant = (trade: TradeFormEntity, actorId?: string | null): boolean =>
  Boolean(actorId && (trade.creatorId === actorId || trade.counterpartyId === actorId));

const isVcMetaExpired = (meta?: TradeFormVCUser2Meta | null): boolean => {
  if (!meta?.expiresAt) {
    return false;
  }
  const expiresAt = new Date(meta.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }
  return expiresAt.getTime() <= Date.now();
};

const normalizeStringArray = (values?: string[]): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }
  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
};

const ensureNonEmptyArray = (values: string[], field: string): string[] => {
  if (values.length === 0) {
    throw new ValidationError(`${field} must contain at least one entry`, {
      field,
      constraints: {
        [field]: 'At least one value is required'
      }
    });
  }
  return values;
};

export class TradeFormService {
  private readonly repository: TradeFormRepository;

  private readonly dataSource: DataSource;

  private readonly auditRepository: Repository<TradeAuditEventEntity>;

  private readonly userRepository: Repository<UserEntity>;

  constructor(
    dataSource: DataSource = AppDataSource,
    repository: TradeFormRepository = new TradeFormRepository(dataSource)
  ) {
    this.dataSource = dataSource;
    this.repository = repository;
    this.auditRepository = dataSource.getRepository(TradeAuditEventEntity);
    this.userRepository = dataSource.getRepository(UserEntity);
  }

  async create(
    body: CreateTradeFormDto,
    creatorId: string,
    actorUuid?: string | null
  ): Promise<TradeFormResponse> {
    const dto = plainToInstance(CreateTradeFormDto, body);
    await validateOrReject(dto, { whitelist: true });

    if (dto.creatorId && dto.creatorId !== creatorId) {
      throw new ForbiddenError('Authenticated user does not match creatorId', {
        field: 'creatorId'
      });
    }

    const normalizedCreatorIdentities = normalizeStringArray(dto.creatorVerifiedIdentities);
    const normalizedIdentityRequirements = ensureNonEmptyArray(
      normalizeStringArray(dto.identityRequirements),
      'identityRequirements'
    );
    const amount = normalizeAmountString(dto.amount);
    const uid = await this.resolveUid(dto.uid);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + featureFlags.uidTtlMinutes * 60_000);

    const entity = this.repository.create({
      uid,
      creatorId,
      counterpartyId: null,
      creatorVerifiedIdentities: normalizedCreatorIdentities,
      itemName: dto.itemName,
      itemDescription: dto.itemDescription,
      itemCondition: dto.itemCondition,
      amount,
      tradeChannel: dto.tradeChannel,
      paymentMethod: dto.paymentMethod,
      matchmakingChannel: dto.matchmakingChannel,
      identityRequirements: normalizedIdentityRequirements,
      status: TradeFormStatus.PENDING,
      meta: {},
      confirmedByUser1: false,
      confirmedByUser2: false,
      vcVerifiedAt: null,
      uidExpiresAt: expiresAt,
      finalizedAt: null,
      finalizeAttempts: 0,
      finalizeFailedAt: null,
      finalizeError: null
    });

    let saved: TradeFormEntity;
    try {
      saved = await this.repository.save(entity);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictError('Trade UID already exists', { field: 'uid' });
      }
      throw error;
    }
    await this.logAuditEvent(saved.uid, actorUuid ?? null, TradeAuditAction.CREATE, {
      status: saved.status
    });
    return mapEntityToResponse(saved);
  }

  async findByUidForActor(uid: string, actorId?: string | null): Promise<TradeFormViewResponse> {
    const tradeForm = await this.repository.findByUid(uid);
    if (!tradeForm) {
      throw new NotFoundError('Trade form not found');
    }

    if (isParticipant(tradeForm, actorId)) {
      return {
        view: 'participant',
        trade: mapEntityToResponse(tradeForm)
      };
    }

    return {
      view: 'limited',
      trade: mapEntityToPublicResponse(tradeForm)
    };
  }

  async confirm(
    uid: string,
    actorId: string,
    actorUuid?: string | null
  ): Promise<ConfirmTradeResponseDto> {
    const trade = await this.repository.findByUid(uid);
    if (!trade) {
      throw new NotFoundError('Trade form not found');
    }

    if (trade.status === TradeFormStatus.CANCELLED) {
      throw new ConflictError('Trade was cancelled');
    }

    if (trade.status === TradeFormStatus.FAILED) {
      throw new ConflictError('Trade previously failed');
    }

    const actorRole = this.resolveActorRole(trade, actorId);
    if (!actorRole) {
      throw new ForbiddenError('Only trade participants may confirm');
    }

    if (actorRole === 'user2') {
      const vcMeta = getVcMeta(trade.meta);
      if (!vcMeta?.valid) {
        throw new ForbiddenError('VC verification required before confirmation', {
          code: 'VC_NOT_VERIFIED'
        });
      }
      if (isVcMetaExpired(vcMeta)) {
        throw new ForbiddenError('VC verification expired', {
          code: 'VC_EXPIRED'
        });
      }
      if (trade.counterpartyId && trade.counterpartyId !== actorId) {
        throw new ConflictError('Trade already confirmed by another counterparty');
      }
      trade.counterpartyId = actorId;
    }

    const alreadyConfirmed =
      actorRole === 'user1' ? trade.confirmedByUser1 : trade.confirmedByUser2;

    if (!alreadyConfirmed) {
      if (actorRole === 'user1') {
        trade.confirmedByUser1 = true;
      } else {
        trade.confirmedByUser2 = true;
      }
    }

    if (trade.confirmedByUser1 && trade.confirmedByUser2) {
      trade.status = TradeFormStatus.CONFIRMED;
    } else if (trade.status === TradeFormStatus.PENDING) {
      trade.status = TradeFormStatus.VERIFIED;
    }

    const saved = await this.repository.save(trade);

    await this.logAuditEvent(saved.uid, actorUuid ?? null, TradeAuditAction.CONFIRM, {
      role: actorRole,
      alreadyConfirmed
    });

    let finalState = saved;
    if (saved.confirmedByUser1 && saved.confirmedByUser2) {
      finalState = await this.finalizeTrade(saved);
    }

    return {
      trade: mapEntityToResponse(finalState)
    };
  }

  async update(uid: string, body: UpdateTradeFormDto): Promise<TradeFormResponse> {
    const dto = plainToInstance(UpdateTradeFormDto, body);
    await validateOrReject(dto, { whitelist: true });

    const existing = await this.repository.findByUid(uid);
    if (!existing) {
      throw new NotFoundError('Trade form not found');
    }

    const counterparty = await this.userRepository.findOne({
      where: { idNumber: dto.counterpartyId }
    });
    if (!counterparty) {
      throw new NotFoundError('Counterparty not found', {
        field: 'counterpartyId'
      });
    }

    existing.counterpartyId = dto.counterpartyId;
    existing.status = TradeFormStatus.CONFIRMED;

    const saved = await this.repository.save(existing);
    return mapEntityToResponse(saved);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Trade form not found');
    }

    await this.repository.delete(existing.id);
  }

  private async finalStateAfterFinalize(trade: TradeFormEntity): Promise<TradeFormEntity> {
    trade.finalizeAttempts += 1;
    trade.finalizedAt = new Date();
    trade.finalizeError = null;
    trade.finalizeFailedAt = null;
    trade.status = TradeFormStatus.DONE;

    const saved = await this.repository.save(trade);
    await this.logAuditEvent(saved.uid, null, TradeAuditAction.FINALIZE, {
      strategy: featureFlags.persistStrategy
    });
    return saved;
  }

  private async finalizeTrade(trade: TradeFormEntity): Promise<TradeFormEntity> {
    if (trade.status === TradeFormStatus.DONE) {
      return trade;
    }

    try {
      return await this.finalStateAfterFinalize(trade);
    } catch (error: unknown) {
      trade.status = TradeFormStatus.FAILED;
      trade.finalizeFailedAt = new Date();
      trade.finalizeError = error instanceof Error ? error.message : 'Unknown finalize error';
      const failed = await this.repository.save(trade);
      await this.logAuditEvent(trade.uid, null, TradeAuditAction.FAIL, {
        error: trade.finalizeError
      });
      return failed;
    }
  }

  private async logAuditEvent(
    tradeUid: string,
    actorId: string | null,
    action: TradeAuditAction,
    details?: Record<string, unknown> | null
  ): Promise<void> {
    const event = this.auditRepository.create({
      tradeUid,
      actorId,
      action,
      details: details ?? null
    });
    await this.auditRepository.save(event);
  }

  private resolveActorRole(
    trade: TradeFormEntity,
    actorId: string
  ): 'user1' | 'user2' | null {
    if (trade.creatorId === actorId) {
      return 'user1';
    }
    if (trade.counterpartyId === actorId) {
      return 'user2';
    }
    if (!trade.counterpartyId && trade.creatorId !== actorId) {
      return 'user2';
    }
    return null;
  }

  private async resolveUid(preferred?: string | null): Promise<string> {
    const candidate = preferred?.trim();
    if (!candidate) {
      return this.generateUniqueUid();
    }

    const existing = await this.repository.findByUid(candidate);
    if (existing) {
      throw new ConflictError('Trade UID already exists', { field: 'uid' });
    }

    return candidate;
  }

  private async generateUniqueUid(): Promise<string> {
    for (let attempts = 0; attempts < 5; attempts += 1) {
      const candidate = nanoid(UID_LENGTH)
        .split('')
        .map((char) => (UID_ALPHABET.includes(char) ? char : UID_ALPHABET[Math.floor(Math.random() * UID_ALPHABET.length)]))
        .join('');

      const existing = await this.repository.findByUid(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new ConflictError('Unable to allocate unique trade uid');
  }

  private isUniqueViolation(error: unknown): boolean {
    return error instanceof QueryFailedError && (error as QueryFailedError & { code?: string }).code === '23505';
  }
}
