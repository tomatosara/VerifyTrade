import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "如何登入平台？",
    answer:
      "使用政府發放的數位身分證，並以您的數位憑證皮夾掃描頁面上的 QR Code，授權後即可登入。",
  },
  {
    question: "什麼是數位憑證皮夾？",
    answer:
      "數位憑證皮夾是一個整合多種數位證件的APP，身分證可以只是其中一種。數位憑證皮夾本身僅為證件的容器，提供更便捷的服務。",
  },
  {
    question: "如何建立交易？",
    answer:
      "建立交易只要三步驟：登入平台、填寫內容、提交驗證生成交易序號。詳細流程可參考主頁說明，了解每個階段的操作步驟。",
  },
  {
    question: "如何進行驗證？",
    answer:
      "開啟數位憑證皮夾 App，點選下方功能列的「掃描」，將表單頁面上的 QR Code 對準掃描 (請確認交易內容皆完成)，即可完成驗證。",
  },
  {
    question: "交易完成後，我可以查看紀錄嗎？",
    answer:
      "可以。登入帳號後直接輸入「交易序號」或點選「我的帳號」查看交易列表，即可查閱交易內容與驗證結果。",
  },
  {
    question: "如何確認驗證成功？",
    answer:
      "交易表單頁面上方顯示：「雙方驗證成功，交易成立！」，即驗證成功。",
  },
  {
    question: "若交易發生糾紛或詐騙，該怎麼處理？",
    answer:
      "可提供「交易序號」報案，警方會依法向平台取得憑證編號，再由政府單位調取雙方資料。",
  },
{
    question: "如果遇到詐騙或假網站該怎麼辦？",
    answer:
      "請勿輸入任何資料，立即離開詐騙頁面，並透過 Google 搜尋「零知識防詐交易平台」進行操作。",
  },
  {
    question: "平台會保存我的個資嗎？",
    answer:
      "不會。平台僅保存必要的憑證編號與驗證結果，不會存放其餘的憑證資料。",
  },
];

export default function Question() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-3xl mx-auto my-16 px-6">
      <h2 className="text-2xl font-bold text-center mb-8 text-[var(--color-secondary)]">
        常見問題（FAQ）
      </h2>

      <div className="space-y-4">
        {faqs.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex justify-between items-center p-5 text-left text-gray-800 font-medium hover:bg-gray-50 transition"
            >
              <span>{item.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {openIndex === index && (
              <div className="p-5 border-t border-gray-100 bg-gray-50 text-gray-700 leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
