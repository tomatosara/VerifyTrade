import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

export default function P2PTemplate({
  tradeId,
  initiatorVerified,
  setInitiatorVerified,
  transactionLocked,
  setTransactionLocked,
  generateTradeId,
  initiatorConfirmed,
  setInitiatorConfirmed,
}: any) {
  const [initiator, setInitiator] = useState({ name: "", method: "" });
  const [receiver, setReceiver] = useState({ name: "", method: "" });
  const [formData, setFormData] = useState({ address: "", rent: "", duration: "" });
  const [initiatorExtraList, setInitiatorExtraList] = useState([""]);
  const [receiverExtraList, setReceiverExtraList] = useState([""]);

  // 通用樣式
  const inputClass = (disabled = false) =>
    `border border-gray-300 rounded-lg w-full px-3 py-2 mb-3 text-gray-800 ${disabled
      ? "bg-gray-100 cursor-not-allowed text-gray-500"
      : "bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    }`;

  const selectClass = (disabled = false) =>
    `border border-gray-300 rounded-lg w-full px-3 py-2 mb-3 text-gray-800 ${disabled
      ? "bg-gray-100 cursor-not-allowed text-gray-500"
      : "bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    }`;

  // 建立方確認後自動滾到最上方
  useEffect(() => {
    if (initiatorConfirmed && !initiatorVerified) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [initiatorConfirmed, initiatorVerified]);

  return (
    <>
      {/* 一、身份驗證區 */}
      <section className="border-b border-gray-200 pb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">身分驗證</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* 建立方 */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
            <h3 className="font-semibold text-[var(--color-primary)] mb-4">建立方條件</h3>

            {/* 姓名 */}
            <input
              placeholder="姓名"
              className={inputClass(initiatorConfirmed)}
              value={initiator.name}
              onChange={(e) => setInitiator({ ...initiator, name: e.target.value })}
              disabled={initiatorConfirmed}
            />

            {/* 主身分 */}
            <select
              className={selectClass(initiatorConfirmed)}
              value={initiator.method}
              onChange={(e) => setInitiator({ ...initiator, method: e.target.value })}
              disabled={initiatorConfirmed}
            >
              <option value="">請選擇交易身分</option>
              <option value="vc">賣家</option>
              <option value="nid">買家</option>
            </select>

            {/* 其他身分條件 */}
            {initiatorExtraList.map((item, index) => (
              <div key={index} className="mt-3 flex items-center gap-2">
                <select
                  className={selectClass(initiatorConfirmed)}
                  value={item}
                  onChange={(e) => {
                    const updated = [...initiatorExtraList];
                    updated[index] = e.target.value;
                    setInitiatorExtraList(updated);
                  }}
                  disabled={initiatorConfirmed}
                >
                  <option value="">其他身分條件</option>
                  <option value="student">學生</option>
                  <option value="employee">員工</option>
                  <option value="nutritionist">營養師</option>
                  <option value="vendor">廠商證明</option>
                </select>

                {!initiatorConfirmed && initiatorExtraList.length > 1 && (
                  <button
                    onClick={() => {
                      const updated = initiatorExtraList.filter((_, i) => i !== index);
                      setInitiatorExtraList(updated);
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition"
                  >
                    <Trash2 className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
            ))}

            {!initiatorConfirmed && (
              <button
                onClick={() => setInitiatorExtraList([...initiatorExtraList, ""])}
                className="mt-3 flex items-center justify-center w-full border border-dashed border-[var(--color-primary)] text-[var(--color-primary)] py-2 rounded-lg hover:bg-[var(--color-primary)] hover:text-white transition"
              >
                ＋ 新增其他身分條件
              </button>
            )}
          </div>

          {/* 確認方 */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
            <h3 className="font-semibold text-[var(--color-secondary)] mb-4">確認方條件</h3>

            <input
              placeholder="姓名"
              className={inputClass(initiatorConfirmed)}
              value={receiver.name}
              onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
              disabled={initiatorConfirmed}
            />

            <select
              className={selectClass(initiatorConfirmed)}
              value={receiver.method}
              onChange={(e) => setReceiver({ ...receiver, method: e.target.value })}
              disabled={initiatorConfirmed}
            >
              <option value="">請選擇交易身分</option>
              <option value="vc">賣家</option>
              <option value="nid">買家</option>
            </select>

            {receiverExtraList.map((item, index) => (
              <div key={index} className="mt-3 flex items-center gap-2">
                <select
                  className={selectClass(initiatorConfirmed)}
                  value={item}
                  onChange={(e) => {
                    const updated = [...receiverExtraList];
                    updated[index] = e.target.value;
                    setReceiverExtraList(updated);
                  }}
                  disabled={initiatorConfirmed}
                >
                  <option value="">其他身分條件</option>
                  <option value="student">學生</option>
                  <option value="employee">員工</option>
                  <option value="nutritionist">營養師</option>
                  <option value="vendor">廠商證明</option>
                </select>

                {!initiatorConfirmed && receiverExtraList.length > 1 && (
                  <button
                    onClick={() => {
                      const updated = receiverExtraList.filter((_, i) => i !== index);
                      setReceiverExtraList(updated);
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition"
                  >
                    <Trash2 className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
            ))}

            {!initiatorConfirmed && (
              <button
                onClick={() => setReceiverExtraList([...receiverExtraList, ""])}
                className="mt-3 flex items-center justify-center w-full border border-dashed border-[var(--color-secondary)] text-[var(--color-secondary)] py-2 rounded-lg hover:bg-[var(--color-secondary)] hover:text-white transition"
              >
                ＋ 新增其他身分條件
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 二、條件確認按鈕 */}
      <section>
        <div className="flex justify-center mt-6">
          {!initiatorConfirmed ? (
            <button
              onClick={() => setInitiatorConfirmed(true)}
              className="w-[50%] md:w-[30%] bg-[var(--color-primary)] text-white py-2 rounded-full hover:bg-[var(--color-secondary)] transition"
            >
              確定條件
            </button>
          ) : !initiatorVerified ? (
            <p className="text-[var(--color-secondary)] font-semibold text-lg text-center">
              建立方請開啟數位憑證皮夾 App 掃描 QR Code
            </p>
          ) : null}
        </div>
      </section>

      {/* 三、交易內容區 */}
      {initiatorConfirmed && initiatorVerified ? (
        <>
          <section className="border-t border-gray-300 mt-10 pt-10 pb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-8 text-center">交易內容</h3>

            <div>
              <label className="block text-gray-700 font-medium mb-1">商品名稱</label>
              <input
                type="text"
                placeholder="請輸入商品名稱"
                className={inputClass(transactionLocked)}
                disabled={transactionLocked}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">商品狀態</label>
              <select className={inputClass(transactionLocked)} disabled={transactionLocked}>
                <option value="">請選擇商品狀態</option>
                <option value="new">全新</option>
                <option value="used">二手</option>
                <option value="like-new">二手近全新</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">商品金額</label>
              <input
                type="number"
                placeholder="請輸入商品金額"
                className={inputClass(transactionLocked)}
                disabled={transactionLocked}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">付款方式</label>
              <select className={inputClass(transactionLocked)} disabled={transactionLocked}>
                <option value="">請選擇交易管道</option>
                <option value="cash">現金</option>
                <option value="deposit">匯款</option>
                <option value="pxpay">全支付</option>
                <option value="linepay">Line Pay</option>
                <option value="pay-other">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">交易管道</label>
              <select className={inputClass(transactionLocked)} disabled={transactionLocked}>
                <option value="">請選擇交易管道</option>
                <option value="see">面交</option>
                <option value="used">7-11交貨便</option>
                <option value="post">郵局</option>
                <option value="cat">黑貓宅急便</option>
                <option value="fedex">Fedex</option>
                <option value="delivery-other">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">交易媒合管道</label>
              <select className={inputClass(transactionLocked)} disabled={transactionLocked}>
                <option value="">請選擇交易媒合管道</option>
                <option value="private">私下建立</option>
                <option value="facebook">Facebook 社團</option>
                <option value="line">Line 社群</option>
                <option value="matching-other">其他</option>
              </select>
            </div>


            <div>
              <label className="block text-gray-700 font-medium mb-1">商品說明</label>
              <textarea
                placeholder="請輸入商品說明（3000 字以內）"
                className={`${inputClass(transactionLocked)} h-32 resize-none`}
                maxLength={3000}
                disabled={transactionLocked}
              ></textarea>
            </div>

            {/* ✅ 把送出按鈕放在同一區塊底部 */}
            <div className="text-center mt-6">
              {!transactionLocked && (
                <button
                  onClick={() => {
                    generateTradeId();
                    setTransactionLocked(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-[60%] md:w-[30%] bg-[var(--color-primary)] text-white py-3 rounded-full hover:bg-[var(--color-secondary)] transition"
                >
                  確定送出
                </button>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="text-center text-gray-500 py-8 border-t border-gray-200">
          ⚠️ 請先完成身分驗證後，再繼續填寫交易內容。
        </div>
      )}
    </>
  );
}
