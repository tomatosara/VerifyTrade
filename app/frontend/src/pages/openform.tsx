import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useState, useEffect } from "react";
import { PinInput } from "@/components/ui/pin-input";
import { fetchTradeFormByUid } from "@/api/tradeForm";
import type { TradeFormViewResponse } from "@/types/tradeForm";
import { useNavigate, useLocation } from "react-router-dom";
import { TradeSummaryCard } from "@/components/trade/TradeSummaryCard";
import { useAuth as useAuthContext } from "@/context/AuthContext";

const sanitizeUidInput = (value: string) =>
  value.replace(/[^0-9a-z]/gi, "").toUpperCase();

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (typeof parsed?.message === "string") return parsed.message;
      if (typeof parsed?.error === "string") return parsed.error;
    } catch {
      // ignore
    }
    return error.message;
  }
  return "取得交易資料失敗，請稍後再試";
};

export default function Open() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuthContext();

  // 🔹 所有 useState / hooks：固定在最上面，無條件執行
  const [code, setCode] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TradeFormViewResponse | null>(null);

  const canSubmit = code.length === 8 && !loadingPage;

  // 🔹 這個 useEffect「永遠」會註冊，不會被 if 擋掉
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", {
        replace: true,
        state: {
          from: location.pathname + location.search,
        },
      });
    }
  }, [authLoading, user, navigate, location]);

  // 🔹 下面這兩個 return 都在所有 hooks 宣告「之後」
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        載入中...
      </div>
    );
  }

  if (!user) {
    // 已觸發 redirect，中間這一幀避免畫面閃爍
    return null;
  }

  const handleFetchTrade = async () => {
    if (!canSubmit) return;

    setLoadingPage(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchTradeFormByUid(code);
      if (data.trade.status === "confirmed") {
        setError("此交易已完成，無法再次驗證。");
        return;
      }
      navigate(`/verify/${code}`, { state: { result: data } });
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err));
    } finally {
      setLoadingPage(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-white overflow-hidden">
      <FlickeringGrid className="absolute inset-0 opacity-70" />

      <div className="relative z-10 w-[90%] md:w-[600px] mx-auto transform -translate-y-20 md:-translate-y-6">
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl text-center shadow-lg p-8 md:p-10 overflow-hidden">
          <BorderBeam
            duration={8}
            borderWidth={3}
            colorFrom="var(--color-primary)"
            colorTo="var(--color-accent)"
          />

          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-4">
            交易序號
          </h1>
          <p className="text-black/80 text-sm mb-8">請輸入 8 碼交易序號</p>

          <PinInput size="sm" className="w-full">
            <PinInput.Group
              maxLength={8}
              value={code}
              onChange={(val: string) => {
                setCode(sanitizeUidInput(val));
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <PinInput.Slot
                  key={i}
                  index={i}
                  className="min-w-0 w-full h-10 sm:h-11 md:h-15 focus:outline-none bg-white/80 transition-all"
                />
              ))}
            </PinInput.Group>
          </PinInput>

          <InteractiveHoverButton
            onClick={handleFetchTrade}
            disabled={!canSubmit}
            className={`w-40 md:w-48 py-3 mt-2 md:mt-8 rounded-full font-semibold border-none transition ${
              canSubmit
                ? "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loadingPage ? "查詢中..." : "確認"}
          </InteractiveHoverButton>

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}

          {loadingPage && !error && (
            <p className="mt-4 text-sm text-gray-600">
              查詢中，請稍候...
            </p>
          )}

          {!loadingPage && result && (
            <TradeSummaryCard result={result} />
          )}
        </div>
      </div>
    </div>
  );
}
