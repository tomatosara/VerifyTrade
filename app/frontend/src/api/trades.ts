// src/api/trades.ts
import { api } from '@/api/client';
import { TradeSummary, TradeDetail } from '@/types/trades';

export interface GetTradesParams {
  status?: string;
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}

export async function fetchTrades(
  params: GetTradesParams = {}
): Promise<{ items: TradeSummary[]; total: number }> {
  return api.get<{ items: TradeSummary[]; total: number }>('/trades', { params });
}

export async function fetchTradeDetail(uid: string): Promise<TradeDetail> {
  const data = await api.get<TradeDetail>(`/trades/${uid}`);
  return data;
}

export async function rateTrade(uid: string, stars: number) {
  const res = await api.post(`/trades/${uid}/rating`, { stars });
  return res; // { tradeUid, stars }
}