import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import React, { useState } from "react";
import { PinInput } from "@/components/ui/pin-input";

export default function Open() {
  const [code, setCode] = useState("");


  return (
    <div className="relative flex items-center justify-center min-h-screen bg-white overflow-hidden">
      {/* 🌈 背景特效 */}
      <FlickeringGrid className="absolute inset-0 opacity-70" />

      {/* 🌟 外框：響應式往上移 */}
      <div className="relative z-10 w-[90%] md:w-[600px] mx-auto transform -translate-y-20 md:-translate-y-6">
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl text-center shadow-lg p-8 md:p-10 overflow-hidden">
          <BorderBeam
            duration={8}
            borderWidth={3}
            colorFrom="var(--color-primary)"
            colorTo="var(--color-accent)"
          />

          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-4">
            交易序號
          </h1>
          <p className="text-black/80 text-sm mb-8">請輸入 8 碼交易序號</p>

          {/* 🔢 輸入框 */}
          <PinInput size="sm" className="w-full">
            <PinInput.Group
              maxLength={8}
              value={code}
              onChange={(val: string) => {
                setCode(val);
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <PinInput.Slot
                  key={i}
                  index={i}
                  className="min-w-0 w-full h-10 sm:h-11 md:h-15 focus:outline-none bg-white/80 transition-all"
                />
              ))}
            </PinInput.Group>
          </PinInput>

          {/* ✅ 確認按鈕 */}
          <InteractiveHoverButton
            onClick={() => alert(`交易序號：${code}`)}
            disabled={code.length !== 8}
            className={`w-40 md:w-48 py-3 mt-2 md:mt-8 rounded-full font-semibold border-none transition
    ${code.length === 8
                ? "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            確認
          </InteractiveHoverButton>

        </div>
      </div>
    </div >
  );
}
