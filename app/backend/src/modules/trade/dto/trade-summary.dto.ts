// // src/modules/trade/dto/trade-summary.dto.ts
// import {
//   TradeFormStatus,
//   TradeFormChannel,
//   TradeFormPaymentMethod,
// } from '../../tradeform/enums/TradeFormEnums';

// export class TradeSummaryDto {
//   uid!: string;
//   itemName!: string;
//   amount!: string;
//   status!: TradeFormStatus;
//   tradeChannel!: TradeFormChannel;
//   paymentMethod!: TradeFormPaymentMethod;
//   createdAt!: string;
//   finalizedAt!: string | null;
//   creatorName!: string | null;
//   counterpartyName!: string | null;
// }


// src/modules/trade/dto/trade-summary.dto.ts

import {
  TradeFormStatusDto,
  TradeFormChannelDto,
  TradeFormPaymentMethodDto,
} from './trade-detail.dto';

export class TradeSummaryDto {
  uid!: string;
  itemName!: string;
  amount!: string;
  status!: TradeFormStatusDto;
  tradeChannel!: TradeFormChannelDto;
  paymentMethod!: TradeFormPaymentMethodDto;
  createdAt!: string;
  finalizedAt!: string | null;
  creatorName!: string | null;
  counterpartyName!: string | null;
}
