// src/components/trade/TradeTable.tsx
import { TradeSummary } from '@/types/trades';
import { TradeStatusBadge } from '@/components/trade/TradeStatusBadge';

interface Props {
  trades: TradeSummary[];
  onRowClick: (uid: string) => void;
}

export function TradeTable({ trades, onRowClick }: Props) {
  if (!trades.length) {
    return <div className="text-sm text-gray-500">目前沒有交易紀錄。</div>;
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="py-2 px-3 text-left">交易UID</th>
          <th className="py-2 px-3 text-left">商品</th>
          <th className="py-2 px-3 text-left">金額</th>
          <th className="py-2 px-3 text-left">狀態</th>
          <th className="py-2 px-3 text-left">建立時間</th>
          <th className="py-2 px-3 text-left">雙方</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => (
          <tr
            key={t.uid}
            className="border-b hover:bg-gray-50 cursor-pointer"
            onClick={() => onRowClick(t.uid)}
          >
            <td className="py-2 px-3 font-mono text-xs">{t.uid}</td>
            <td className="py-2 px-3">{t.itemName}</td>
            <td className="py-2 px-3">{t.amount}</td>
            <td className="py-2 px-3">
              <TradeStatusBadge status={t.status} />
            </td>
            <td className="py-2 px-3">
              {new Date(t.createdAt).toLocaleString()}
            </td>
            <td className="py-2 px-3">
              {t.creatorName || '-'} / {t.counterpartyName || '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
