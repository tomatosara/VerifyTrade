// DB row / domain model
export interface TradeRating {
  id: string;
  tradeUid: string;
  fromIdNumber: string;
  toIdNumber: string;
  stars: number;        // 1-5
  createdAt: Date;
  updatedAt: Date;
}
