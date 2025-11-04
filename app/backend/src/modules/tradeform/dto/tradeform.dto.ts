import { z } from 'zod';
import { auditActionValues } from '../entity/tradeform.entity';
import type { AuditEvent } from '../entity/tradeform.entity';

export type TradeFormStatusValue =
  | 'draft'
  | 'pending'
  | 'verified'
  | 'confirmed'
  | 'cancelled'
  | 'failed'
  | 'done';

export interface CreateTradeFormDto {
  title: string;
  description: string;
  amount?: string;
}

export const CreateTradeFormSchema = z
  .object({
    title: z.string().min(3).max(160),
    description: z.string().min(3).max(4000),
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,8})?$/, 'Amount must be a decimal value with up to 8 decimals')
      .optional()
  })
  .strict();

export interface ConfirmDto {
  role: 'user1' | 'user2';
}

export const ConfirmSchema = z
  .object({
    role: z.enum(['user1', 'user2'])
  })
  .strict();

export interface CancelDto {
  reason?: string;
}

export const CancelSchema = z
  .object({
    reason: z.string().max(500).optional()
  })
  .strict();

export interface AuditEventView {
  id: string;
  tradeUid: string;
  actorId: string;
  action: (typeof auditActionValues)[number];
  at: Date;
  details?: Record<string, unknown> | null;
}

export const AuditEventViewSchema: z.ZodType<AuditEventView> = z
  .object({
    id: z.string(),
    tradeUid: z.string(),
    actorId: z.string(),
    action: z.enum(['create', 'verifyVC', 'confirm', 'cancel', 'finalize', 'fail', 'retry']),
    at: z.date(),
    details: z.record(z.any()).nullable().optional()
  })
  .strict();

export interface TradeFormView {
  uid: string;
  title: string;
  description?: string;
  amount?: string | null;
  status: TradeFormStatusValue;
  creatorId: string;
  counterpartyId?: string | null;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  auditLog: AuditEventView[];
}

export const TradeFormViewSchema: z.ZodType<TradeFormView> = z
  .object({
    uid: z.string(),
    title: z.string(),
    description: z.string().optional(),
    amount: z.string().nullable().optional(),
    status: z.enum(['draft', 'pending', 'verified', 'confirmed', 'cancelled', 'failed', 'done']),
    creatorId: z.string(),
    counterpartyId: z.string().nullable().optional(),
    meta: z.record(z.any()),
    createdAt: z.date(),
    updatedAt: z.date(),
    auditLog: z.array(AuditEventViewSchema)
  })
  .strict();

export interface TradeFormMinimalView {
  uid: string;
  status: TradeFormStatusValue;
}

export const TradeFormMinimalViewSchema: z.ZodType<TradeFormMinimalView> = z
  .object({
    uid: z.string(),
    status: z.enum(['draft', 'pending', 'verified', 'confirmed', 'cancelled', 'failed', 'done'])
  })
  .strict();

export interface TradeFormListQueryParams {
  status?: TradeFormStatusValue;
  created_from?: string;
  created_to?: string;
  page?: number;
  page_size?: number;
}

export const TradeFormListQuerySchema = z.object({
  status: z
    .enum(['draft', 'pending', 'verified', 'confirmed', 'cancelled', 'failed', 'done'])
    .optional(),
  created_from: z
    .string()
    .transform((value) => (value ? new Date(value) : undefined))
    .optional(),
  created_to: z
    .string()
    .transform((value) => (value ? new Date(value) : undefined))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20)
});

export type TradeFormListQuery = z.infer<typeof TradeFormListQuerySchema>;

export interface AuditLogResponse {
  auditLog: AuditEvent[];
}

export interface Paged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type TradeFormListItemView = TradeFormView & { shareUrl: string };

export type TradeFormListResponse = Paged<TradeFormListItemView>;

export interface VerifyVcDto {
  credential?: Record<string, unknown>;
}

export const VerifyVcSchema = z
  .object({
    credential: z.record(z.unknown()).optional()
  })
  .strict();
