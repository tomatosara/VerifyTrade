// // src/modules/trade/dto/trade-audit-event.dto.ts
// import { TradeAuditAction } from '@modules/tradeform/entity/trade-audit-event.entity';

// export class TradeAuditEventDto {
//   id!: string;
//   action!: TradeAuditAction;
//   at!: string;
//   actorId!: string | null;
//   actorName!: string | null;
//   details!: Record<string, unknown> | null;
// }


// src/modules/trade/dto/trade-audit-event.dto.ts

export type TradeAuditActionDto =
  | 'create'
  | 'verifyVC'
  | 'confirm'
  | 'cancel'
  | 'finalize'
  | 'fail'
  | 'retry';

export class TradeAuditEventDto {
  id!: string;
  action!: TradeAuditActionDto;
  at!: string;
  actorId!: string | null;
  actorName!: string | null;
  details!: any;
}
