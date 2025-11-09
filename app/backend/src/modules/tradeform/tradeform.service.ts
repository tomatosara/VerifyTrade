import { DataSource, Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm/error/QueryFailedError';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { nanoid } from 'nanoid';
import { AppDataSource } from '@database/data-source';
import { featureFlags } from '@config/featureFlags';
import { TradeFormEntity, TradeFormVCUser2Meta } from './entity/trade-form.entity';
import { TradeFormStatus } from './enums/TradeFormEnums';
import { TradeAuditAction, TradeAuditEventEntity } from './entity/trade-audit-event.entity';
import { TradeFormFilters, TradeFormRepository } from './tradeform.repository';
import { CreateTradeFormDto } from './dto/create-trade-form.dto';
import { UpdateTradeFormDto } from './dto/update-trade-form.dto';
import {
  TradeFormListQuery,
  TradeFormListResponse,
  TradeFormPublicResponse,
  TradeFormResponse,
  TradeFormViewResponse
} from './dto/trade-form.response';
import { ConfirmTradeResponseDto, VerifyVcResponseDto } from './dto/trade-form.actions.dto';
import { checkUser2MeetsTradeRequirements } from './tradeform.vc-requirements';
import { getVcMeta, upsertVcMeta } from './tradeform.meta';
import {
  ConflictError,
  ForbiddenError,
  GoneError,
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

const isTerminalStatus = (status: TradeFormStatus): boolean =>
  [TradeFormStatus.CANCELLED, TradeFormStatus.FAILED, TradeFormStatus.DONE].includes(status);

const isParticipant = (trade: TradeFormEntity, actorId?: string | null): boolean =>
  Boolean(actorId && (trade.creatorId === actorId || trade.counterpartyId === actorId));

const hasExpired = (trade: TradeFormEntity): boolean =>
  Boolean(trade.uidExpiresAt && trade.uidExpiresAt.getTime() < Date.now());

const normalizeIso = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

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

const areStringArraysEqual = (a?: string[], b?: string[]): boolean => {
  const left = Array.isArray(a) ? [...a].sort() : [];
  const right = Array.isArray(b) ? [...b].sort() : [];
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
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

  constructor(
    dataSource: DataSource = AppDataSource,
    repository: TradeFormRepository = new TradeFormRepository(dataSource)
  ) {
    this.dataSource = dataSource;
    this.repository = repository;
    this.auditRepository = dataSource.getRepository(TradeAuditEventEntity);
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

  async findAll(query: TradeFormListQuery = {}): Promise<TradeFormListResponse> {
    const filters: TradeFormFilters = {
      itemCondition: query.itemCondition,
      tradeChannel: query.tradeChannel,
      paymentMethod: query.paymentMethod,
      matchmakingChannel: query.matchmakingChannel,
      identityRequirement: query.identityRequirement
    };

    const [rows, total] = await this.repository.findWithFilters(filters);
    return {
      data: rows.map(mapEntityToResponse),
      total
    };
  }

  async findOne(id: number): Promise<TradeFormResponse> {
    const tradeForm = await this.repository.findById(id);
    if (!tradeForm) {
      throw new NotFoundError('Trade form not found');
    }
    return mapEntityToResponse(tradeForm);
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

  async verifyVc(
    uid: string,
    actorId: string,
    vcProof: unknown,
    actorUuid?: string | null
  ): Promise<VerifyVcResponseDto> {
    const trade = await this.repository.findByUid(uid);
    if (!trade) {
      throw new NotFoundError('Trade form not found');
    }
    if (isTerminalStatus(trade.status)) {
      throw new ConflictError(`Trade already ${trade.status}`);
    }
    if (trade.creatorId === actorId) {
      throw new ForbiddenError('Creator does not need VC verification', {
        code: 'VC_NOT_REQUIRED_FOR_CREATOR'
      });
    }
    if (hasExpired(trade)) {
      throw new GoneError('Trade uid has expired');
    }
    if (trade.counterpartyId && trade.counterpartyId !== actorId) {
      throw new ForbiddenError('Trade already associated with another counterparty', {
        code: 'VC_COUNTERPARTY_CONFLICT'
      });
    }

    const check = await checkUser2MeetsTradeRequirements({
      trade,
      userId: actorId,
      vcProof
    });

    if (!check.ok) {
      throw new ForbiddenError(check.reason ?? 'VC requirements not satisfied', {
        code: 'VC_REQUIREMENT_NOT_MET',
        reason: check.reason
      });
    }

    const { rawRef, ...publicMatched } = check.matched;

    const previousMeta = getVcMeta(trade.meta);
    const alreadyBound = trade.counterpartyId === actorId;

    const metaEquivalent =
      previousMeta?.valid === true &&
      areStringArraysEqual(previousMeta.claimsMatched, publicMatched.claims) &&
      previousMeta.issuer === publicMatched.issuer &&
      previousMeta.credentialType === publicMatched.credentialType &&
      previousMeta.level === publicMatched.level &&
      normalizeIso(previousMeta.expiresAt) === normalizeIso(publicMatched.expiresAt) &&
      !isVcMetaExpired(previousMeta);

    if (
      metaEquivalent &&
      alreadyBound &&
      trade.status !== TradeFormStatus.PENDING &&
      trade.vcVerifiedAt
    ) {
      return {
        valid: true,
        status: trade.status,
        matched: publicMatched,
        trade: mapEntityToResponse(trade)
      };
    }

    trade.meta = upsertVcMeta(trade.meta, {
      valid: true,
      claimsMatched: publicMatched.claims,
      issuer: publicMatched.issuer,
      credentialType: publicMatched.credentialType,
      level: publicMatched.level,
      expiresAt: publicMatched.expiresAt,
      rawRef
    });

    trade.vcVerifiedAt = new Date();
    if (!trade.counterpartyId) {
      trade.counterpartyId = actorId;
    }
    if (trade.status === TradeFormStatus.PENDING) {
      trade.status = TradeFormStatus.VERIFIED;
    }

    const saved = await this.repository.save(trade);

    await this.logAuditEvent(saved.uid, actorUuid ?? null, TradeAuditAction.VERIFY_VC, {
      valid: true,
      issuer: publicMatched.issuer ?? null,
      credentialType: publicMatched.credentialType ?? null,
      level: publicMatched.level ?? null,
      expiresAt: publicMatched.expiresAt ?? null
    });

    return {
      valid: true,
      status: saved.status,
      matched: publicMatched,
      trade: mapEntityToResponse(saved)
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

  async update(id: number, body: UpdateTradeFormDto): Promise<TradeFormResponse> {
    const dto = plainToInstance(UpdateTradeFormDto, body);
    await validateOrReject(dto, { whitelist: true });

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Trade form not found');
    }

    const creatorVerifiedIdentities =
      dto.creatorVerifiedIdentities !== undefined
        ? normalizeStringArray(dto.creatorVerifiedIdentities)
        : existing.creatorVerifiedIdentities ?? [];

    const identityRequirements =
      dto.identityRequirements !== undefined
        ? ensureNonEmptyArray(
            normalizeStringArray(dto.identityRequirements),
            'identityRequirements'
          )
        : existing.identityRequirements ?? [];

    const amount =
      dto.amount !== undefined ? normalizeAmountString(dto.amount) : existing.amount;

    Object.assign(existing, {
      creatorVerifiedIdentities,
      itemName: dto.itemName ?? existing.itemName,
      itemDescription: dto.itemDescription ?? existing.itemDescription,
      itemCondition: dto.itemCondition ?? existing.itemCondition,
      amount,
      tradeChannel: dto.tradeChannel ?? existing.tradeChannel,
      paymentMethod: dto.paymentMethod ?? existing.paymentMethod,
      matchmakingChannel: dto.matchmakingChannel ?? existing.matchmakingChannel,
      identityRequirements,
      userRating: dto.userRating ?? existing.userRating
    });

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
