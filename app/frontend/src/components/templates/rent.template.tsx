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
  const [initiator, setInitiator] = useState({ method: "" });
  const [receiver, setReceiver] = useState({ method: "" });
  const [formData, setFormData] = useState({ address: "", rent: "", duration: "" });
  const [initiatorExtraList, setInitiatorExtraList] = useState([""]);
  const [receiverExtraList, setReceiverExtraList] = useState([""]);

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

  useEffect(() => {
    if (transactionLocked && !initiatorConfirmed) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [transactionLocked]);
  return (
    <>
      {/* 二、身分驗證區（僅在交易內容送出後才顯示） */}
      {transactionLocked && (
        <section className="pt-2 pb-2 border-b border-gray-300 mt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-8 text-center">
            身分驗證
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* 建立方 */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
              <h3 className="font-semibold text-[var(--color-primary)] mb-4">
                建立方條件
              </h3>

              <select
                className={selectClass(initiatorConfirmed)}
                value={initiator.method}
                onChange={(e) =>
                  setInitiator({ ...initiator, method: e.target.value })
                }
                disabled={initiatorConfirmed}
              >
                <option value="">請選擇租屋流程中的身分</option>
                <option value="vc">房東</option>
                <option value="nid">房客</option>
              </select>

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
                    <option value="student">學生證</option>
                    <option value="employee">員工證</option>
                    <option value="nutritionist">營養師證照</option>
                    <option value="lawyer">律師證照</option>
                    <option value="goods">商品來源證明</option>
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
              <h3 className="font-semibold text-[var(--color-secondary)] mb-4">
                確認方條件
              </h3>

              <select
                className={selectClass(initiatorConfirmed)}
                value={receiver.method}
                onChange={(e) =>
                  setReceiver({ ...receiver, method: e.target.value })
                }
                disabled={initiatorConfirmed}
              >
                <option value="">請選擇租屋流程中的身分</option>
                <option value="vc">房東</option>
                <option value="nid">房客</option>
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
                    <option value="student">學生證</option>
                    <option value="employee">員工證</option>
                    <option value="nutritionist">營養師證照</option>
                    <option value="lawyer">律師證照</option>
                    <option value="goods">商品來源證明</option>
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

          {/* 下方按鈕與掃描流程 */}
          <div className="flex justify-center mt-6 mb-6">
            {!initiatorConfirmed && (
              <button
                onClick={() => {
                  setInitiatorConfirmed(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-[50%] md:w-[30%] bg-[var(--color-primary)] mt-4 text-white py-2 rounded-full hover:bg-[var(--color-secondary)] transition"
              >
                確定雙方條件
              </button>
            )}
          </div>
        </section >
      )
      }


      {/* 一、交易內容區 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">租約內容</h3>
        <>
          <div className="mt-8 bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200 space-y-4">
            {/* 地址 */}
            <label className="block text-gray-700 font-medium mb-1">地址</label>
            <input
              placeholder="請輸入完整地址"
              className={inputClass(initiatorConfirmed)}
              disabled={initiatorConfirmed}
            />

            {/* 檢驗憑證 */}
            <label className="block text-gray-700 font-medium mb-2">檢驗憑證</label>
            {[
              "產權人憑證 VC（房屋持有證明）",
              "公益出租人資格 VC",
              "安全檢查 / 消防 / 電器檢驗 VC",
            ].map((label, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-2 mb-3 ${initiatorConfirmed ? "cursor-not-allowed text-gray-500" : ""
                  }`}
              >
                <input
                  type="checkbox"
                  disabled={initiatorConfirmed}
                  className="w-5 h-5 accent-[var(--color-primary)]"
                />
                <span>{label}</span>
              </label>
            ))}

            {/* 物件類型 */}
            <label className="block text-gray-700 font-medium mb-1">物件類型</label>
            <select className={selectClass(initiatorConfirmed)} disabled={initiatorConfirmed}>
              <option value="">請選擇物件類型</option>
              <option value="整層住家">整層住家</option>
              <option value="套房">套房</option>
              <option value="雅房">雅房</option>
              <option value="店面">店面</option>
            </select>

            {/* 坪數 / 房數 / 衛浴數 */}
            {["坪數", "房數", "衛浴數"].map((label, i) => (
              <div key={i}>
                <label className="block text-gray-700 font-medium mb-1">{label}</label>
                <input
                  placeholder={`請輸入${label}`}
                  className={inputClass(initiatorConfirmed)}
                  disabled={initiatorConfirmed}
                />
              </div>
            ))}



            {/* 租期起始日 */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">租期起始日</label>
              <input
                type="date"
                className={inputClass(transactionLocked)}
                disabled={transactionLocked}
              />
            </div>

            {/* 租期結束日 */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">租期結束日</label>
              <input
                type="date"
                className={inputClass(transactionLocked)}
                disabled={transactionLocked}
              />
            </div>

            {/* 每月租金 */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">每月租金（TWD）</label>
              <input
                type="number"
                placeholder="請輸入每月租金金額"
                className={inputClass(transactionLocked)}
                disabled={transactionLocked}
              />
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  disabled={transactionLocked}
                  className="w-5 h-5 accent-[var(--color-primary)]"
                />
                <span className="text-gray-700 font-medium">含管理費（可勾選）</span>
              </label>
            </div>

            {/* 押金 */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">押金（TWD）</label>
              <input
                type="number"
                placeholder="請輸入押金金額"
                className={inputClass(transactionLocked)}
                disabled={transactionLocked}
              />
            </div>

            {/* 其他費用 */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">其他費用</label>
              <input
                type="text"
                placeholder="可新增其他費用項目"
                className={inputClass(transactionLocked)}
                disabled={transactionLocked}
              />
            </div>

            {/* 自訂條款 */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">自訂條款</label>
              <textarea
                placeholder="請輸入特殊約定事項（3000 字以內）"
                className={`${inputClass(transactionLocked)} h-32 resize-none`}
                maxLength={3000}
                disabled={transactionLocked}
              ></textarea>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-xl shadow-inner max-w-3xl mx-auto p-6 mt-10">
            <p className="text-gray-800 leading-relaxed text-center">
              📢 <span className="font-semibold">租屋補貼已強制開放：</span>
              依政府規定，所有出租物件皆須同步開放房客申請租金補貼。
            </p>
          </div>

          <div className="text-center mt-6">
            {!transactionLocked && (
              <button
                onClick={() => {
                  setTransactionLocked(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-[60%] md:w-[30%] bg-[var(--color-primary)] text-white py-3 rounded-full hover:bg-[var(--color-secondary)] transition"
              >
                確定交易內容
              </button>
            )}
          </div>
        </>
      </section >



    </>
  );
}
