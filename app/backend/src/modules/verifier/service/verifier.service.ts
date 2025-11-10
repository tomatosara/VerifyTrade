// src/modules/verifier/service/verifier.service.ts
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@database/data-source';
import { VerificationTx } from '@modules/verifier/entity/verification-tx.entity';
import { UserEntity } from '@modules/auth/entity/user.entity';

type VerifierRaw = {
  verifyResult?: boolean;
  resultDescription?: string;
  data?: Array<{
    claims?: Array<{ ename?: string; value?: string }>;
  }>;
};

export type IdClaims = {
  idNumber: string;
  name: string;
  birthday: string;
};

const axiosVerifier = axios.create({ baseURL: process.env.VERIFIER_BASE });
axiosVerifier.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {};
  cfg.headers['Access-Token'] = process.env.VERIFIER_TOKEN;
  return cfg;
});

export default class VerifierService {
  private txRepo = AppDataSource.getRepository(VerificationTx);
  private userRepo = AppDataSource.getRepository(UserEntity);

  async createQrcode(ref: string) {
    const txId = uuidv4();
    const { data } = await axiosVerifier.get('/api/oidvp/qrcode', {
      params: { ref, transactionId: txId },
    });

    await AppDataSource.getRepository(VerificationTx).insert({
      transactionId: txId,
      kind: 'verifier',
      ref,
      status: 'pending',
    });

    return { transactionId: txId, qrcodeImage: data.qrcodeImage, authUri: data.authUri };
  }

  async loginIdCardQrcode() {
    return this.createQrcode(process.env.VP_IDCARD || '00000000_id_card123');
  }

  async verifyTradeFormQrcode() {
    return this.createQrcode(process.env.VP_TRADEFORM || '00000000_transaction_verification_mult');
  }

  async getIdCardVerifyResult(transactionId: string) {
    try {
      const { data, status } = await axiosVerifier.post<VerifierRaw>(
        '/api/oidvp/result',
        { transactionId }
      );

      const ok = status === 200 && !!data?.verifyResult;

      // 如果你的欄位是 text/varchar 請用 JSON.stringify；若是 json/jsonb 可直接存 data
      await this.txRepo.update(
        { transactionId },
        {
          status: ok ? 'success' : 'failed',
          // resultJson: JSON.stringify(data),
          resultJson: data as any,
        }
      );

      if (!ok) {
        return {
          status: 'failed' as const,
          verifyResult: false,
          message: data?.resultDescription || 'Verification failed',
          transactionId,
        };
      }

      // 解析 claims
      const claims = data?.data?.[0]?.claims ?? [];
      const get = (n: string) => claims.find((c) => c?.ename === n)?.value ?? '';

      const idNumber = get('id_number');
      const name = get('name');
      const birthday = get('roc_birthday');
      const address = get('address');

      if (!idNumber || !name) {
        return {
          status: 'failed' as const,
          verifyResult: false,
          message: 'Missing required claims (id_number, name)',
          transactionId,
        };
      }

      // 取得或建立使用者
      let user = await this.userRepo.findOne({ where: { idNumber } });
      if (!user) {
        user = this.userRepo.create({
          id: uuidv4(),
          name,
          idNumber,
          birthday,
          address,
        });
        await this.userRepo.save(user);
      }

      // 去識別化
      const maskedId = idNumber.replace(/^(\w{3})\w+(\w{2})$/, '$1*****$2');
      const maskedName = name.length > 1 ? name[0] + '○'.repeat(name.length - 1) : name;

      // 前端用
      return {
        status: 'success' as const,
        verifyResult: true,
        transactionId,
        user: {
          name: maskedName,
          idNumber: maskedId,
          birthday,
        },
      }
    } catch (e) {
      const err = e as AxiosError<any>;
      const upstream = err.response?.data;

      // 👉 關鍵：把 400 轉成「驗證中或無效 transactionId」的 failed 訊息
      if (err.response) {
        return {
          status: 'failed' as const,
          verifyResult: false,
          transactionId,
          message:
            upstream?.message ||
            upstream?.error ||
            `Upstream ${err.response.status} from verifier`,
          // 你也可以把 upstream 塞進 debug 欄位
          debug: process.env.NODE_ENV !== 'production' ? upstream : undefined,
        };
      }

      // 真的沒回應（網路問題）
      return {
        status: 'failed' as const,
        verifyResult: false,
        transactionId,
        message: 'Network error calling verifier',
      };
    }
  }

  async getTradeFormVerifyResult(transactionId: string) {
    try {
      const { data, status } = await axiosVerifier.post<VerifierRaw>(
        '/api/oidvp/result',
        { transactionId }
      );

      const ok = status === 200 && !!data?.verifyResult;

      // 如果你的欄位是 text/varchar 請用 JSON.stringify；若是 json/jsonb 可直接存 data
      await this.txRepo.update(
        { transactionId },
        {
          status: ok ? 'success' : 'failed',
          // resultJson: JSON.stringify(data),
          resultJson: data as any,
        }
      );

      if (!ok) {
        return {
          status: 'failed' as const,
          verifyResult: false,
          message: data?.resultDescription || 'Verification failed',
          transactionId,
        };
      }

      // 前端用
      return {
        status: 'success' as const,
        verifyResult: true,
        transactionId,
      }
    } catch (e) {
      const err = e as AxiosError<any>;
      const upstream = err.response?.data;

      // 👉 關鍵：把 400 轉成「驗證中或無效 transactionId」的 failed 訊息
      if (err.response) {
        return {
          status: 'failed' as const,
          verifyResult: false,
          transactionId,
          message:
            upstream?.message ||
            upstream?.error ||
            `Upstream ${err.response.status} from verifier`,
          // 你也可以把 upstream 塞進 debug 欄位
          debug: process.env.NODE_ENV !== 'production' ? upstream : undefined,
        };
      }

      // 真的沒回應（網路問題）
      return {
        status: 'failed' as const,
        verifyResult: false,
        transactionId,
        message: 'Network error calling verifier',
      };
    }
  }

  /**
   * 回傳與該成功交易綁定的 user；若尚未綁定但可從 claims 推得身分，則自動建立後綁定。
   * 找不到或交易未成功 → 回 null
   */
async getClaimsByTransactionId(transactionId: string): Promise<IdClaims | null> {
    const tx = await this.txRepo.findOne({ where: { transactionId, status: 'success' } });
    if (!tx) return null;

    let json = (tx as any).resultJson;
    if (typeof json === 'string') {
      try { json = JSON.parse(json); } catch { return null; }
    }

    const claims = json?.data?.[0]?.claims ?? [];
    const pick = (ename: string) => claims.find((c: any) => c?.ename === ename)?.value;

    const idNumber = pick('id_number');
    const name     = pick('name');
    const birthday = pick('roc_birthday');

    if (!idNumber || !name) return null;

    return { idNumber, name, birthday };
  }
}
