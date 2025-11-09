import Carousel from "../components/carousel";
import { Highlighter } from "@/components/ui/highlighter";
import { StripedPattern } from "@/components/ui/striped-pattern"

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <section>
        {/* 避開 Navbar 高度 */}
        <Carousel />
      </section>

      {/* 主要內容區 */}
      <section
        className="relative py-24 flex flex-col items-center overflow-hidden text-gray-800"
      >
        {/* 🔹條紋背景層 */}
           
      <StripedPattern direction="right"
       className="text-[var(--color-primary)] opacity-30" />


        {/* 🔹半透明遮罩 */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

        {/* 內文區塊 */}
        <div className="relative z-10 max-w-5xl w-full px-8 text-left">

          <h2 className="text-3xl font-bold text-center text-[var(--color-secondary)] mb-12 leading-loose">
            <p>
              <Highlighter action="underline" color="#f15b6cff">
                簡單六步驟
              </Highlighter>
              ，
              <Highlighter action="highlight" color="#bef0ffff">
                完成交易
              </Highlighter>{" "}
            </p>
          </h2>

          {/* 🟦 建立方階段 */}
          <div className="mb-10 border-2 border-[var(--color-primary)] rounded-2xl p-8 bg-white/80 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold text-[var(--color-secondary)] mb-4">
              建立方階段
            </h3>
            <ul className="space-y-4 text-lg leading-relaxed">
              <li>
                <b>Step 1｜</b>
                <a
                  href="login"
                  className="underline hover:text-[var(--color-primary)] font-semibold"
                >
                  登入平台
                </a>
                ：使用數位身分憑證（VC）登入平台，確保真實身分。
              </li>
              <li>
                <b>Step 2｜</b>
                <a
                  href="newform"
                  className="underline hover:text-[var(--color-primary)] font-semibold"
                >
                  建立交易表單
                </a>
                ：輸入交易內容，並設定雙方身分驗證條件。
              </li>
              <li>
                <b>Step 3｜身分驗證：</b>
                建立方開啟數位憑證皮夾掃描 QRCODE 進行驗證，完成驗證後系統生成唯一「交易序號」。
              </li>
            </ul>
          </div>

          {/* 🟩 確認方階段 */}
          <div className="mb-10 border-2 border-[var(--color-primary)] rounded-2xl p-8 bg-white/80 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold text-[var(--color-secondary)] mb-4">
              確認方階段
            </h3>
            <ul className="space-y-4 text-lg leading-relaxed">
              <li>
                <b>Step 4｜</b>
                <a
                  href="login"
                  className="underline hover:text-[var(--color-primary)] font-semibold"
                >
                  登入平台
                </a>
                ：使用數位身分憑證（VC）登入平台，確保真實身分。
              </li>
              <li>
                <b>Step 5｜</b>
                <a
                  href="openform"
                  className="underline hover:text-[var(--color-primary)] font-semibold"
                >
                  確認交易內容
                </a>
                ：輸入「交易序號」進入同一表單，檢視並確認交易內容。
              </li>
              <li>
                <b>Step 6｜身分驗證：</b>
                確認方開啟數位憑證皮夾掃描 QRCODE 完成身分驗證。
              </li>
            </ul>
          </div>

          {/* 🟧 交易完成階段 */}
          <div className="border-2 border-[var(--color-primary)] rounded-2xl p-8 bg-white/80 shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-2xl font-semibold text-[var(--color-secondary)] mb-4">
              交易完成！
            </h3>
            <ul className="space-y-4 text-lg leading-relaxed">
              <li>
                雙方驗證通過後，交易表單與驗證紀錄將自動寫入區塊鏈。<br />
                輸入「交易序號」或登入帳號，即可查閱交易內容與驗證結果。
              </li>
            </ul>
          </div>

          {/* ⚠️ 詐騙提示 */}
          <div className="mt-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-left shadow-sm">
            <h4 className="text-xl font-semibold text-red-600 mb-2">
              🚨 遇到可疑交易或詐騙？
            </h4>
            <p className="text-gray-700 text-lg leading-relaxed">
              請提供交易序號給警方即可協助追查。<br />
              警方將向平台取得數位身分證編號，
              再由政府單位調取買賣雙方資料。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
