/**
 * 🧭 NewForm 組件邏輯總覽
 * ---------------------------------------------------------
 * 狀態說明：
 * - template:           當前選擇的交易模板（"rent" 租約 或 "p2p" 網路交易）
 * - tradeId:            交易序號（建立方驗證成功後自動生成）
 * - transactionLocked:  交易內容已送出（建立方確認交易內容後鎖定）
 * - initiatorConfirmed: 建立方已確認雙方身分條件（可進入驗證階段）
 * - initiatorVerified:  建立方掃描 QR Code 驗證成功（自動生成交易序號）
 * - receiverAgreed:     確認方同意交易內容（同意後才可進入驗證階段）
 * - receiverVerified:   確認方掃描 QR Code 驗證成功
 * - transactionSuccess: 雙方皆驗證完成（交易成立）
 * - copied:             用於控制「交易序號已複製」提示顯示
 * ---------------------------------------------------------
 */

import { useState, useEffect, useRef, useCallback } from "react";
import RentTemplate from "@/components/templates/rent.template";
import P2PTemplate from "@/components/templates/p2p.template";
import { Copy, Check } from "lucide-react";
import { fetchTradeFormQrCode, fetchTradeFormVerifierResult } from "@/api/qr";
import { normalizeCredentialType, resolveCredentialTypeFromIdentity, resolveCredentialTypesFromIdentity, type QrCodeResponse } from '@/types/verifier';
import { createTradeForm } from "@/api/tradeForm";
import { emptyTradeForm, type TradeFormCreate, type TradeFormDraft } from "@/types/tradeForm";
import { useAuth as useAuthContext } from "@/context/AuthContext";

type VerificationPhase = "initiator" | "receiver";
type TradeParty = "initiator" | "receiver";
const tradeCreationInFlight = new Set<string>();
const tradeCreationSucceeded = new Set<string>();

const TRADE_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generateSecureId = (length: number = 8): string => {
  const cryptoObj = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (!cryptoObj?.getRandomValues) {
    throw new Error("Secure random generator unavailable");
  }
  const bytes = new Uint8Array(length);
  cryptoObj.getRandomValues(bytes);
  return Array.from(bytes, (b) => TRADE_ID_ALPHABET[b % TRADE_ID_ALPHABET.length]).join("");
};

const isTradeUidConflictError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const maybeAxios = error as { response?: { data?: { error?: string } } };
  return maybeAxios.response?.data?.error === "Trade UID already exists";
};

export default function NewForm() {
  // 🧩 所有狀態變數
  const { user } = useAuthContext();
  const [template, setTemplate] = useState<"rent" | "p2p" | "">("");
  const [tradeId, setTradeId] = useState("");
  const [transactionLocked, setTransactionLocked] = useState(false);
  const [initiatorConfirmed, setInitiatorConfirmed] = useState(false);
  const [initiatorVerified, setInitiatorVerified] = useState(false);
  const [receiverAgreed, setReceiverAgreed] = useState(false);
  const [receiverVerified, setReceiverVerified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrData, setQrData] = useState<QrCodeResponse | null>(null);
  const [qrPhase, setQrPhase] = useState<VerificationPhase | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrReloadKey, setQrReloadKey] = useState(0);
  const pollerRef = useRef<number | null>(null);
  const qrFetchKeyRef = useRef(0);
  const autoCreateAttemptedTradeId = useRef<string | null>(null); // Ensures auto-create fires only once per tradeId
  const [creatingTradeForm, setCreatingTradeForm] = useState(false);
  const [tradeFormCreated, setTradeFormCreated] = useState(false);
  const [tradeFormError, setTradeFormError] = useState<string | null>(null);
  const defaultCredentialType: string | null = null;
  const [requiredCredentialType, setRequiredCredentialType] = useState<string | null>(defaultCredentialType);
  const [initiatorIdentityRequirements, setInitiatorIdentityRequirements] = useState<string[]>([]);
  const [receiverIdentityRequirements, setReceiverIdentityRequirements] = useState<string[]>([]);
  const creatorId = user?.idNumber ?? "";
  const [tradeDraft, setTradeDraft] = useState<TradeFormDraft>({ ...emptyTradeForm });
const [buyerSide, setBuyerSide] = useState<TradeParty>("initiator"); // 預設建立方是買家
const sellerSide: TradeParty = buyerSide === "initiator" ? "receiver" : "initiator";
  // ✅ 自動生成交易序號
  const generateTradeId = () => {
    try {
      const id = generateSecureId(8);
      setTradeId(id);
    } catch (error) {
      console.error("Failed to generate secure trade id", error);
      setTradeFormError("無法產生交易序號，請使用支援的瀏覽器再試一次。");
    }
  };

  // ✅ 當建立方驗證成功但尚未生成 tradeId 時，自動生成
  useEffect(() => {
    if (initiatorVerified && !tradeId) {
      generateTradeId();
    }
  }, [initiatorVerified]);

  // ✅ 判斷整體交易是否成功
  const transactionSuccess = initiatorVerified && receiverVerified;
  const requiredPhase: VerificationPhase | null =
    initiatorConfirmed && !initiatorVerified
      ? "initiator"
      : initiatorVerified && transactionLocked && receiverAgreed && !receiverVerified
        ? "receiver"
        : null;
  const shouldShowQrSection = Boolean(template && (requiredPhase || tradeFormCreated));

  const cleanupPoller = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanupPoller();
  }, [cleanupPoller]);

  useEffect(() => {
    const targetPhase = requiredPhase ?? "initiator";
    const identities =
      targetPhase === "receiver" ? receiverIdentityRequirements : initiatorIdentityRequirements;
    const mappedRequirements = resolveCredentialTypesFromIdentity(identities);
    setRequiredCredentialType(mappedRequirements.length > 0 ? mappedRequirements[0] : null);
  }, [requiredPhase, initiatorIdentityRequirements, receiverIdentityRequirements, template, defaultCredentialType]);

  const getRequiredCredentialType = useCallback(
    (phase?: VerificationPhase | null) => {
      const targetPhase = phase ?? requiredPhase ?? "initiator";
      const identities =
        targetPhase === "receiver" ? receiverIdentityRequirements : initiatorIdentityRequirements;
      return (
        resolveCredentialTypeFromIdentity(identities) ??
        normalizeCredentialType(requiredCredentialType) ??
        normalizeCredentialType(defaultCredentialType)
      );
    },
    [
      requiredPhase,
      receiverIdentityRequirements,
      initiatorIdentityRequirements,
      requiredCredentialType,
      defaultCredentialType,
    ]
  );

  const attemptCreateTradeForm = useCallback(async () => {
    if (!tradeId || !creatorId || !template) return;

    if (tradeCreationSucceeded.has(tradeId)) {
      if (!tradeFormCreated) {
        setTradeFormCreated(true);
        setTradeFormError(null);
      }
      return;
    }

    if (tradeCreationInFlight.has(tradeId)) {
      return;
    }

    const payload: TradeFormCreate =
      template === "p2p"
        ? {
            uid: tradeId,
            creatorId,
            creatorVerifiedIdentities: initiatorIdentityRequirements,
            itemName: tradeDraft.itemName,
            itemDescription: tradeDraft.itemDescription,
            itemCondition: tradeDraft.itemCondition,
            amount: tradeDraft.amount,
            tradeChannel: tradeDraft.tradeChannel,
            paymentMethod: tradeDraft.paymentMethod,
            matchmakingChannel: tradeDraft.matchmakingChannel,
            identityRequirements: tradeDraft.identityRequirements,
          }
        : {
            uid: tradeId,
            creatorId,
            creatorVerifiedIdentities: initiatorIdentityRequirements,
            itemName: "租屋交易",
            itemDescription: "請在表單中補充交易內容與條件。",
            itemCondition: "used",
            amount: "1",
            tradeChannel: "escrow",
            paymentMethod: "cash",
            matchmakingChannel: "in_app",
            identityRequirements: ["tw_national_id"],
          };

    tradeCreationInFlight.add(tradeId);
    setCreatingTradeForm(true);
    setTradeFormError(null);
    try {
      await createTradeForm(payload);
      tradeCreationSucceeded.add(tradeId);
      setTradeFormCreated(true);
    } catch (err: any) {
      if (isTradeUidConflictError(err)) {
        tradeCreationSucceeded.add(tradeId);
        setTradeFormCreated(true);
        setTradeFormError(null);
      } else {
        setTradeFormError(err?.message || "建立交易表單失敗，請稍後再試");
      }
    } finally {
      tradeCreationInFlight.delete(tradeId);
      setCreatingTradeForm(false);
    }
  }, [creatorId, template, tradeFormCreated, tradeId, tradeDraft]);

  useEffect(() => {
    if (
      !initiatorVerified ||
      !tradeId ||
      tradeFormCreated ||
      !creatorId ||
      creatingTradeForm ||
      autoCreateAttemptedTradeId.current === tradeId
    ) {
      return;
    }
    autoCreateAttemptedTradeId.current = tradeId;
    attemptCreateTradeForm();
  }, [
    initiatorVerified,
    tradeId,
    tradeFormCreated,
    creatorId,
    creatingTradeForm,
    attemptCreateTradeForm,
  ]);

  // ✅ 依照目前流程動態建立 QR Code 並輪詢驗證結果
  useEffect(() => {
    if (!requiredPhase) {
      cleanupPoller();
      if (qrData) setQrData(null);
      if (qrPhase) setQrPhase(null);
      setQrError(null);
      setVerificationError(null);
      setQrLoading(false);
      qrFetchKeyRef.current = 0;
      return;
    }

    const requiredTypesForPhase = resolveCredentialTypesFromIdentity(
      requiredPhase === "receiver" ? receiverIdentityRequirements : initiatorIdentityRequirements
    );
    if (requiredTypesForPhase.length === 0) {
      cleanupPoller();
      if (qrData) setQrData(null);
      if (qrPhase) setQrPhase(null);
      setQrError(null);
      setVerificationError(null);
      setQrLoading(false);
      qrFetchKeyRef.current = 0;
      if (requiredPhase === "initiator") {
        setInitiatorVerified(true);
      } else if (requiredPhase === "receiver") {
        setReceiverVerified(true);
      }
      return;
    }

    const currentReloadKey = qrReloadKey;
    if (qrPhase === requiredPhase && qrData && qrFetchKeyRef.current === currentReloadKey) return;

    let cancelled = false;

    const fetchQr = async () => {
      setQrLoading(true);
      setQrError(null);
      cleanupPoller();
      qrFetchKeyRef.current = currentReloadKey;

      try {
        const data = await fetchTradeFormQrCode();
        if (cancelled) return;

        setQrData(data);
        setQrPhase(requiredPhase);

        pollerRef.current = window.setInterval(async () => {
          try {
            const result = await fetchTradeFormVerifierResult(data.transactionId);
            if (result.status === "success" && result.verifyResult) {
              const availableTypes = (result.data ?? [])
                .map((vc) => normalizeCredentialType(vc?.credentialType))
                .filter(Boolean) as string[];
              const requiredTypes = resolveCredentialTypesFromIdentity(
                requiredPhase === "receiver"
                  ? receiverIdentityRequirements
                  : initiatorIdentityRequirements
              );
              const isCredentialMatched =
                requiredTypes.length > 0 &&
                requiredTypes.every((req) => availableTypes.includes(req));
              if (!isCredentialMatched) {
                cleanupPoller();
                setVerificationError("身份條件不符，請重新驗證");
                setInitiatorVerified(false);
                setQrData(null);
                setQrPhase(null);
                setQrLoading(false);
                setQrReloadKey((key) => key + 1);
                return;
              }

              cleanupPoller();
              setVerificationError(null);
              if (requiredPhase === "initiator") {
                setInitiatorVerified(true);
              }
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          } catch (err: any) {
            setQrError(err?.message || "驗證狀態查詢失敗，請稍後再試");
          }
        }, 3000);
      } catch (err: any) {
        if (!cancelled) {
          setQrError(err?.message || "無法取得 QR Code");
        }
      } finally {
        if (!cancelled) {
          setQrLoading(false);
        }
      }
    };

    fetchQr();

    return () => {
      cancelled = true;
    };
  }, [requiredPhase, qrPhase, qrData, qrReloadKey, cleanupPoller, getRequiredCredentialType]);

  // ✅ 複製交易序號
  const handleCopy = () => {
    navigator.clipboard.writeText(tradeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderVerifierContent = (title: string, altText: string) => (
    <>
      <h1 className="text-lg font-semibold text-[var(--color-primary)] mb-4">
        {title}
      </h1>
      {qrLoading && !qrData && (
        <p className="text-gray-600">QR Code 產生中...</p>
      )}
      {qrError && (
        <>
          <p className="text-red-500 text-sm mb-3">{qrError}</p>
          {!qrData && (
            <button
              onClick={() => setQrReloadKey((key) => key + 1)}
              className="text-sm text-[var(--color-primary)] underline hover:text-[var(--color-secondary)]"
            >
              重新產生 QR Code
            </button>
          )}
        </>
      )}
      {verificationError && (
        <p className="text-red-500 text-sm mb-3">{verificationError}</p>
      )}
      {qrData && (
        <>
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <img
              src={qrData.qrcodeImage}
              alt={altText}
              className="w-[220px] h-[220px] object-contain"
            />
          </div>
          <p className="text-xs text-gray-700 mt-4">交易 ID：{qrData.transactionId}</p>
          <button
            onClick={() => setQrReloadKey((key) => key + 1)}
            className="mt-4 text-sm text-[var(--color-primary)] underline hover:text-[var(--color-secondary)]"
          >
            重新產生 QR Code
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center py-8 px-4">
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded-2xl shadow-lg p-8 space-y-8">

        {/* 🚧 狀態提示區塊 ------------------------------------------------ */}
        {transactionLocked && !initiatorConfirmed && (
          <Alert text="請繼續填寫雙方身分驗證條件。" />
        )}
        {initiatorConfirmed && !initiatorVerified && (
          <Alert text="請建立方開啟數位憑證皮夾掃描 QR Code。" />
        )}
        {initiatorVerified && !receiverAgreed && (
          <Alert text="建立方驗證成功！交易內容已鎖定，請確認方使用交易序號登入表單，核對並確認交易資訊。" />
        )}
        {receiverAgreed && !transactionSuccess&& (
          <Alert text="請確認方開啟數位憑證皮夾掃描 QR Code 完成身分驗證。" />
        )}
        {transactionSuccess && <Alert text="雙方驗證成功，交易成立！" />}

        {/* 標題 ---------------------------------------------------------- */}
        {template && !transactionLocked && (
          <h1 className="text-2xl font-bold text-center text-[var(--color-primary)]">
            建立表單
          </h1>
        )}

        {/* 交易序號顯示區 ------------------------------------------------ */}
        {initiatorVerified && (
          <section className="text-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">交易序號</h2>
            <div className="flex justify-center">
              <div
                className={`flex items-center justify-between gap-2 font-mono text-2xl bg-gray-100 px-4 py-2 rounded-xl w-fit transition ${
                  copied ? "ring-2 ring-[var(--color-primary)]" : ""
                }`}
              >
                <span>{tradeId}</span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-full hover:bg-gray-200 transition relative"
                  title="複製交易序號"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-[var(--color-primary)]" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                  {copied && (
                    <span className="absolute -top-8 text-xs text-gray-600 bg-white whitespace-nowrap border border-gray-200 rounded-md px-3 py-2 shadow-sm">
                      已複製！
                    </span>
                  )}
                </button>
              </div>
            </div>
            {creatingTradeForm && (
              <p className="text-sm text-gray-600 mt-2">建立交易表單中...</p>
            )}
            {tradeFormCreated && !tradeFormError && (
              <p className="text-sm text-green-600 mt-2">交易表單已建立。</p>
            )}
            {/* {tradeFormError && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <p className="text-sm text-red-600">{tradeFormError}</p>
                <button
                  onClick={attemptCreateTradeForm}
                  disabled={creatingTradeForm}
                  className="text-sm text-[var(--color-primary)] underline disabled:opacity-50"
                >
                  重新送出交易表單
                </button>
              </div>
            )} */}
          </section>
        )}

        {/* 交易類型選擇區 ------------------------------------------------ */}
        {!template && <TemplateSelector resetStates={resetAllStates} />}

        {/* QR 驗證區 ------------------------------------------------------ */}
        {shouldShowQrSection && (
          <section className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
              數位憑證皮夾驗證
            </h2>

            <div className="w-full md:w-[400px] mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 min-h-[300px] bg-gray-50 text-center transition-all duration-300">

              {/* 建立方驗證階段 */}
              {requiredPhase === "initiator" &&
                renderVerifierContent("建立方驗證", "建立方驗證 QR Code")}
            </div>
          </section>
        )}

        {/* 🏠 已選模板 ---------------------------------------------------- */}
        {template === "rent" && (
          <RentTemplate
            tradeId={tradeId}
            initiatorVerified={initiatorVerified}
            setInitiatorVerified={setInitiatorVerified}
            transactionLocked={transactionLocked}
            setTransactionLocked={setTransactionLocked}
            generateTradeId={generateTradeId}
            initiatorConfirmed={initiatorConfirmed}
            setInitiatorConfirmed={setInitiatorConfirmed}
          />
        )}

        {/* 💰 網路交易模板 ------------------------------------------------ */}
        {template === "p2p" && (
          <P2PTemplate
            tradeId={tradeId}
            initiatorVerified={initiatorVerified}
            setInitiatorVerified={setInitiatorVerified}
            transactionLocked={transactionLocked}
            setTransactionLocked={setTransactionLocked}
            generateTradeId={generateTradeId}
            initiatorConfirmed={initiatorConfirmed}
            setInitiatorConfirmed={setInitiatorConfirmed}
            tradeFormDraft={tradeDraft}
            onDraftChange={(patch) => setTradeDraft((prev) => ({ ...prev, ...patch }))}
            onInitiatorRequirementsChange={setInitiatorIdentityRequirements}
            onReceiverRequirementsChange={setReceiverIdentityRequirements}
            // 買家 / 賣家角色
            buyerSide={buyerSide}
            sellerSide={sellerSide}
            onBuyerSideChange={setBuyerSide}
          />
        )}
      </div>
    </div>
  );

  // 🧹 重設所有狀態（供 TemplateSelector 呼叫）
  function resetAllStates(type: "rent" | "p2p") {
    cleanupPoller();
    if (tradeId) {
      tradeCreationInFlight.delete(tradeId);
      tradeCreationSucceeded.delete(tradeId);
    }
    setQrData(null);
    setQrPhase(null);
    setQrError(null);
    setVerificationError(null);
    setQrLoading(false);
    setQrReloadKey(0);
    qrFetchKeyRef.current = 0;
    setTradeFormCreated(false);
    setTradeFormError(null);
    setCreatingTradeForm(false);
    setTemplate(type);
    setInitiatorVerified(false);
    setReceiverVerified(false);
    setTransactionLocked(false);
    setInitiatorConfirmed(false);
    setTradeId("");
    setReceiverAgreed(false);
    setTradeDraft({ ...emptyTradeForm });
    setInitiatorIdentityRequirements([]);
    setReceiverIdentityRequirements([]);
    setRequiredCredentialType(defaultCredentialType);
    autoCreateAttemptedTradeId.current = null;
  }
}

/* 🔸 共用提示元件 */
function Alert({ text }: { text: string }) {
  return (
    <div className="bg-yellow-50 border border-yellow-300 text-black py-4 px-6 rounded-xl text-center font-semibold text-lg shadow-inner">
      {text}
    </div>
  );
}

/* 🔸 交易模板選擇元件 */
function TemplateSelector({ resetStates }: { resetStates: (type: "rent" | "p2p") => void }) {
  return (
    <section className="text-center pb-8 border-b border-gray-200">
      <h2 className="text-lg font-semibold mb-6 text-gray-800">請選擇交易類型</h2>
      <div className="flex justify-center gap-8">
        <TemplateButton type="rent" img="/image/rent.png" label="租約" onSelect={resetStates} />
        <TemplateButton
          type="p2p"
          img="/image/internet-deal.png"
          label="網路交易"
          onSelect={resetStates}
        />
      </div>
    </section>
  );
}

/* 🔸 單一模板按鈕 */
function TemplateButton({
  type,
  img,
  label,
  onSelect,
}: {
  type: "rent" | "p2p";
  img: string;
  label: string;
  onSelect: (type: "rent" | "p2p") => void;
}) {
  return (
    <button
      onClick={() => onSelect(type)}
      className="relative w-64 h-64 rounded-3xl overflow-hidden group transition-all duration-300"
    >
      <img
        src={img}
        alt={label}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xl font-semibold drop-shadow-md">
        {label}
      </div>
    </button>
  );
}
