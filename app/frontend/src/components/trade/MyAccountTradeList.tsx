import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { fetchTrades } from "@/api/trades";
import { TradeSummary } from "@/types/trades";
import { TradeDetailDrawer } from "@/components/trade/TradeDetailDrawer";
import { formatStatus, formatDate } from "@/components/trade/tool";
const ITEMS_PER_PAGE = 5;

export function MyAccountTradeList() {
  const [trades, setTrades] = useState<TradeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // uid -> stars
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const primary = "var(--color-primary, #F15B6C)";
  const accent = "var(--color-accent, #FF8E8E)";

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

      // 從後端初始化已評星數
      const initRatings = Object.fromEntries(
        res.items
          .filter((t) => typeof t.stars === "number")
          .map((t) => [t.uid, t.stars as number])
      );
      setRatings(initRatings);
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
    setRatings((prev) => ({ ...prev, [uid]: stars }));
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

  if (!loading && !error && trades.length === 0) {
    return <div className="text-center text-gray-500 py-6">目前沒有交易紀錄</div>;
  }

  return (
    <>
      <div className="space-y-5">
        {trades.map((t) => {
          const rating = ratings[t.uid];

          return (
            <div
              key={t.uid}
              className="flex justify-between items-center rounded-2xl bg-white shadow-sm px-6 py-4 cursor-pointer transition hover:shadow-md"
              style={{
                border: `1px solid color-mix(in srgb, ${primary} 12%, transparent)`,
              }}
              onClick={() => setSelectedUid(t.uid)}
            >
              {/* 左側：只顯示基本資訊 */}
              <div className="space-y-1">
                <p className="text-lg text-gray-800 font-semibold">
                  交易序號：
                  <span className="ml-1 text-[var(--color-secondary,#246BCE)]">
                    {t.uid}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  狀態：{formatStatus(t.status)}
                </p>
                <p className="text-sm text-gray-600">
                  更新時間：{formatDate(t.updatedAt)}
                </p>
              </div>

              {/* 右側：已評顯示星星 / 未評顯示「評價」按鈕 */}
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()} // 避免點按鈕時也打開 drawer
              >
                {typeof rating === "number" ? (
                  <>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-700">
                      {rating} 星
                    </span>
                  </>
                ) : (
                  <button
                    className="px-4 py-1.5 rounded-full text-sm text-white transition"
                    style={{ backgroundColor: primary }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = accent)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = primary)
                    }
                    onClick={() => setSelectedUid(t.uid)}
                  >
                    評價
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* 分頁 */}
        <div className="flex justify-center items-center gap-3 pt-4">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-1 rounded-md border text-sm transition"
            style={{
              borderColor: page === 1 ? "#ddd" : primary,
              color: page === 1 ? "#aaa" : primary,
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            ← 上一頁
          </button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const isActive = p === page;
            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-sm border transition"
                style={{
                  backgroundColor: isActive ? primary : "transparent",
                  color: isActive ? "#fff" : primary,
                  borderColor: primary,
                }}
                onMouseEnter={(e) =>
                  !isActive &&
                  (e.currentTarget.style.backgroundColor =
                    "var(--color-accent)")
                }
                onMouseLeave={(e) =>
                  !isActive &&
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-1 rounded-md border text-sm transition"
            style={{
              borderColor: page === totalPages ? "#ddd" : primary,
              color: page === totalPages ? "#aaa" : primary,
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            下一頁 →
          </button>
        </div>
      </div>

      {/* 抽屜：交易詳情 + 評價（實際打 API 在 Drawer 裡） */}
      <TradeDetailDrawer
        uid={selectedUid}
        open={!!selectedUid}
        onClose={() => setSelectedUid(null)}
        onRate={handleRate}
        currentRating={selectedUid ? ratings[selectedUid] ?? null : null}
      />
    </>
  );
}
