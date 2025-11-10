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
    <div className="mt-6 text-left bg-white/90 rounded-2xl p-5 shadow-inner border border-gray-100">


      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-basic text-gray-800">
        <DetailItem label="交易序號" value={trade.uid} />
        <DetailItem label="狀態" value={formatStatus(trade.status)} />
        <DetailItem label="建立時間" value={formatDate(trade.createdAt)} />
        <DetailItem label="更新時間" value={formatDate(trade.updatedAt)} />
      </div>

      {isFull && (
        <>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-basic text-gray-800">
            <DetailItem label="身份驗證條件" value={trade.identityRequirements.join("、")} />
            <DetailItem label="商品名稱" value={trade.itemName} />
            <DetailItem label="商品金額" value={trade.amount} />
            <DetailItem label="交易方式" value={tradeMethod(trade.tradeChannel)} />
            <DetailItem label="付款方式" value={payment(trade.paymentMethod)} />
            <DetailItem label="交易媒合管道" value={matchMaking(trade.matchmakingChannel)} />
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

function formatStatus(status: string | null): string {
  switch (status) {
    case "done":
      return "交易完成";
    case "pending":
      return "等待確認方驗證";
    case "verified":
      return "已驗證";
    case "confirmed":
      return "交易成立";
    case "failed":
      return "交易失敗";
    case "cancelled":
      return "已取消";
    default:
      return status || "-";
  }
}

function payment(paymentMethod: string | null): string {
  switch (paymentMethod) {
    case "bank_transfer":
      return "銀行";
    case "cash":
      return "現金";
    default:
      return paymentMethod || "-";
  }
}

function tradeMethod(tradeChannel: string | null): string {
  switch (tradeChannel) {
    case "p2p":
      return "面交";
    case "escrow":
      return "交貨便";
    default:
      return tradeChannel || "-";
  }
}

function matchMaking(matchmakingChannel: string | null): string {
  switch (matchmakingChannel) {
    case "in_app":
      return "線下合議";
    case "line":
      return "社交平台";
    default:
      return matchmakingChannel || "-";
  }
}
