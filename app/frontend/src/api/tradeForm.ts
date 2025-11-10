import { api } from '@/api/client';
import { TradeFormCreate, TradeFormViewResponse, TradeFormComfirm } from '@/types/tradeForm';

export async function createTradeForm(formData: TradeFormCreate) {
  const response = await api.post('/tradeforms', formData);
  return response;
}

export async function fetchTradeFormByUid(uid: string) {
  return api.get<TradeFormViewResponse>(`/tradeforms/uid/${uid}`);
}

export async function confirmTradeForm(uid: string, formdata: TradeFormComfirm) {
  return api.put(`/tradeforms/${uid}`, formdata);
}
