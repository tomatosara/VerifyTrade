export interface RateTradeRequest {
  stars: number; // 1~5，實際檢查在 service
}

export interface TradeRatingResponse {
  tradeUid: string;
  stars: number;
}