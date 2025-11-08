// src/pages/myaccount.tsx
import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { mockTransactions } from "@/mocks/mockTransactions";
import { useAuth } from "@/context/AuthContext";
type TxStatus =
  | "success"
  | "initiator_not_scanned"
  | "responder_not_scanned"
  | "incomplete";

interface Transaction {
  id: string;
  tradeId: string;
  date: string;
  status: TxStatus;
  rating: number | null;
}

const DEFAULT_AVATAR =
  "https://api.dicebear.com/8.x/identicon/svg?seed=verifytrade-user";

export default function MyAccount() {
  const { user, loading, isAuthenticated } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  const [currentPage, setCurrentPage] = useState(1);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 5;

  // 換頭貼（目前只改前端）
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  // 評價（目前只改前端）
  const handleRate = (txId: string, stars: number) => {
    setTransactions(prev =>
      prev.map(tx => (tx.id === txId ? { ...tx, rating: stars } : tx))
    );
    setShowRating(null);
  };

  const statusLabel: Record<TxStatus, string> = {
    success: "交易成功",
    initiator_not_scanned: "建立方尚未掃描 QR Code",
    responder_not_scanned: "確認方尚未掃描 QR Code",
    incomplete: "交易內容尚未填寫完成",
  };

  const totalPages = Math.max(
    1,
    Math.ceil((transactions.length || 0) / itemsPerPage)
  );
  const currentTx = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 text-gray-500">
        載入中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 text-red-500">
        {error}
      </div>
    );
  }

  const displayAvatar = avatar || DEFAULT_AVATAR;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* 頭像與帳號 */}
      <div className="flex items-center gap-8 mb-10">
        <div className="relative">
          <img
            src={displayAvatar}
            alt="avatar"
            className="w-28 h-28 rounded-full border-4 border-[var(--color-accent,#17e3b2)] object-cover shadow-md"
          />
          <label className="absolute bottom-0 right-0 bg-[var(--color-accent,#17e3b2)] text-white text-xs py-1 px-2 rounded-full cursor-pointer hover:bg-[var(--color-secondary,#0bb292)] transition">
            更換
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {user?.name ?? "使用者"}
          </h1>
          <p className="text-gray-500 text-sm">
            身分證號：{user?.idNumber ?? "-"}
          </p>
          <p className="text-gray-500 text-sm">
            角色：{user?.role ?? "-"}
          </p>
          <p className="text-gray-500 text-sm">
            生日：{user?.birthday ?? "-"}
          </p>
        </div>
      </div>

      交易列表
      <h2 className="text-xl font-semibold mb-4 text-gray-800">交易紀錄</h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-sm">目前尚無交易紀錄。</p>
      ) : (
        <>
          <div className="space-y-5">
            {currentTx.map(tx => (
              <div
                key={tx.id}
                className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-700 font-medium">
                      交易序號：{tx.tradeId}
                    </p>
                    <p className="text-sm text-gray-500">
                      狀態：{statusLabel[tx.status]}
                    </p>
                    <p className="text-sm text-gray-500">
                      更新日期：
                      {new Date(tx.date).toLocaleString("zh-TW")}
                    </p>
                  </div>

                  {/* 評價邏輯 */}
                  {tx.rating === null && showRating !== tx.id && (
                    <button
                      onClick={() => setShowRating(tx.id)}
                      className="text-sm bg-[var(--color-accent,#17e3b2)] text-white py-1 px-3 rounded-full hover:bg-[var(--color-secondary,#0bb292)] transition"
                    >
                      評價
                    </button>
                  )}

                  {showRating === tx.id && tx.rating === null && (
                    <RatingStars
                      onSelect={stars => handleRate(tx.id, stars)}
                    />
                  )}

                  {tx.rating !== null && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: tx.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400"
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">
                        {tx.rating} 星
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 分頁 */}
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md border transition ${
                currentPage === 1
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 hover:bg-gray-100 text-gray-700"
              }`}
            >
              ← 上一頁
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-3 py-1 rounded-md border transition ${
                  currentPage === i + 1
                    ? "bg-[var(--color-accent,#17e3b2)] text-white border-transparent"
                    : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md border transition ${
                currentPage === totalPages
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 hover:bg-gray-100 text-gray-700"
              }`}
            >
              下一頁 →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* 評價星星元件 */
function RatingStars({ onSelect }: { onSelect: (stars: number) => void }) {
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(0);

  const handleClick = (index: number) => {
    setSelected(index);
    onSelect(index);
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const index = i + 1;
        const active = index <= (hover || selected);
        return (
          <Star
            key={index}
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleClick(index)}
            className={`w-6 h-6 cursor-pointer transition ${
              active
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        );
      })}
    </div>
  );
}
