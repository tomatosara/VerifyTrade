import { api } from '@/api/client';
import { TradeFormCreate } from '@/types/tradeForm';

export async function createTradeForm(formData: TradeFormCreate) {
  const response = await api.post('/tradeforms', formData);
  return response;
}
