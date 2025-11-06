// src/api/qr.ts
import { api } from "@/lib/api";

export interface QrCodeResponse {
  transactionId: string;
  qrcodeImage: string;
  authUri: string;
}

export async function fetchQrCode(): Promise<QrCodeResponse> {
  return api.get<QrCodeResponse>("verifier/id-card/qrcode");
}