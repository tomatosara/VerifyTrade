import { useState } from "react";
import { QRCode } from "@/components/ui/qr-code";
import RentTemplate from "@/components/templates/rent.template";
import P2PTemplate from "@/components/templates/p2p.template";

export default function NewForm() {
  const [template, setTemplate] = useState<"rent" | "p2p" | "">("");
  const [tradeId, setTradeId] = useState("");
  const [initiatorVerified, setInitiatorVerified] = useState(false);
  const [transactionLocked, setTransactionLocked] = useState(false);
  const [receiverVerified, setReceiverVerified] = useState(false);
  const [initiatorConfirmed, setInitiatorConfirmed] = useState(false);

  const generateTradeId = () => {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    setTradeId(id);
  };

  const transactionSuccess = initiatorVerified && receiverVerified;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded-2xl shadow-lg p-8 space-y-8">

        {/* 🎉 交易成功提示 */}
        {transactionSuccess && (
          <div className="bg-green-50 border border-green-300 text-green-700 py-4 px-6 rounded-xl text-center font-semibold text-lg">
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
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              交易序號
            </h2>
            <div className="flex justify-center items-center gap-2">
              <span className="font-mono text-2xl bg-gray-100 px-4 py-2 rounded">
                {tradeId}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(tradeId)}
                className="text-sm bg-[var(--color-secondary)] text-white px-3 py-1 rounded hover:bg-[#4B9CFF]"
              >
                複製
              </button>
            </div>
          </section>
        )}

        {/* 選擇模板 */}
        {!template && (
          <section className="text-center pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold mb-6 text-gray-800">
              請選擇交易類型
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setTemplate("rent");
                  setInitiatorVerified(false);
                  setReceiverVerified(false);
                  setTransactionLocked(false);
                  setInitiatorConfirmed(false);
                  setTradeId("");
                }}
                className="px-6 py-2 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)]"
              >
                🏠 租約模板
              </button>
              <button
                onClick={() => {
                  setTemplate("p2p");
                  setInitiatorVerified(false);
                  setReceiverVerified(false);
                  setTransactionLocked(false);
                  setInitiatorConfirmed(false);
                  setTradeId("");
                }}
                className="px-6 py-2 rounded-full bg-[var(--color-secondary)] text-white hover:bg-[#4B9CFF]"
              >
                💰 P2P 模板
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
                  <p className="text-gray-400">等待填寫雙方身分驗證條件...</p>
                ) : initiatorVerified ? (
                  <p className="text-green-600 font-medium">✅ 驗證完成</p>
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
                    <p className="text-green-600 font-medium">✅ 驗證完成</p>
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
            setInitiatorConfirmed={setInitiatorConfirmed}
          />
        )}

        {/* 完成區（再次顯示交易序號） */}
        {transactionLocked && (
          <section className="text-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">交易序號</h2>
            <div className="flex justify-center items-center gap-2">
              <span className="font-mono text-lg bg-gray-100 px-4 py-2 rounded">
                {tradeId}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(tradeId)}
                className="text-sm bg-[var(--color-secondary)] text-white px-3 py-1 rounded hover:bg-[#4B9CFF]"
              >
                複製
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
