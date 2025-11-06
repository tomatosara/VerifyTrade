import React, { useEffect, useState } from "react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { QRCode } from '@/components/ui/qr-code';
import { fetchQrCode, QrCodeResponse } from "@/api/qr";


// export async function loginVerify(token: string) {
//   const data = await api.post("/api/verify-login", { token });
//   return data;
// }

export default function Login() {
  const [qrData, setQrData] = useState<QrCodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function loadQr() {
          try {
            const data = await fetchQrCode();
            console.log('QR Data:', data);
            setQrData(data);
          } catch (err: any) {
            setError(err.message || "無法取得 QR Code");
          } finally {
            setLoading(false);
          }
        }
        loadQr();
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-white overflow-hidden">
      {/* 背景閃爍效果 */}
      <FlickeringGrid className="absolute inset-0 opacity-60" />

      {/* 登入卡片 */}
      <div className="relative z-10 w-[90%] md:w-[380px] lg:w-[420px]">
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl text-center p-10 border border-gray-100">
          <BorderBeam
            duration={8}
            borderWidth={3}
            colorFrom="var(--color-primary)"
            colorTo="var(--color-accent)"
          />

          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-5">
            身分驗證登入
          </h1>
          <p className="text-black/70 text-sm mb-8 leading-relaxed">
            請使用數位憑證皮夾 <br />
            掃描 QR-Code 以註冊或登入
          </p>

          <div className="flex flex-col items-center justify-center w-full">
            {loading && <p className="text-black/60">載入中...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {qrData && (
              <>
                {/* ✅ 放大 QR Code + 去白邊 */}
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <img
                    src={qrData.qrcodeImage}
                    alt="QR Code"
                    className="w-[220px] h-[220px] object-contain"
                  />
                </div>

                <p className="text-xs text-gray-700 mt-4">
                  交易 ID：{qrData.transactionId}
                </p>
              </>
            )}
          </div>

          <p className="text-black/50 text-xs mt-10">
            掃描 QR-Code 後將自行跳轉
          </p>
        </div>
      </div>
    </div>
  );
}
