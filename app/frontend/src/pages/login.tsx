import React, { useEffect, useState, useRef } from "react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { QRCode } from '@/components/ui/qr-code';
import { fetchQrCode, fetchVerifierResult } from "@/api/qr";
import { api, setAccessToken } from "@/api/client";
import type { QrCodeResponse, VerifierResultResponse, UserProfile } from '@/types/verifier';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [qrData, setQrData] = useState<QrCodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pollerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  // 1) 掛載後取 QR
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchQrCode();
        console.log('[QR] fetching...', data);
        setQrData(data);
      } catch (err: any) {
        setError(err?.message || '無法取得 QR Code');
      } finally {
        setLoading(false);
      }
    })();
    if (pollerRef.current) clearInterval(pollerRef.current);
  }, []);

  // 2️⃣ 每 3 秒輪詢查結果
  useEffect(() => {
    if (!qrData?.transactionId) return;

    // 清除舊的 interval
    if (pollerRef.current) clearInterval(pollerRef.current);

    pollerRef.current = window.setInterval(async () => {
      try {
        const result: VerifierResultResponse = await fetchVerifierResult(qrData.transactionId);

        if (result.status === "success" && result.verifyResult) {
          console.log("[POLL] ✅ Verified! Stopping poller.");
          clearInterval(pollerRef.current!);
          pollerRef.current = null;
          alert(`歡迎 ${result.user?.name ?? result.user?.idNumber ?? ""} 登入成功！`);

          // 🔑 第三步：向後端換 JWT
          const { accessToken } = await api.post<{ accessToken: string }>(
            "/auth/login-by-verifier",
            { transactionId: qrData.transactionId }
          );
          console.log("[POLL] Received Access Token:", accessToken);
          // 設定 Access Token（存在記憶體，之後自動夾帶）
          setAccessToken(accessToken);

          // 🔑 第四步：拿 profile
          const me: UserProfile = await api.get<UserProfile>('/auth/me');
          setProfile(me);
          setIsAuthenticated(true);

          // ✅ 登入後想導向其他頁面
          navigate('/');
        }
      } catch (err) {
        console.error("[POLL] ❌ Error:", err);
      }
    }, 3000);

    // 卸載或重新啟動時清除 interval
    return () => {
      console.log("[POLL] Cleanup polling");
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [qrData?.transactionId]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-white overflow-hidden">
      <FlickeringGrid className="absolute inset-0 opacity-60" />

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
                {/* 你如果拿到的是「圖片 URL」 */}
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <img
                    src={qrData.qrcodeImage}
                    alt="QR Code"
                    className="w-[220px] h-[220px] object-contain"
                  />
                </div>

                {/* 如果後端回傳的是 QR 原文（例如 qrcodeText），想用自家 <QRCode/> 元件： */}
                {/* <div className="p-2 bg-white rounded-xl shadow-sm">
                  <QRCode value={qrData.qrcodeText} size={220} />
                </div> */}

                <p className="text-xs text-gray-700 mt-4">
                  交易 ID：{qrData.transactionId}
                </p>
              </>
            )}
          </div>

          <p className="text-black/50 text-xs mt-10">
            掃描 QR-Code 後將自動完成登入
          </p>
        </div>
      </div>
    </div>
  );
}
