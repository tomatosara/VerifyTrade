// src/compoents/trade/MyAccountTradeLinst.tsx
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { fetchTrades } from "@/api/trades";
import { TradeSummary } from "@/types/trades";
import { RatingStars } from "@/components/trade/RatingStars";
import { TradeDetailDrawer } from "@/components/trade/TradeDetailDrawer";

const ITEMS_PER_PAGE = 5;

export function MyAccountTradeList() {
  const [trades, setTrades] = useState<TradeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // uid -> rating
  const [ratings, setRatings] = useState<Record<string, number>>({});
  // 哪一筆在顯示星星評價
  const [activeRatingUid, setActiveRatingUid] = useState<string | null>(null);
  // Drawer
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTrades({
        page,
        pageSize: ITEMS_PER_PAGE,
      });
      setTrades(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      setError("載入交易紀錄時發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleRate = (uid: string, stars: number) => {
    setRatings(prev => ({ ...prev, [uid]: stars }));
    setActiveRatingUid(null);
    // TODO: 之後要打 API，可以在這裡呼叫
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  if (loading && !trades.length) {
    return <div className="text-gray-500 text-sm">載入中...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  if (!trades.length) {
    return <div className="text-gray-500 text-sm">目前尚無交易紀錄。</div>;
  }

  const statusText = (status: string | null | undefined) => {
    switch (status) {
      case "done":
        return "交易完成";
      case "pending":
        return "審核中";
      case "verified":
        return "已驗證";
      case "confirmed":
        return "已確認";
      case "failed":
        return "交易失敗";
      case "cancelled":
        return "已取消";
      default:
        return status || "-";
    }
  };

  return (
    <>
      <div className="space-y-5">
        {trades.map((t) => {
          const rating = ratings[t.uid];

          return (
            <div
              key={t.uid}
              className="flex justify-between items-start rounded-2xl bg-white shadow-sm border border-pink-100 px-6 py-4 cursor-pointer hover:shadow-md hover:border-pink-200 transition"
              onClick={() => setSelectedUid(t.uid)}
            >
              {/* 左側資訊 */}
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  交易序號：{" "}
                  <span className="font-medium text-gray-800">
                    {t.uid}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  商品：{t.itemName ?? "-"}
                </p>
                <p className="text-sm text-gray-600">
                  金額：{t.amount ?? "-"}
                </p>
                <p className="text-sm text-gray-600">
                  雙方：{t.creatorName || "-"} / {t.counterpartyName || "-"}
                </p>
                <p className="text-xs text-gray-400">
                  建立時間：
                  {t.createdAt
                    ? new Date(t.createdAt).toLocaleString("zh-TW")
                    : "-"}
                </p>
                <p className="text-xs text-pink-500">
                  狀態：{statusText(t.status)}
                </p>
              </div>

              {/* 右側：評價 + 查看詳情 */}
              <div
                className="flex flex-col items-end gap-2"
                onClick={(e) => e.stopPropagation()} // 避免點按鈕時觸發開 Drawer
              >
                {/* 評價區塊 */}
                {typeof rating === "number" ? (
                  <div className="flex items-center gap-1 text-yellow-500">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400"
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">
                      {rating} 星
                    </span>
                  </div>
                ) : (
                  <>
                    {activeRatingUid === t.uid ? (
                      <RatingStars
                        size="sm"
                        onSelect={(stars) =>
                          handleRate(t.uid, stars)
                        }
                      />
                    ) : (
                      <button
                        className="text-xs text-white bg-pink-400 hover:bg-pink-500 rounded-full px-3 py-1 transition"
                        onClick={() =>
                          setActiveRatingUid(
                            activeRatingUid === t.uid ? null : t.uid
                          )
                        }
                      >
                        評價
                      </button>
                    )}
                  </>
                )}

                {/* 查看詳情按鈕 */}
                <button
                  className="mt-1 text-[11px] text-pink-500 underline underline-offset-2 hover:text-pink-600"
                  onClick={() => setSelectedUid(t.uid)}
                >
                  查看詳情
                </button>
              </div>
            </div>
          );
        })}

        {/* 分頁 */}
        <div className="flex justify-center items-center gap-3 pt-4">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className={`px-4 py-1 rounded-md border text-sm transition
              ${
                page === 1
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-pink-300 text-pink-500 hover:bg-pink-50"
              }`}
          >
            ← 上一頁
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm border transition
                  ${
                    p === page
                      ? "bg-pink-400 text-white border-pink-400"
                      : "border-pink-200 text-pink-500 hover:bg-pink-50"
                  }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className={`px-4 py-1 rounded-md border text-sm transition
              ${
                page === totalPages
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-pink-300 text-pink-500 hover:bg-pink-50"
              }`}
          >
            下一頁 →
          </button>
        </div>
      </div>

      {/* 抽屜：交易詳情 */}
      <TradeDetailDrawer
        uid={selectedUid}
        open={!!selectedUid}
        onClose={() => setSelectedUid(null)}
      />
    </>
  );
}
