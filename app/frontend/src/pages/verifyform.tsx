import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { fetchTradeFormByUid, confirmTradeForm } from "@/api/tradeForm";
import { fetchTradeFormQrCode, fetchTradeFormVerifierResult } from "@/api/qr";
import { api, setAccessToken } from "@/api/client";
import type { TradeFormViewResponse } from "@/types/tradeForm";
import type { QrCodeResponse, UserProfile } from "@/types/verifier";
import { TradeSummaryCard } from "@/components/trade/TradeSummaryCard";
import { ChevronLeft } from "lucide-react";

interface LocationState {
  result?: TradeFormViewResponse;
}

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
  return "處理要求時發生問題，請稍後再試。";
};

export default function VerifyForm() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | undefined;

  const [result, setResult] = useState<TradeFormViewResponse | null>(
    locationState?.result ?? null
  );
  const [loading, setLoading] = useState(!locationState?.result);
  const [error, setError] = useState<string | null>(null);

  const [receiverAgreed, setReceiverAgreed] = useState(false);
  const [qrData, setQrData] = useState<QrCodeResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedCounterpartyId, setVerifiedCounterpartyId] = useState<string | null>(null);
  const pollerRef = useRef<number | null>(null);
  const confirmTriggeredRef = useRef(false);

  const tradeUid = useMemo(() => result?.trade.uid ?? uid ?? "", [result?.trade.uid, uid]);

  const cleanupPoller = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (result || !uid) return;

    setLoading(true);
    fetchTradeFormByUid(uid)
      .then((data) => {
        if (data.trade.status == "confirmed") {
          setError("此交易已完成，無法再次驗證。");
          return;
        }
        setResult(data);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [result, uid]);

  useEffect(() => {
    return () => cleanupPoller();
  }, [cleanupPoller]);

  const handleVerificationComplete = useCallback(async (counterpartyId: string) => {
    if (!tradeUid || confirmTriggeredRef.current) return;
    confirmTriggeredRef.current = true;
    try {
      await confirmTradeForm(tradeUid, { counterpartyId });
      setVerificationSuccess(true);
    } catch (err) {
      confirmTriggeredRef.current = false;
      setQrError(extractErrorMessage(err));
    }
  }, [tradeUid]);

  const startVerification = async () => {
    if (qrLoading) return;
    confirmTriggeredRef.current = false;
    setReceiverAgreed(true);
    setQrError(null);
    setVerificationSuccess(false);
    setVerifiedCounterpartyId(null);
    await generateQrCode();
  };

  const generateQrCode = async () => {
    cleanupPoller();
    confirmTriggeredRef.current = false;
    setQrLoading(true);
    setQrData(null);
    setQrError(null);

    try {
      const data = await fetchTradeFormQrCode();
      setQrData(data);

      pollerRef.current = window.setInterval(() => {
        (async () => {
          try {
            const res = await fetchTradeFormVerifierResult(data.transactionId);
            if (res.status === "success" && res.verifyResult) {
              cleanupPoller();
              try {
                const loginResp = await api.post<{ accessToken: string; expiresIn: string }>(
                  "/auth/login-by-verifier",
                  { transactionId: data.transactionId },
                  false
                );
                if (loginResp?.accessToken) {
                  setAccessToken(loginResp.accessToken);
                  window.dispatchEvent(new Event("auth-updated"));
                }
                const profile = await api.get<UserProfile>("/auth/me");
                const verifiedId = profile?.idNumber;
                if (!verifiedId) {
                  throw new Error("無法取得身分證號，請重新驗證。");
                }
                setVerifiedCounterpartyId(verifiedId);
                await handleVerificationComplete(verifiedId);
              } catch (innerErr) {
                confirmTriggeredRef.current = false;
                setQrError(extractErrorMessage(innerErr));
                setReceiverAgreed(false);
              }
            }
          } catch (err) {
            setQrError(extractErrorMessage(err));
          }
        })();
      }, 3000);
    } catch (err) {
      setQrError(extractErrorMessage(err));
    } finally {
      setQrLoading(false);
    }
  };

  const handleRetry = () => {
    setReceiverAgreed(false);
    setVerificationSuccess(false);
    cleanupPoller();
    setQrData(null);
    setQrError(null);
    setVerifiedCounterpartyId(null);
    confirmTriggeredRef.current = false;
  };

  const canStart = Boolean(tradeUid) && !qrLoading;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-white overflow-hidden">
      <FlickeringGrid className="absolute inset-0 opacity-50" />

      <div className="relative z-10 w-[95%] max-w-4xl mx-auto py-12">
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/60">
          <BorderBeam
            duration={8}
            borderWidth={3}
            colorFrom="var(--color-primary)"
            colorTo="var(--color-accent)"
          />

          <button
            className="flex items-center gap-2 font-semibold text-lg text-[var(--color-primary)] mb-6 hover:text-[var(--color-secondary)] transition-colors"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={20} />
            返回
          </button>



          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2 text-center">
            確認方驗證
          </h1>

          {verificationSuccess && (
            <div className="bg-yellow-50 border border-yellow-300 text-black py-4 px-6 rounded-xl text-center font-semibold text-lg shadow-inner mt-8 mb-8">

              <p className="text-black-600 text-lg font-semibold text-center">
                確認方驗證成功！             
                系統已記錄您的驗證，請等待交易進一步處理。
              </p>
            </div>
          )}
          {!verificationSuccess && (
            <section className="mt-8 text-center bg-[var(--color-primary)]/10 rounded-2xl p-5 shadow-inner border border-red-200">
              <div className="inline-block text-left">
                <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                  驗證流程
                </h2>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                  <li>請與交易建立方再次核對內容與金額，確認無誤後再進行驗證。</li>
                  <li>使用數位憑證皮夾掃描 QR Code，依指示完成身分驗證。</li>
                  <li>驗證成功後，系統會通知建立方並更新交易狀態。</li>
                </ol>
              </div>
            </section>
          )}

          {loading && <p className="text-center text-gray-500">載入交易資訊中...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {result && (
            <>
              <TradeSummaryCard result={result} />
              <div className="w-full md:w-[420px] mx-auto flex flex-col items-center justify-center mt-8">
                {!receiverAgreed && (
                  <>
                    <InteractiveHoverButton
                      disabled={!canStart}
                      onClick={startVerification}
                      className="px-8 py-3 rounded-full font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition"
                    >
                      我已確認內容，開始驗證
                    </InteractiveHoverButton>
                  </>
                )}
              </div>

              {/* ✅ 僅在開始驗證且尚未成功時顯示 */}
              {receiverAgreed && !verificationSuccess && (
                <section className="mt-6">
                  <div className="w-full md:w-[420px] mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 min-h-[320px] bg-gray-50 text-center">
                    <p className="text-gray-700 mb-4">請使用數位憑證皮夾掃描下方 QR Code</p>

                    {qrLoading && !qrData && <p className="text-gray-500">QR Code 產生中...</p>}

                    {qrError && <div className="text-red-500 text-sm mb-3">{qrError}</div>}

                    {qrData ? (
                      <>
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <img
                            src={qrData.qrcodeImage}
                            alt="確認方驗證 QR Code"
                            className="w-[220px] h-[220px] object-contain"
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-4">交易 ID：{qrData.transactionId}</p>
                        <button
                          className="mt-4 text-sm text-[var(--color-primary)] underline hover:text-[var(--color-secondary)]"
                          onClick={generateQrCode}
                        >
                          重新產生 QR Code
                        </button>
                      </>
                    ) : (
                      !qrLoading && (
                        <InteractiveHoverButton onClick={generateQrCode}>
                          產生驗證 QR Code
                        </InteractiveHoverButton>
                      )
                    )}
                  </div>
                </section>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}

