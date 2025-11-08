import { useState } from "react";
import Carousel from "../components/carousel";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

const HEALTH_URL = (() => {
  try {
    const target = new URL(API_BASE);
    return `${target.origin}/health`;
  } catch {
    return "http://localhost:3000/health";
  }
})();

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const checkBackend = async () => {
    setChecking(true);
    setHealthStatus(null);
    try {
      const res = await fetch(HEALTH_URL);
      const data = await res.json();
      setHealthStatus(data?.ok ? "後端服務運作正常" : "後端回覆異常");
    } catch {
      setHealthStatus("無法連線到後端，請確認伺服器是否啟動。");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <section>
        <Carousel />
      </section>

      <section className="py-24 flex flex-col items-center text-center">
        <h2 className="text-4xl font-bold text-[var(--color-primary)] mb-6">
          為什麼選擇我們？
        </h2>
        <p className="text-lg text-[var(--color-text)] max-w-2xl">
          我們結合政府憑證與零知識驗證技術，讓交易安全又隱私，打造數位信任的新標準。
        </p>
        <button
          onClick={checkBackend}
          className="mt-8 rounded-full border border-[var(--color-primary)] px-6 py-3 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition"
        >
          {checking ? "檢查中..." : "檢查後端狀態"}
        </button>
        {healthStatus && (
          <p className="mt-4 text-sm text-gray-600">{healthStatus}</p>
        )}
      </section>
    </div>
  );
}
