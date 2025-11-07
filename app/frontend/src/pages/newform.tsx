import { useState } from "react";
import { QRCode } from "@/components/ui/qr-code";
import RentTemplate from "@/components/templates/rent.template";
import P2PTemplate from "@/components/templates/p2p.template";
import { Copy, Check } from "lucide-react"; // ✅ icon 套件


export default function NewForm() {
  const [template, setTemplate] = useState<"rent" | "p2p" | "">("");
  const [tradeId, setTradeId] = useState("");
  const [initiatorVerified, setInitiatorVerified] = useState(false);
  const [transactionLocked, setTransactionLocked] = useState(false);
  const [receiverVerified, setReceiverVerified] = useState(false);
  const [initiatorConfirmed, setInitiatorConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateTradeId = () => {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    setTradeId(id);
  };

  const transactionSuccess = initiatorVerified && receiverVerified;

  const handleCopy = () => {
    navigator.clipboard.writeText(tradeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // 2 秒後自動消失
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center py-8 px-4">
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded-2xl shadow-lg p-8 space-y-8">


        {initiatorConfirmed && !initiatorVerified && (
          <div className="bg-yellow-50 border border-yellow-300 text-black py-4 px-6 rounded-xl text-center font-semibold text-lg shadow-inner">
            建立方請開啟數位憑證皮夾 App 掃描 QR Code
          </div>
        )}

        {initiatorVerified && !transactionLocked && (
          <div className="bg-yellow-50 border border-yellow-300 text-black py-4 px-6 rounded-xl text-center font-semibold text-lg shadow-inner">
            請繼續完成下方表單內容
          </div>
        )}

        {transactionLocked && !transactionSuccess && (
          <div className="bg-yellow-50 border border-yellow-300 text-black py-4 px-6 rounded-xl text-center font-semibold text-lg shadow-inner">
            交易內容已鎖定。請確認方使用交易序號進入表單並開啟數位憑證皮夾掃描 QR Code 完成身分驗證。<br />
            注意！掃描 QR Code 代表您已閱讀並同意交易內容。
          </div>
        )}

        {transactionSuccess && (
          <div className="bg-yellow-50 border border-yellow-300 text-black py-4 px-6 rounded-xl text-center font-semibold text-lg shadow-inner">
            雙方驗證完成，交易成立！
          </div>
        )}

        {/* 標題 */}
        {template && !transactionLocked && (
          <h1 className="text-2xl font-bold text-center text-[var(--color-primary)]">
            建立表單
          </h1>
        )}

        {/* 已鎖定顯示交易序號 */}
        {transactionLocked && (
          <section className="text-center">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">交易序號</h2>

            <div className="flex justify-center">
              <div
                className={`flex items-center justify-between gap-2 font-mono text-2xl bg-gray-100 px-4 py-2 rounded-xl w-fit transition ${copied ? "ring-2 ring-[var(--color-primary)]" : ""
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

                  {/* ✅ 已複製提示文字 */}
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


        {/* 選擇模板 */}
        {!template && (
          <section className="text-center pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold mb-6 text-gray-800">
              請選擇交易類型
            </h2>

            <div className="flex justify-center gap-8">
              {/* 租約 */}
              <button
                onClick={() => {
                  setTemplate("rent");
                  setInitiatorVerified(false);
                  setReceiverVerified(false);
                  setTransactionLocked(false);
                  setInitiatorConfirmed(false);
                  setTradeId("");
                }}
                className="relative w-64 h-64 rounded-3xl overflow-hidden group transition-all duration-300"
              >
                <img
                  src="/image/rent.png"
                  alt="租約"
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xl font-semibold flex items-center gap-2 drop-shadow-md">
                 <span>租約</span>
                </div>
              </button>

              {/* 網路交易 */}
              <button
                onClick={() => {
                  setTemplate("p2p");
                  setInitiatorVerified(false);
                  setReceiverVerified(false);
                  setTransactionLocked(false);
                  setInitiatorConfirmed(false);
                  setTradeId("");
                }}
                className="relative w-64 h-64 rounded-3xl overflow-hidden group transition-all duration-300"
              >
                <img
                  src="/image/internet-deal.png"
                  alt="網路交易"
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xl font-semibold flex items-center gap-2 drop-shadow-md">
                 <span>網路交易</span>
                </div>
              </button>
            </div>
          </section>
        )}



        {/* ✅ QR 驗證區：左右排列 */}
        {template && !transactionSuccess && (
          <section className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
              數位憑證皮夾 QR Code
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* 建立方驗證 */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[240px]">
                <h3 className="font-semibold mb-3 text-gray-700">建立方驗證</h3>
                {!initiatorConfirmed ? (
                  <p className="text-gray-400">等待填寫雙方驗證條件...</p>
                ) : initiatorVerified ? (
                  <p className="text-[var(--color-primary)] text-lg font-medium">驗證完成！</p>
                ) : (
                  <>
                    <QRCode value="https://verify.initiator" size="lg" />
                    <button
                      onClick={() => setInitiatorVerified(true)}
                      className="mt-6 w-[60%] md:w-[50%] bg-green-500 text-white py-2 rounded-full hover:bg-green-600"
                    >
                      模擬掃描驗證
                    </button>
                  </>
                )}
              </div>

              {/* 確認方驗證 */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[240px]">
                <h3 className="font-semibold mb-3 text-gray-700">確認方驗證</h3>
                {transactionLocked ? (
                  receiverVerified ? (
                    <p className="text-[var(--color-primary)] text-lg font-medium">驗證完成！</p>
                  ) : (
                    <>
                      <QRCode value="https://verify.receiver" size="lg" />
                      <button
                        onClick={() => setReceiverVerified(true)}
                        className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        模擬確認方完成驗證
                      </button>
                    </>
                  )
                ) : (
                  <p className="text-gray-400">等待交易內容確認後顯示...</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 🏠 已選模板 */}
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

        {/* 💰 P2P 模板 */}
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
      </div>
    </div>
  );
}
