import type { TradeFormResponse, TradeFormViewResponse } from "@/types/tradeForm";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("zh-TW") : "-";

const isFullTradePayload = (
  trade: TradeFormViewResponse["trade"]
): trade is TradeFormResponse => "creatorId" in trade;

export function TradeSummaryCard({ result }: { result: TradeFormViewResponse }) {
  const trade = result.trade;
  const isFull = isFullTradePayload(trade);

  return (
    <div className="mt-6 text-left bg-white/90 rounded-2xl p-5 shadow-inner border border-white/30">
      <p className="text-xs font-semibold text-[var(--color-primary)] tracking-wider uppercase">
        檢視模式：{result.view === "participant" ? "完整內容" : "公開資訊"}
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
        <DetailItem label="交易序號" value={trade.uid} />
        <DetailItem label="狀態" value={trade.status} />
        <DetailItem label="建立時間" value={formatDate(trade.createdAt)} />
        <DetailItem label="更新時間" value={formatDate(trade.updatedAt)} />
      </div>

      {isFull && (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
            <DetailItem label="商品名稱" value={trade.itemName} />
            <DetailItem label="商品金額" value={trade.amount} />
            <DetailItem label="交易方式" value={trade.tradeChannel} />
            <DetailItem label="付款方式" value={trade.paymentMethod} />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
            {/* <DetailItem label="建立者" value={trade.creatorId || "-"} />
            <DetailItem label="相對方" value={trade.counterpartyId || "-"} /> */}
            <DetailItem label="身份要求" value={trade.identityRequirements.join("、")} />
            <DetailItem label="UID 過期時間" value={formatDate(trade.uidExpiresAt)} />
          </div>
        </>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="font-medium text-gray-900 break-words">{value ?? "-"}</span>
    </div>
  );
}
