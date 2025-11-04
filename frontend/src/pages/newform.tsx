import { useState } from "react";
import { QRCode } from '@/components/ui/qr-code';

export default function UnifiedTransactionForm() {
  const [template, setTemplate] = useState<"rent" | "p2p" | "">("");
  const [initiator, setInitiator] = useState({ name: "", method: "" });
  const [receiver, setReceiver] = useState({ name: "", method: "" });
  const [initiatorConfirmed, setInitiatorConfirmed] = useState(false);
  const [initiatorVerified, setInitiatorVerified] = useState(false);
  const [transactionLocked, setTransactionLocked] = useState(false);
  const [tradeId, setTradeId] = useState("");
  const [templateLocked, setTemplateLocked] = useState(false);

  const [formData, setFormData] = useState({
    address: "",
    rent: "",
    duration: "",
    item: "",
    price: "",
    note: "",
  });

  const generateTradeId = () => {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    setTradeId(id);

  

  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center py-10 px-4">
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded-2xl shadow-lg p-8 space-y-10">
        <h1 className="text-2xl font-bold text-center text-[var(--color-primary)]">
          身分驗證交易表單
        </h1>

        {tradeId && (
          <div className="flex justify-center items-center gap-2 mb-6">
            <h3 className="font-semibold mb-3 text-gray-700">
              交易序號
            </h3>
            <span className="font-mono text-base bg-gray-100 px-4 py-1 rounded border border-gray-200">
              {tradeId}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(tradeId)}
              className="text-xs bg-[var(--color-secondary)] text-white px-3 py-1 rounded hover:bg-[#4B9CFF] transition"
            >
              複製
            </button>
          </div>
        )}

        {/* 🔹 2️⃣ 驗證 QR 區 */}
        <section className="border-b border-gray-200 pb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
            身分驗證 QR Code
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[240px]">
              <h3 className="font-semibold mb-3 text-gray-700">
                建立方驗證 QR Code
              </h3>
              {initiatorConfirmed ? (
                initiatorVerified ? (
                  <p className="text-green-600 font-medium">✅ 驗證完成</p>
                ) : (
                  <QRCode value="https://www.untitledui.com/" size="lg" />
                )
              ) : (
                <p className="text-gray-400">等待建立方填寫身分驗證條件...</p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[240px]">
              <h3 className="font-semibold mb-3 text-gray-700">
                確認方驗證 QR Code
              </h3>
              {transactionLocked ? (
                <QRCode value="https://www.untitledui.com/" size="lg" />
              ) : (
                <p className="text-gray-400">等待交易內容確認後顯示...</p>
              )}
            </div>
          </div>
        </section>


        {/* 🔹 1️⃣ 條件與模板選擇區 */}
        <section className="border-b border-gray-200 pb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
            步驟一：輸入雙方身分條件與選擇交易模板
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* 建立方條件 */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
              <h3 className="text-md font-semibold text-[var(--color-primary)] mb-4">
                建立方條件
              </h3>
              <input
                placeholder="姓名"
                className="border p-2 rounded w-full mb-3"
                value={initiator.name}
                disabled={initiatorConfirmed}
                onChange={(e) =>
                  setInitiator({ ...initiator, name: e.target.value })
                }
              />
              <select
                className="border p-2 rounded w-full mb-4"
                value={initiator.method}
                disabled={initiatorConfirmed}
                onChange={(e) =>
                  setInitiator({ ...initiator, method: e.target.value })
                }
              >
                <option value="">選擇驗證方式</option>
                <option value="vc">政府憑證 VC</option>
                <option value="nid">數位身分證</option>
              </select>

            </div>

            {/* 對方條件 */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
              <h3 className="text-md font-semibold text-[var(--color-secondary)] mb-4">
                對方條件
              </h3>
              <input
                placeholder="姓名"
                className="border p-2 rounded w-full mb-3"
                value={receiver.name}
                disabled={initiatorConfirmed}
                onChange={(e) =>
                  setReceiver({ ...receiver, name: e.target.value })
                }
              />
              <select
                className="border p-2 rounded w-full mb-4"
                value={receiver.method}
                disabled={!initiatorVerified || transactionLocked}
                onChange={(e) =>
                  setReceiver({ ...receiver, method: e.target.value })
                }
              >
                <option value="">選擇驗證方式</option>
                <option value="vc">政府憑證 VC</option>
                <option value="nid">數位身分證</option>
              </select>
            </div>

            {!initiatorConfirmed ? (
              <button
                onClick={() => setInitiatorConfirmed(true)}
                className="mt-5 w-full bg-[var(--color-primary)] text-white py-2 rounded-full hover:bg-[var(--color-secondary)] transition"
              >
                確定雙方身分條件
              </button>
            ) : !initiatorVerified ? (
              <button
                onClick={() => setInitiatorVerified(true)}
                className="mt-5 w-full bg-green-500 text-white py-2 rounded-full hover:bg-green-600 transition"
              >
                模擬掃描驗證
              </button>
            ) : (
              <p className="text-green-600 text-center font-medium mt-4">
                ✔ 條件已驗證
              </p>
            )}
          </div>
        </section>

        {initiatorVerified && (
          <section className="border-b border-gray-200 pb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
              步驟三：填寫交易內容
            </h2>

            {/* 模板選擇區 */}
            {!transactionLocked && (
              <div className="flex justify-center gap-4 mt-4">
                {/* 只顯示目前選中的模板或全部（取決於是否鎖定） */}
                {(!templateLocked || template === "rent") && (
                  <button
                    onClick={() => setTemplate("rent")}
                    disabled={templateLocked}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition ${template === "rent"
                        ? "bg-[var(--color-primary)] text-white"
                        : "border-gray-300 text-gray-700 hover:border-[var(--color-primary)]"
                      } ${templateLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    🏠 租約模板
                  </button>
                )}
                {(!templateLocked || template === "p2p") && (
                  <button
                    onClick={() => setTemplate("p2p")}
                    disabled={templateLocked}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition ${template === "p2p"
                        ? "bg-[var(--color-secondary)] text-white"
                        : "border-gray-300 text-gray-700 hover:border-[var(--color-secondary)]"
                      } ${templateLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    💰 P2P 模板
                  </button>
                )}
              </div>
            )}

            {/* 表單內容 */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner max-w-3xl mx-auto mt-6">
              {template === "rent" && (
                <>
                  <input
                    placeholder="租屋地址"
                    className="border p-2 rounded w-full mb-3"
                    value={formData.address}
                    disabled={transactionLocked}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                  <input
                    placeholder="租金金額"
                    className="border p-2 rounded w-full mb-3"
                    value={formData.rent}
                    disabled={transactionLocked}
                    onChange={(e) =>
                      setFormData({ ...formData, rent: e.target.value })
                    }
                  />
                  <input
                    placeholder="租期（月）"
                    className="border p-2 rounded w-full mb-3"
                    value={formData.duration}
                    disabled={transactionLocked}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </>
              )}

              {template === "p2p" && (
                <>
                  <input
                    placeholder="商品名稱"
                    className="border p-2 rounded w-full mb-3"
                    value={formData.item}
                    disabled={transactionLocked}
                    onChange={(e) =>
                      setFormData({ ...formData, item: e.target.value })
                    }
                  />
                  <input
                    placeholder="交易金額"
                    className="border p-2 rounded w-full mb-3"
                    value={formData.price}
                    disabled={transactionLocked}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="備註"
                    className="border p-2 rounded w-full mb-3"
                    rows={3}
                    disabled={transactionLocked}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                  />
                </>
              )}

              {/* 送出按鈕 */}
              {!transactionLocked && (
                <button
                  onClick={() => {
                    if (!template) {
                      alert("請先選擇交易模板！");
                      return;
                    }
                    setTemplateLocked(true); // ✅ 鎖定模板
                    generateTradeId();
                    setTransactionLocked(true);
                  }}
                  className="mt-4 w-full bg-[var(--color-primary)] text-white py-2 rounded-full hover:bg-[var(--color-secondary)] transition"
                >
                  確定送出
                </button>
              )}
            </div>
          </section>
        )}


        {/* 🔹 4️⃣ 交易結果區 */}
        {transactionLocked && (
          <section className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              步驟四：交易完成
            </h2>

            <div className="flex justify-center items-center gap-2 mb-4">
              <p className="text-gray-600 mb-2">交易序號：</p>
              <span className="font-mono text-lg bg-gray-100 px-4 py-2 rounded">
                {tradeId}
                <button
                onClick={() => navigator.clipboard.writeText(tradeId)}
                className="text-sm bg-[var(--color-secondary)] text-white px-3 py-1 rounded hover:bg-[#4B9CFF]"
              >
                複製
              </button>
              </span>
              
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
