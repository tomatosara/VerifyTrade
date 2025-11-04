import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { QRCode } from '@/components/ui/qr-code';
import React from "react";

export default function Login() {
  return (
    <div className="relative items-center justify-center min-h-screen bg-white overflow-hidden">
      {/* 🌈 背景特效 */}
      <FlickeringGrid  className="absolute inset-0 opacity-70" />

      {/* 🌟 登入框 */}
      <div className="relative z-10 items-center justify-center w-[80%] md:w-[320px] mx-auto mt-20">
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl text-center shadow-lg p-10 md:p-10">
          <BorderBeam
            duration={8}
            borderWidth={3}
            colorFrom="var(--color-primary)"
            colorTo="var(--color-accent)"
          />

          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-4">身分驗證登入</h1>
          <p className="text-black/80 text-sm mb-8">
            請使用數位憑證皮夾 <br/>
            掃描 QR-Code 以註冊或登入
          </p>

          {/* QR Code + 按鈕 */}
          <div className="flex flex-col items-center justify-center space-y-6 w-full">
            <QRCode value="https://www.untitledui.com/" size="lg" />
          </div>

          <p className="text-black/50 text-xs mt-8 mb-6">
            掃描 QR-Code 後將自行跳轉
          </p>
        </div>
      </div>
    </div>
  );
}
