// src/components/trade/TradeDetailDrawer.tsx
import { useEffect, useState } from "react";
import { fetchTradeDetail } from "@/api/trades";
import { TradeDetail } from "@/types/trades";
import { TradeTimeline } from "@/components/trade/TradeTimeline";

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

  const accent = "var(--color-accent, #0bb292)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* 中央白色卡片 */}
      <div className="w-full max-w-3xl max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-800">
              交易內容
            </div>
            <div className="mt-1 text-[10px] text-gray-500">
              交易 UID：
              <span className="font-mono break-all">{uid}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 text-sm">
          {loading && (
            <div className="text-gray-500 text-sm">載入中...</div>
          )}

          {!loading && data && (
            <>
              {/* 基本資訊區：做成表單風 */}
              <SectionTitle accent={accent}>基本資訊</SectionTitle>
              <div className="space-y-2">
                <InfoRow label="商品名稱" value={data.itemName} />
                <InfoRow
                  label="商品描述"
                  value={data.itemDescription || "-"}
                  multiline
                />
                <InfoRow label="商品金額" value={data.amount} />
                <InfoRow label="狀態" value={data.status} />
                <InfoRow label="交易方式" value={data.tradeChannel} />
                <InfoRow label="付款方式" value={data.paymentMethod} />
              </div>

              {/* 雙方資訊 */}
              <SectionTitle accent={accent}>雙方資訊</SectionTitle>
              <div className="space-y-2">
                <InfoRow
                  label="發起人"
                  value={
                    data.creatorName || data.creatorId
                      ? `${data.creatorName || ""}${
                          data.creatorId ? `（${data.creatorId}）` : ""
                        }`
                      : "-"
                  }
                />
                <InfoRow
                  label="相對方"
                  value={
                    data.counterpartyName || data.counterpartyId
                      ? `${data.counterpartyName || ""}${
                          data.counterpartyId
                            ? `（${data.counterpartyId}）`
                            : ""
                        }`
                      : "-"
                  }
                />
              </div>

              {/* 身分 / 條件 */}
              <SectionTitle accent={accent}>身分 / 條件</SectionTitle>
              <div className="space-y-2">
                <InfoRow
                  label="身分要求"
                  value={
                    data.identityRequirements &&
                    data.identityRequirements.length
                      ? data.identityRequirements.join("、")
                      : "無"
                  }
                />
                {data.meta && (
                  <div className="flex flex-col gap-1">
                    <div className="text-gray-500 text-xs">
                      其他資訊
                    </div>
                    <pre className="p-2 bg-gray-50 border border-gray-100 rounded-md text-[10px] leading-snug max-h-32 overflow-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(data.meta, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* 時間紀錄 */}
              <SectionTitle accent={accent}>時間紀錄</SectionTitle>
              <div className="space-y-1.5">
                <InfoRow
                  label="建立時間"
                  value={formatTs(data.createdAt)}
                />
                <InfoRow
                  label="更新時間"
                  value={formatTs(data.updatedAt)}
                />
                <InfoRow
                  label="VC 驗證時間"
                  value={formatTs(data.vcVerifiedAt)}
                />
                <InfoRow
                  label="UID 過期時間"
                  value={formatTs(data.uidExpiresAt)}
                />
                <InfoRow
                  label="完成時間"
                  value={formatTs(data.finalizedAt)}
                />
              </div>

              {/* 操作紀錄 */}
              <SectionTitle accent={accent}>操作紀錄</SectionTitle>
              {data.auditEvents && data.auditEvents.length ? (
                <TradeTimeline events={data.auditEvents} />
              ) : (
                <div className="text-xs text-gray-500">
                  目前尚無操作紀錄。
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer：單純關閉按鈕 */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTs(v: string | null): string {
  return v ? new Date(v).toLocaleString("zh-TW") : "-";
}

/* 小元件 */

function SectionTitle({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className="text-xs font-semibold mt-2 mb-1 flex items-center gap-2"
      style={{ color: accent }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start text-xs text-gray-800">
      <div className="w-24 text-gray-500 flex-shrink-0">
        {label}：
      </div>
      <div
        className={`flex-1 ${
          multiline ? "whitespace-pre-wrap break-words" : ""
        }`}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}
