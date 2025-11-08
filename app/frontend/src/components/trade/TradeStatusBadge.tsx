// src/components/trade/TradeStatusBadge.tsx
import { TradeStatus } from '@/types/trades';

export function TradeStatusBadge({ status }: { status: TradeStatus }) {
  const label: Record<TradeStatus, string> = {
    draft: '草稿',
    pending: '待處理',
    verified: '已驗證',
    confirmed: '已確認',
    cancelled: '已取消',
    failed: '失敗',
    done: '已完成',
  };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border">
      {label[status]}
    </span>
  );
}
