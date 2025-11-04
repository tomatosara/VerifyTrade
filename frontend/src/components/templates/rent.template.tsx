import { useState } from "react";

export default function RentTemplate({
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

    // 通用輸入樣式
    const inputClass = (disabled = false) =>
        `border border-gray-300 rounded-lg w-full px-3 py-2 mb-3 text-gray-800
     ${disabled
            ? "bg-gray-100 cursor-not-allowed text-gray-500"
            : "bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"}`;

    const selectClass = (disabled = false) =>
        `border border-gray-300 rounded-lg w-full px-3 py-2 mb-3 text-gray-800
     ${disabled
            ? "bg-gray-100 cursor-not-allowed text-gray-500"
            : "bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"}`;

    return (
        <>
            {/* 一、身份驗證區 */}
            <section className="border-b border-gray-200 pb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">雙方條件</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* 建立方 */}
                    <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
                        <h3 className="font-semibold text-[var(--color-primary)] mb-4">建立方條件</h3>
                        <input
                            placeholder="姓名"
                            className={inputClass(initiatorConfirmed)}
                            value={initiator.name}
                            onChange={(e) => setInitiator({ ...initiator, name: e.target.value })}
                            disabled={initiatorConfirmed}
                        />
                        <select
                            className={selectClass(initiatorConfirmed)}
                            value={initiator.method}
                            onChange={(e) => setInitiator({ ...initiator, method: e.target.value })}
                            disabled={initiatorConfirmed}
                        >
                            <option value="">請選擇租屋流程中的身分</option>
                            <option value="vc">房東</option>
                            <option value="nid">房客</option>
                        </select>
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
                            <option value="">請選擇租屋流程中的身分</option>
                            <option value="vc">房東</option>
                            <option value="nid">房客</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* 二、物件驗證 */}
            <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">物件驗證</h3>
                <div className="mt-8 bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
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
                            className={`flex items-center gap-2 mb-2 ${initiatorConfirmed ? "cursor-not-allowed text-gray-500" : ""
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
                </div>

                {/* 確定條件按鈕 */}
                <div className="flex justify-center mt-6">
                    {!initiatorConfirmed ? (
                        <button
                            onClick={() => setInitiatorConfirmed(true)}
                            className="w-[50%] md:w-[30%] bg-[var(--color-primary)] text-white py-2 rounded-full hover:bg-[var(--color-secondary)] transition"
                        >
                            確定條件
                        </button>
                    ) : !initiatorVerified ? (
                        <p className="text-green-600 text-center">
                            建立方請開啟數位憑證皮夾 App 掃描 QR Code
                        </p>
                    ) : null}
                </div>
            </section>

            {/* ✅ 只有當身分與物件驗證完成後，才顯示後續區塊 */}
            {initiatorConfirmed && initiatorVerified ? (
                <>
                    {/* 三、租約條件 */}
                    <section className="border-t border-gray-300 mt-10 pt-10 pb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-8 text-center">
                            租約內容
                        </h3>

                        <div className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200 max-w-5xl mx-auto space-y-4">
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
                    </section>

                    {/* 四、政府規定 */}
                    <section className="pb-6">
                        <div className="bg-yellow-50 border border-yellow-300 rounded-xl shadow-inner max-w-3xl mx-auto p-6">
                            <p className="text-gray-800 leading-relaxed">
                                📢 <span className="font-semibold">租屋補貼已強制開放：</span>
                                依政府規定，所有出租物件皆須同步開放房客申請租金補貼。
                            </p>
                        </div>
                    </section>

                    {/* ✅ 最後的送出按鈕 */}
                    <section className="text-center pb-6">
                        {!transactionLocked ? (
                            <button
                                onClick={() => {
                                    generateTradeId();
                                    setTransactionLocked(true);
                                }}
                                className="mt-6 w-[60%] md:w-[30%] bg-[var(--color-primary)] text-white py-3 rounded-full hover:bg-[var(--color-secondary)] transition"
                            >
                                確定送出
                            </button>
                        ) : (
                            <p className="text-[var(--color-secondary)] font-semibold mt-6 leading-relaxed">
                                🎉 交易內容已鎖定<br />
                                請房客使用交易序號進入表單，<br />
                                並掃描 QR Code 完成身分驗證。
                            </p>
                        )}
                    </section>
                </>
            ) : (
                <div className="text-center text-gray-500 py-8 border-t border-gray-200">
                    ⚠️ 請先完成身分與物件驗證後，再繼續填寫租約內容。
                </div>
            )}

        </>
    )
}


