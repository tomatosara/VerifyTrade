import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import type { TradeFormDraft } from "@/types/tradeForm";
import { emptyTradeForm } from "@/types/tradeForm";

type PaymentMethodOption = {
  value: string;
  label: string;
  backend?: TradeFormDraft["paymentMethod"];
};

type TradeChannelOption = {
  value: string;
  label: string;
  backend?: TradeFormDraft["tradeChannel"];
};

type MatchmakingOption = {
  value: string;
  label: string;
  backend?: TradeFormDraft["matchmakingChannel"];
};

const paymentMethodOptions: PaymentMethodOption[] = [
  { value: "", label: "請選擇交易管道" },
  { value: "cash", label: "現金", backend: "cash" },
  { value: "deposit", label: "匯款", backend: "bank_transfer" },
  { value: "linepay", label: "Line Pay", backend: "bank_transfer" },
  { value: "crypto", label: "加密貨幣", backend: "bank_transfer" },
];

const tradeChannelOptions: TradeChannelOption[] = [
  { value: "", label: "請選擇交易管道" },
  { value: "see", label: "面交", backend: "p2p" },
  { value: "seven-eleven", label: "交貨便", backend: "p2p" },
  { value: "post", label: "郵局", backend: "p2p" },
  { value: "express", label: "快遞", backend: "p2p" },
  { value: "delivery-other", label: "其他", backend: "escrow" },
];

const matchmakingOptions: MatchmakingOption[] = [
  { value: "", label: "請選擇交易媒合管道" },
  { value: "private", label: "線下合議", backend: "in_app" },
  { value: "social-platform", label: "社交平台", backend: "line" },
  { value: "dealing-platform", label: "網路交易平台", backend: "telegram" },
];

const findUiValue = <T extends string>(
  options: { value: string; backend?: T }[],
  backendValue: T | undefined
) => options.find((opt) => opt.backend === backendValue)?.value ?? "";

type TradeParty = "initiator" | "receiver";
interface P2PTemplateProps {
  tradeId: string;
  initiatorVerified: boolean;
  setInitiatorVerified: (value: boolean) => void;
  transactionLocked: boolean;
  setTransactionLocked: (value: boolean) => void;
  generateTradeId: () => void;
  initiatorConfirmed: boolean;
  setInitiatorConfirmed: (value: boolean) => void;
  tradeFormDraft: TradeFormDraft;
  onDraftChange: (patch: Partial<TradeFormDraft>) => void;
  onInitiatorRequirementsChange: (requirements: string[]) => void;
  onReceiverRequirementsChange: (requirements: string[]) => void;
  buyerSide: TradeParty;
  sellerSide: TradeParty;
  onBuyerSideChange: (side: TradeParty) => void;
}

export default function P2PTemplate({
  tradeId,
  initiatorVerified,
  setInitiatorVerified,
  transactionLocked,
  setTransactionLocked,
  generateTradeId,
  initiatorConfirmed,
  setInitiatorConfirmed,
  tradeFormDraft,
  onDraftChange,
  onInitiatorRequirementsChange,
  onReceiverRequirementsChange,
  buyerSide,
  sellerSide,
  onBuyerSideChange,
}: P2PTemplateProps) {
  const draft = tradeFormDraft ?? emptyTradeForm;
  const handleDraftChange = (patch: Partial<TradeFormDraft>) => {
    onDraftChange(patch);
  };
  const [initiatorExtraList, setInitiatorExtraList] = useState([""]);
  const [receiverExtraList, setReceiverExtraList] = useState([""]);
  const paymentSelectionRef = useRef<string | null>(null);
  const tradeChannelSelectionRef = useRef<string | null>(null);
  const matchmakingSelectionRef = useRef<string | null>(null);
  const [paymentMethodUi, setPaymentMethodUi] = useState<string>(() =>
    findUiValue(paymentMethodOptions, draft.paymentMethod)
  );
  const [tradeChannelUi, setTradeChannelUi] = useState<string>(() =>
    findUiValue(tradeChannelOptions, draft.tradeChannel)
  );
  const [matchmakingUi, setMatchmakingUi] = useState<string>(() =>
    findUiValue(matchmakingOptions, draft.matchmakingChannel)
  );
  const getRoleSelectValue = (party: TradeParty): string => {
    // nid = 買家, vc = 賣家（沿用你原本的 value）
    return buyerSide === party ? "nid" : "vc";
  };

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

  useEffect(() => {
    paymentSelectionRef.current = null;
    tradeChannelSelectionRef.current = null;
    matchmakingSelectionRef.current = null;
    setPaymentMethodUi(findUiValue(paymentMethodOptions, draft.paymentMethod));
    setTradeChannelUi(findUiValue(tradeChannelOptions, draft.tradeChannel));
    setMatchmakingUi(findUiValue(matchmakingOptions, draft.matchmakingChannel));
  }, [tradeId, draft.paymentMethod, draft.tradeChannel, draft.matchmakingChannel]);

  useEffect(() => {
    const last = paymentSelectionRef.current;
    if (last) {
      const mapped = paymentMethodOptions.find((opt) => opt.value === last)?.backend;
      if (mapped === draft.paymentMethod) {
        setPaymentMethodUi(last);
        return;
      }
    }
    setPaymentMethodUi(findUiValue(paymentMethodOptions, draft.paymentMethod));
  }, [draft.paymentMethod]);

  useEffect(() => {
    const last = tradeChannelSelectionRef.current;
    if (last) {
      const mapped = tradeChannelOptions.find((opt) => opt.value === last)?.backend;
      if (mapped === draft.tradeChannel) {
        setTradeChannelUi(last);
        return;
      }
    }
    setTradeChannelUi(findUiValue(tradeChannelOptions, draft.tradeChannel));
  }, [draft.tradeChannel]);

  useEffect(() => {
    const last = matchmakingSelectionRef.current;
    if (last) {
      const mapped = matchmakingOptions.find((opt) => opt.value === last)?.backend;
      if (mapped === draft.matchmakingChannel) {
        setMatchmakingUi(last);
        return;
      }
    }
    setMatchmakingUi(findUiValue(matchmakingOptions, draft.matchmakingChannel));
  }, [draft.matchmakingChannel]);

  useEffect(() => {
    const initiatorRequirements = initiatorExtraList.filter((v) => v);
    const receiverRequirements = receiverExtraList.filter((v) => v);

    const validatedInitiator = initiatorRequirements.length > 0 ? initiatorRequirements : [];
    const validatedReceiver = receiverRequirements.length > 0 ? receiverRequirements : [];

    onInitiatorRequirementsChange(validatedInitiator);
    onReceiverRequirementsChange(validatedReceiver);
    handleDraftChange({ identityRequirements: validatedReceiver });
  }, [initiatorExtraList, receiverExtraList, onInitiatorRequirementsChange, onReceiverRequirementsChange]);

  const handlePaymentMethodChange = (value: string) => {
    paymentSelectionRef.current = value;
    setPaymentMethodUi(value);
    const backend = paymentMethodOptions.find((opt) => opt.value === value)?.backend;
    if (backend) {
      handleDraftChange({ paymentMethod: backend });
    }
  };

  const handleTradeChannelChange = (value: string) => {
    tradeChannelSelectionRef.current = value;
    setTradeChannelUi(value);
    const backend = tradeChannelOptions.find((opt) => opt.value === value)?.backend;
    if (backend) {
      handleDraftChange({ tradeChannel: backend });
    }
  };

  const handleMatchmakingChange = (value: string) => {
    matchmakingSelectionRef.current = value;
    setMatchmakingUi(value);
    const backend = matchmakingOptions.find((opt) => opt.value === value)?.backend;
    if (backend) {
      handleDraftChange({ matchmakingChannel: backend });
    }
  };
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
                value={getRoleSelectValue("initiator")}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "nid") {
                    // 建立方選「買家」→ buyerSide = initiator
                    onBuyerSideChange("initiator");
                  } else if (value === "vc") {
                    // 建立方選「賣家」→ buyerSide = receiver（另一邊自動變買家）
                    onBuyerSideChange("receiver");
                  }
                }}
                disabled={initiatorConfirmed}
              >
                <option value="vc">賣家</option>
                <option value="nid">買家</option>
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
                    {/* <option value="employee">員工證</option> */}
                    <option value="nutritionist">營養師證照</option>
                    <option value="lawyer">律師證照</option>
                    {/* <option value="goods">商品來源證明</option> */}
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
                value={getRoleSelectValue("receiver")}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "nid") {
                    // 確認方選「買家」→ buyerSide = receiver
                    onBuyerSideChange("receiver");
                  } else if (value === "vc") {
                    // 確認方選「賣家」→ buyerSide = initiator
                    onBuyerSideChange("initiator");
                  }
                }}
                disabled={initiatorConfirmed}
              >
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
                    <option value="student">學生證</option>
                    {/* <option value="employee">員工證</option> */}
                    <option value="nutritionist">營養師證照</option>
                    <option value="lawyer">律師證照</option>
                    {/* <option value="goods">商品來源證明</option> */}
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
      <section className="pb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-8 text-center">交易內容</h3>

        <>
          <div>
            <label className="block text-gray-700 font-medium mb-1">商品名稱</label>
            <input
              type="text"
              placeholder="請輸入商品名稱"
              className={inputClass(transactionLocked)}
              value={draft.itemName}
              onChange={(e) => handleDraftChange({ itemName: e.target.value })}
              disabled={transactionLocked}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">商品狀態</label>
            <select
              className={inputClass(transactionLocked)}
              value={draft.itemCondition}
              onChange={(e) =>
                handleDraftChange({ itemCondition: e.target.value as TradeFormDraft["itemCondition"] })
              }
              disabled={transactionLocked}
            >
              <option value="new">全新</option>
              <option value="used">二手</option>
              <option value="used_like_new">二手近全新</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">商品金額</label>
            <input
              type="number"
              placeholder="請輸入商品金額"
              className={inputClass(transactionLocked)}
              value={draft.amount}
              onChange={(e) => handleDraftChange({ amount: e.target.value })}
              disabled={transactionLocked}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">付款方式</label>
            <select
              className={inputClass(transactionLocked)}
              value={paymentMethodUi}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              disabled={transactionLocked}
            >
              {paymentMethodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">交易管道</label>
            <select
              className={inputClass(transactionLocked)}
              value={tradeChannelUi}
              onChange={(e) => handleTradeChannelChange(e.target.value)}
              disabled={transactionLocked}
            >
              {tradeChannelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">交易媒合管道</label>
            <select
              className={inputClass(transactionLocked)}
              value={matchmakingUi}
              onChange={(e) => handleMatchmakingChange(e.target.value)}
              disabled={transactionLocked}
            >
              {matchmakingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">商品說明</label>
            <textarea
              placeholder="請輸入商品說明（3000 字以內）"
              className={`${inputClass(transactionLocked)} h-32 resize-none`}
              maxLength={3000}
              value={draft.itemDescription}
              onChange={(e) => handleDraftChange({ itemDescription: e.target.value })}
              disabled={transactionLocked}
            ></textarea>
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
      </section>



    </>
  );
}
