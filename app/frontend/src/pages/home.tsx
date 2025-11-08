import Carousel from "../components/carousel";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <section> {/* 避開 Navbar 高度 */}
        <Carousel />
      </section>

      {/* 其他內容區 */}
      <section className="py-24 flex flex-col items-center text-center">
        <h2 className="text-4xl font-bold text-[var(--color-primary)] mb-6">
          建立交易四步驟
        </h2>
        <p className="text-lg text-[var(--color-text)] max-w-2xl">
          我們結合政府憑證與零知識驗證技術，讓交易安全又隱私，打造數位信任的新標準。
        </p>
      </section>
    </div>
  );
}
