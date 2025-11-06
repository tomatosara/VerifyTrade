// src/modules/verifier/service/verifier.service.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '@database/data-source';
import { VerificationTx } from '@modules/verifier/entity/verification-tx.entity';
import { UserEntity } from '@modules/auth/entity/user.entity';

const axiosVerifier = axios.create({ baseURL: process.env.VERIFIER_BASE });
axiosVerifier.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {};
  cfg.headers['Access-Token'] = process.env.VERIFIER_TOKEN;
  return cfg;
});

export default class VerifierService {
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
    return this.createQrcode('00000000_id_card123');
  }

  async getResult(transactionId: string) {
    const { data, status } = await axiosVerifier.post('/api/oidvp/result', { transactionId })
    const txRepo = AppDataSource.getRepository(VerificationTx)
    const userRepo = AppDataSource.getRepository(UserEntity)

    // 更新交易記錄
    await txRepo.update({ transactionId }, {
      status: status === 200 && data.verifyResult ? 'success' : 'failed',
      resultJson: data
    })

    // 若驗證失敗直接回傳
    if (status !== 200 || !data.verifyResult) {
      return {
        verifyResult: false,
        message: data.resultDescription || 'Verification failed',
      };
    }

    // 提取使用者資料
    // --- ✅ 解析回傳結構 ---
    const claims = data?.data?.[0]?.claims || [];
    const idNumber = claims.find((c: any) => c.ename === 'id_number')?.value || '';
    const name = claims.find((c: any) => c.ename === 'name')?.value || '';
    const birthday = claims.find((c: any) => c.ename === 'roc_birthday')?.value || '';

    if (!idNumber || !name) {
      return {
        verifyResult: false,
        message: 'Missing required claims (id_number, name)',
      };
    }

    // --- ✅ 檢查是否已存在該用戶 ---
    let user = await userRepo.findOne({ where: { idNumber } });

    if (!user) {
      // 新使用者 → 建立紀錄
      user = userRepo.create({
        name,
        idNumber,
        birthday,
        registeredAt: new Date(),
      });
      await userRepo.save(user);
    }

    // --- ✅ 去識別化處理 ---
    const maskedId = idNumber.replace(/^(\w{3})\w+(\w{2})$/, '$1*****$2');
    const maskedName = name.length > 1 ? name[0] + '○'.repeat(name.length - 1) : name;

    // --- ✅ 回傳前端用 ---
    return {
      verifyResult: true,
      transactionId,
      user: {
        name: maskedName,
        idNumber: maskedId,
        birthday,
      },
    };
  }
}
