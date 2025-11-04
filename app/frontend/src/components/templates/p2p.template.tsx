import { useState } from "react";

export default function P2PTemplate({
  tradeId,
  initiatorVerified,
  setInitiatorVerified,
  transactionLocked,
  setTransactionLocked,
  generateTradeId,
}: any) {
  const [initiator, setInitiator] = useState({ name: "", method: "" });
  const [receiver, setReceiver] = useState({ name: "", method: "" });
  const [formData, setFormData] = useState({ address: "", rent: "", duration: "" });
  const [initiatorConfirmed, setInitiatorConfirmed] = useState(false);

  return (
    <>
      {/* 身分驗證區 */}
      <section className="border-b border-gray-200 pb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">租約雙方條件</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* 房東 */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
            <h3 className="font-semibold text-[var(--color-primary)] mb-4">房東條件</h3>
            <input
              placeholder="姓名"
              className="border p-2 rounded w-full mb-3"
              value={initiator.name}
              onChange={(e) => setInitiator({ ...initiator, name: e.target.value })}
            />
            <select
              className="border p-2 rounded w-full"
              value={initiator.method}
              onChange={(e) => setInitiator({ ...initiator, method: e.target.value })}
            >
              <option value="">選擇驗證方式</option>
              <option value="vc">政府憑證 VC</option>
              <option value="nid">數位身分證</option>
            </select>
          </div>

          {/* 房客 */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
            <h3 className="font-semibold text-[var(--color-secondary)] mb-4">房客條件</h3>
            <input
              placeholder="姓名"
              className="border p-2 rounded w-full mb-3"
              value={receiver.name}
              onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
            />
            <select
              className="border p-2 rounded w-full"
              value={receiver.method}
              onChange={(e) => setReceiver({ ...receiver, method: e.target.value })}
            >
              <option value="">選擇驗證方式</option>
              <option value="vc">政府憑證 VC</option>
              <option value="nid">數位身分證</option>
            </select>
          </div>
        </div>

        {!initiatorConfirmed ? (
          <button
            onClick={() => setInitiatorConfirmed(true)}
            className="mt-6 w-full bg-[var(--color-primary)] text-white py-2 rounded-full"
          >
            確定條件
          </button>
        ) : !initiatorVerified ? (
          <button
            onClick={() => setInitiatorVerified(true)}
            className="mt-6 w-full bg-green-500 text-white py-2 rounded-full"
          >
            模擬掃描驗證
          </button>
        ) : (
          <p className="text-green-600 text-center mt-4">✔ 驗證完成</p>
        )}
      </section>

      {/* 交易內容 */}
      {initiatorVerified && (
        <section className="border-b border-gray-200 pb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">填寫租約內容</h2>
          <div className="bg-gray-50 p-6 rounded-xl shadow-inner max-w-3xl mx-auto">
            <input
              placeholder="租屋地址"
              className="border p-2 rounded w-full mb-3"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <input
              placeholder="租金金額"
              className="border p-2 rounded w-full mb-3"
              value={formData.rent}
              onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
            />
            <input
              placeholder="租期（月）"
              className="border p-2 rounded w-full mb-3"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
            {!transactionLocked ? (
            <button
                onClick={() => {
                generateTradeId();
                setTransactionLocked(true);
                }}
                className="mt-4 w-full bg-[var(--color-primary)] text-white py-2 rounded-full hover:bg-[var(--color-secondary)]"
            >
                確定送出
            </button>
            ) : (
            <p className="text-center text-green-600 font-semibold mt-4">
                交易內容已鎖定，<br/>
                請房客使用交易序號進入表單，<br/>
                掃描 QR Code 完成身分驗證。
            </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
