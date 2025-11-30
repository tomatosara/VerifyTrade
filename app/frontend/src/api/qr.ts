// src/api/qr.ts
import { api } from "@/api/client";
import type { QrCodeResponse, VerifierResultResponse } from '@/types/verifier';

export async function fetchLoginQrCode(): Promise<QrCodeResponse> {
  return api.get<QrCodeResponse>("/verifier/id-card/qrcode", undefined, false);
}

export async function fetchTradeFormQrCode(): Promise<QrCodeResponse> {
  return api.get<QrCodeResponse>("/verifier/trade-form/qrcode", undefined, false);
}

export async function fetchIdCardVerifierResult(transactionId: string): Promise<VerifierResultResponse> {
  const data = await api.post<VerifierResultResponse>('/verifier/id-card/result', { transactionId }, false);
  return data;
}

export async function fetchTradeFormVerifierResult(transactionId: string): Promise<VerifierResultResponse> {
  const data = await api.post<VerifierResultResponse>('/verifier/trade-form/result', { transactionId }, false);
  return data;
}
