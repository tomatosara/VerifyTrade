// src/components/trade/TradeTimeline.tsx
import { TradeAuditEvent } from '@/types/trades';

interface Props {
  events: TradeAuditEvent[];
}

const actionLabel: Record<string, string> = {
  create: '建立交易',
  verifyVC: '驗證憑證',
  confirm: '確認交易',
  cancel: '取消交易',
  finalize: '完成交易',
  fail: '交易失敗',
  retry: '重試',
};

export function TradeTimeline({ events }: Props) {
  if (!events.length) {
    return <div className="text-xs text-gray-500">尚無操作紀錄。</div>;
  }

  return (
    <ol className="border-l border-gray-200 pl-3 space-y-2 text-xs">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <div className="w-2 h-2 bg-gray-600 rounded-full absolute -left-[9px] top-1" />
          <div className="text-gray-800">
            {actionLabel[e.action] || e.action}
          </div>
          <div className="text-[10px] text-gray-500">
            {new Date(e.at).toLocaleString()}{' '}
            {e.actorName ? `・ ${e.actorName}` : ''}
          </div>
          {e.details && Object.keys(e.details).length > 0 && (
            <pre className="mt-1 p-1 bg-gray-50 border text-[9px] rounded overflow-x-auto">
              {JSON.stringify(e.details, null, 2)}
            </pre>
          )}
        </li>
      ))}
    </ol>
  );
}
