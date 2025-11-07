export interface QrCodeResponse {
  transactionId: string;
  qrcodeImage: string;
  authUri: string;
}

export interface VerifierResultResponse {
  status: 'success' | 'failed';
  verifyResult: boolean;
  transactionId: string;
  message?: string;
  user?: {
    name: string;
    idNumber: string;   
    birthday?: string;
  };
}

export interface UserProfile {
  sub: string;
  idNumber: string;
  name: string;
  role: string;
  birthday: string;
}