// src/components/trade/TradeDetailDrawer.tsx
import { useEffect, useState } from 'react';
import { fetchTradeDetail } from '@/api/trades';
import { TradeDetail } from '@/types/trades';
import { TradeTimeline } from '@/components/trade/TradeTimeline';

interface Props {
  uid: string | null;
  open: boolean;
  onClose: () => void;
}

export function TradeDetailDrawer({ uid, open, onClose }: Props) {
  const [data, setData] = useState<TradeDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !uid) {
      setData(null);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await fetchTradeDetail(uid);
        setData(res);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, uid]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-end z-50">
      <div className="w-full max-w-xl h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <div className="text-xs text-gray-500">交易 UID</div>
            <div className="font-mono text-xs">{uid}</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <div className="text-sm text-gray-500">載入中...</div>}
          {!loading && data && (
            <>
              <section>
                <h2 className="text-sm font-semibold mb-1">基本資訊</h2>
                <div className="text-sm space-y-1">
                  <div>商品：{data.itemName}</div>
                  <div>描述：{data.itemDescription}</div>
                  <div>金額：{data.amount}</div>
                  <div>狀態：{data.status}</div>
                  <div>交易方式：{data.tradeChannel}</div>
                  <div>付款方式：{data.paymentMethod}</div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold mb-1">雙方資訊</h2>
                <div className="text-sm space-y-1">
                  <div>
                    發起人：{data.creatorName || '-'} ({data.creatorId || '-'})
                  </div>
                  <div>
                    相對方：{data.counterpartyName || '-'} ({data.counterpartyId || '-'})
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold mb-1">身分 / 條件</h2>
                <div className="text-xs text-gray-700 space-y-1">
                  <div>
                    身分要求：
                    {data.identityRequirements.length
                      ? data.identityRequirements.join(', ')
                      : '無'}
                  </div>
                  {data.meta && (
                    <pre className="mt-1 p-2 bg-gray-50 border text-[10px] rounded overflow-x-auto">
                      {JSON.stringify(data.meta, null, 2)}
                    </pre>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold mb-1">時間紀錄</h2>
                <div className="text-xs text-gray-700 space-y-1">
                  <div>建立：{formatTs(data.createdAt)}</div>
                  <div>更新：{formatTs(data.updatedAt)}</div>
                  <div>VC 驗證：{formatTs(data.vcVerifiedAt)}</div>
                  <div>UID 過期：{formatTs(data.uidExpiresAt)}</div>
                  <div>完成：{formatTs(data.finalizedAt)}</div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold mb-1">操作紀錄</h2>
                <TradeTimeline events={data.auditEvents} />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTs(v: string | null): string {
  return v ? new Date(v).toLocaleString() : '-';
}
