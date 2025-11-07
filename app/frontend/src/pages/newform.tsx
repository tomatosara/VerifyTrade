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

import { useState, useEffect } from "react";
import { QRCode } from "@/components/ui/qr-code";
import RentTemplate from "@/components/templates/rent.template";
import P2PTemplate from "@/components/templates/p2p.template";
import { Copy, Check } from "lucide-react";

export default function NewForm() {
  // 🧩 所有狀態變數
  const [template, setTemplate] = useState<"rent" | "p2p" | "">("");
  const [tradeId, setTradeId] = useState("");
  const [transactionLocked, setTransactionLocked] = useState(false);
  const [initiatorConfirmed, setInitiatorConfirmed] = useState(false);
  const [initiatorVerified, setInitiatorVerified] = useState(false);
  const [receiverAgreed, setReceiverAgreed] = useState(false);
  const [receiverVerified, setReceiverVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ 自動生成交易序號
  const generateTradeId = () => {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    setTradeId(id);
  };

  // ✅ 當建立方驗證成功但尚未生成 tradeId 時，自動生成
  useEffect(() => {
    if (initiatorVerified && !tradeId) {
      generateTradeId();
    }
  }, [initiatorVerified]);

  // ✅ 判斷整體交易是否成功
  const transactionSuccess = initiatorVerified && receiverVerified;

  // ✅ 複製交易序號
  const handleCopy = () => {
    navigator.clipboard.writeText(tradeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Alert text="交易內容已鎖定。請確認方使用交易序號登入表單，核對並確認交易資訊。" />
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
          </section>
        )}

        {/* 交易類型選擇區 ------------------------------------------------ */}
        {!template && <TemplateSelector resetStates={resetAllStates} />}

        {/* QR 驗證區 ------------------------------------------------------ */}
        {template && (
          (initiatorConfirmed && !initiatorVerified) ||
          (initiatorVerified && transactionLocked && receiverAgreed && !receiverVerified) 
        
          ) && (
          <section className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
              數位憑證皮夾驗證
            </h2>

            <div className="w-full md:w-[400px] mx-auto flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 min-h-[300px] bg-gray-50 text-center transition-all duration-300">

              {/* 建立方驗證階段 */}
              {initiatorConfirmed && !initiatorVerified && (
                <>
                  <QRCode value="https://verify.initiator" size="lg" />
                  <h1 className="text-lg font-semibold text-[var(--color-primary)] mt-4">
                    建立方驗證
                  </h1>
                  <button
                    onClick={() => {
                      setInitiatorVerified(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="mt-6 w-[60%] md:w-[40%] bg-green-500 text-white py-2 rounded-full hover:bg-green-600 transition"
                  >
                    模擬建立方驗證
                  </button>
                </>
              )}

              {/* 確認方驗證階段 */}
              {initiatorVerified && transactionLocked && receiverAgreed && !receiverVerified && (
                <>
                  <QRCode value="https://verify.receiver" size="lg" />
                  <h1 className="text-lg font-semibold text-[var(--color-primary)] mt-4">
                    確認方驗證
                  </h1>
                  <button
                    onClick={() => {
                      setReceiverVerified(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
                 }}
                    className="mt-6 w-[60%] md:w-[40%] bg-green-500 text-white py-2 rounded-full hover:bg-green-600 transition"
                  >
                    模擬確認方驗證
                  </button>
                </>
              )}
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
          />
        )}

        {/* 👇 確認方同意按鈕 ---------------------------------------------- */}
        {initiatorVerified && transactionLocked && !receiverAgreed && (
          <div className="flex justify-center pb-2">
            <button
              onClick={() => {
                setReceiverAgreed(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-8 py-3 rounded-full font-semibold text-white transition ${
                receiverAgreed
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
              }`}
            >
              確認方同意交易內容
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // 🧹 重設所有狀態（供 TemplateSelector 呼叫）
  function resetAllStates(type: "rent" | "p2p") {
    setTemplate(type);
    setInitiatorVerified(false);
    setReceiverVerified(false);
    setTransactionLocked(false);
    setInitiatorConfirmed(false);
    setTradeId("");
    setReceiverAgreed(false);
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
