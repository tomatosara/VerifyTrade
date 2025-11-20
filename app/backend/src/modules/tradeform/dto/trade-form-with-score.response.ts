// trade-form-with-score.response.ts

import { TradeFormResponse } from './trade-form.response';

export interface TradeFormWithScoreResponse extends TradeFormResponse {
  /** 建立者在 users 表中的分數 */
  creatorScore: number | null;
}

// 如果你有包一層 view：
export interface TradeFormViewResponse {
  view: 'participant' | 'limited';
  trade: TradeFormWithScoreResponse;
}
