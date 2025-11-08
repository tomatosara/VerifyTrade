import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { fetchTradeDetail, rateTrade } from "@/api/trades";
import { TradeDetail } from "@/types/trades";
import { TradeTimeline } from "@/components/trade/TradeTimeline";
import { RatingStars } from "@/components/trade/RatingStars";

interface Props {
  uid: string | null;
  open: boolean;
  onClose: () => void;
  onRate?: (uid: string, stars: number) => void;
  currentRating?: number | null;
}

export function TradeDetailDrawer({
  uid,
  open,
  onClose,
  onRate,
  currentRating,
}: Props) {
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

  const primary = "var(--color-primary, #F15B6C)";
  const accent = "var(--color-accent, #FF8E8E)";
  const textColor = "var(--color-text, #2B2B2B)";

  const handleRateSelect = (stars: number) => {
    if (!onRate || !uid) return;
    onRate(uid, stars);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          {/* 左側：標題 + UID */}
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 tracking-wide">
              交易內容
            </h2>
            <div className="mt-0.5 text-[12px] text-gray-500">
              UID：
              <span className="font-mono break-all">{uid}</span>
            </div>
          </div>

          {/* 右側：評價 + 關閉 */}
          <div className="flex items-center gap-4">
            {/* 評價區塊 */}
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                評價
              </span>

              {typeof currentRating === "number" ? (
                <div className="flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: currentRating }).map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-700 ml-1">
                    {currentRating} 星
                  </span>
                </div>
              ) : onRate ? (
                <div className="flex items-center gap-1">
                  <RatingStars
                    onSelect={async (stars) => {
                      if (!uid) return;
                      try {
                        await rateTrade(uid, stars);
                        onRate?.(uid, stars); // 更新上層狀態
                      } catch (err) {
                        console.error("評價失敗", err);
                        alert("評價提交失敗，請稍後再試。");
                      }
                    }}
                  />

                </div>
              ) : (
                <span className="text-sm text-gray-400">尚未評價</span>
              )}
            </div>
          </div>
        </div>


        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 text-sm">
          {loading && (
            <div className="text-gray-500 text-sm">載入中...</div>
          )}

          {!loading && data && (
            <>
              {/* 基本資訊 */}
              <SectionTitle accent={primary}>基本資訊</SectionTitle>
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
              <SectionTitle accent={primary}>雙方資訊</SectionTitle>
              <div className="space-y-2">
                <InfoRow
                  label="發起人"
                  value={
                    data.creatorName || data.creatorId
                      ? `${data.creatorName || ""}${data.creatorId ? `（${data.creatorId}）` : ""
                      }`
                      : "-"
                  }
                />
                <InfoRow
                  label="相對方"
                  value={
                    data.counterpartyName || data.counterpartyId
                      ? `${data.counterpartyName || ""}${data.counterpartyId
                        ? `（${data.counterpartyId}）`
                        : ""
                      }`
                      : "-"
                  }
                />
              </div>

              {/* 身分 / 條件 */}
              <SectionTitle accent={primary}>身分 / 條件</SectionTitle>
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
              <SectionTitle accent={primary}>時間紀錄</SectionTitle>
              <div className="space-y-1.5">
                <InfoRow label="建立時間" value={formatTs(data.createdAt)} />
                <InfoRow label="更新時間" value={formatTs(data.updatedAt)} />
                <InfoRow
                  label="VC 驗證時間"
                  value={formatTs(data.vcVerifiedAt)}
                />
                <InfoRow
                  label="UID 過期時間"
                  value={formatTs(data.uidExpiresAt)}
                />
                <InfoRow label="完成時間" value={formatTs(data.finalizedAt)} />
              </div>

              {/* 操作紀錄 */}
              <SectionTitle accent={primary}>操作紀錄</SectionTitle>
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

        {/* FOOTER */}
        <div className="px-6 py-3 border-top border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}

/* Utils */

function formatTs(v: string | null): string {
  return v ? new Date(v).toLocaleString("zh-TW") : "-";
}

function SectionTitle({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className="mt-2 mb-1 flex items-center gap-2 text-sm font-semibold"
      style={{ color: accent }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: accent }}
      />
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
    <div className="flex items-start text-sm">
      <div className="w-28 text-gray-500 flex-shrink-0">
        {label}：
      </div>
      <div
        className={`flex-1 text-[13px] text-gray-800 ${multiline ? "whitespace-pre-wrap break-words" : ""
          }`}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}
