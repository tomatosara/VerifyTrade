import type { TradeFormResponse, TradeFormViewResponse } from "@/types/tradeForm";
import { formatStatus, formatDate, formatAmount } from "@/components/trade/tool";
import type { TradeDetail } from "@/types/trades";

type TradeSummarySource = TradeDetail | TradeFormViewResponse;

const isTradeFormViewResponse = (
  result: TradeSummarySource
): result is TradeFormViewResponse => "trade" in result;

const isFullTradePayload = (
  trade: TradeFormViewResponse["trade"] | TradeDetail
): trade is TradeFormResponse | TradeDetail => "creatorId" in trade;

export function TradeSummaryCard({ result }: { result: TradeSummarySource }) {
  const trade = isTradeFormViewResponse(result) ? result.trade : result;
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
            <DetailItem label="商品金額" value={formatAmount(trade.amount)} />
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
