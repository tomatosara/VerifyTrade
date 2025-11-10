import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import React, { useState } from "react";
import { PinInput } from "@/components/ui/pin-input";
import { fetchTradeFormByUid } from "@/api/tradeForm";
import type { TradeFormViewResponse } from "@/types/tradeForm";
import { useNavigate } from "react-router-dom";
import { TradeSummaryCard } from "@/components/trade/TradeSummaryCard";

const sanitizeUidInput = (value: string) =>
  value.replace(/[^0-9a-z]/gi, "").toUpperCase();

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (typeof parsed?.message === "string") return parsed.message;
      if (typeof parsed?.error === "string") return parsed.error;
    } catch {
      // raw string, continue
    }
    return error.message;
  }
  return "取得交易資料失敗，請稍後再試";
};

export default function Open() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TradeFormViewResponse | null>(null);

  const canSubmit = code.length === 8 && !loading;

  const handleFetchTrade = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchTradeFormByUid(code);

      if (data.view !== "participant") {
        setResult(data);
        setError("此交易序號僅能檢視公開資訊，請確認您是否為交易參與者。");
        return;
      }

      navigate(`/verify/${code}`, { state: { result: data } });
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
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
            className={`w-40 md:w-48 py-3 mt-2 md:mt-8 rounded-full font-semibold border-none transition
    ${canSubmit
                ? "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {loading ? "查詢中..." : "確認"}
          </InteractiveHoverButton>

          {error && (
            <p className="mt-4 text-sm text-red-500">
              {error}
            </p>
          )}

          {loading && !error && (
            <p className="mt-4 text-sm text-gray-600">查詢中，請稍候...</p>
          )}

          {!loading && result && (
            <TradeSummaryCard result={result} />
          )}
        </div>
      </div>
    </div>
  );
}
