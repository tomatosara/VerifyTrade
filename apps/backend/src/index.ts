// apps/backend/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet, { crossOriginResourcePolicy } from 'helmet'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

import { VerifierQrcodeRequest, VerifierResultRequest } from '@zkp/shared/verifier'
import { IssuerQrcodeDataRequest, IssuerQrcodeNoDataRequest } from '@zkp/shared/issuer'

const app = express()
const prisma = new PrismaClient()

// ---------- 基礎中介層 ----------
app.use(express.json({ limit: '1mb' }))
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || true }))
app.use(helmet())
app.use(morgan('combined'))
app.use(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_PER_HOUR) || 3600,
    standardHeaders: true
  })
)

// ---------- 外部 API client（自動帶 Bearer） ----------
const axiosVerifier = axios.create({ baseURL: process.env.VERIFIER_BASE })
axiosVerifier.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {}
  cfg.headers['Access-Token'] = process.env.VERIFIER_TOKEN
  return cfg
})

const axiosIssuer = axios.create({ baseURL: process.env.ISSUER_BASE })
axiosIssuer.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers ?? {}
  cfg.headers['Access-Token'] = process.env.ISSUER_TOKEN
  return cfg
})

// ---------- 健康檢查 ----------
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() })
})


// ✅ 允許的 VC 代碼（白名單）
const ALLOWED_REFS = new Set(
  (process.env.ALLOWED_REFS?.split(',') ?? [
    '00000000_ttt123',
    '00000000_fff123',
    '00000000_id_card123',   // ⬅️ 身分證 VC
  ]).map((s) => s.trim())
);

// 小工具：共用產 QR 程式
async function generateVerifierQrcodeByRef(ref: string) {
  if (!ALLOWED_REFS.has(ref)) {
    const err: any = new Error(`ref ${ref} not allowed`);
    err.status = 400;
    throw err;
  }
  const transactionId = uuidv4();
  const url = `/api/oidvp/qrcode?ref=${encodeURIComponent(ref)}&transactionId=${encodeURIComponent(transactionId)}`;
  const { data } = await axiosVerifier.get(url);

  await prisma.verificationTx.create({
    data: { transactionId, kind: 'verifier', ref, status: 'pending' }
  });

  return { transactionId, qrcodeImage: data?.qrcodeImage, authUri: data?.authUri };
}


// ========== 驗證端：產生 QR ==========
// 原本的
app.post('/verifier/qrcode', async (req, res) => {
  const parsed = VerifierQrcodeRequest.safeParse(req.body)
  console.log('Parsed Result:', parsed);
  if (!parsed.success) return res.status(400).json({ code: 400, message: 'Invalid body' })
  const { ref } = parsed.data

  try {
    const payload = await generateVerifierQrcodeByRef(ref);
    return res.status(201).json(payload);
  } catch (e: any) {
    const status = e.status || 500;
    return res.status(status).json({ code: String(status), message: e.message });
  }
})

// ✅ 新增：身分證登入專用捷徑
app.post('/login/id-card/qrcode', async (_req, res) => {
  try {
    const payload = await generateVerifierQrcodeByRef('00000000_id_card123');
    return res.status(201).json(payload);
  } catch (e: any) {
    const status = e.status || 500;
    return res.status(status).json({ code: String(status), message: e.message });
  }
})

// ========== 驗證端：查結果 ==========
app.post('/verifier/result', async (req, res) => {
  const parsed = VerifierResultRequest.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ code: 400, message: 'Invalid body' })
  const { transactionId } = parsed.data

  try {
    const { data, status } = await axiosVerifier.post('/api/oidvp/result', { transactionId })
    if (status === 200) {
      await prisma.verificationTx.update({
        where: { transactionId },
        data: { status: 'success', resultJson: data }
      })
      return res.json(data)
    }
    return res.status(status).json(data)
  } catch (err: any) {
    const status = err?.response?.status || 500
    const message = err?.response?.data?.message || err.message
    await prisma.verificationTx.update({
      where: { transactionId },
      data: { status: 'failed', resultJson: { message } }
    })
    return res.status(status).json({ code: String(status), message })
  }
})

// ========== 發行端：有個資 QR ==========
app.post('/issuer/qrcode-data', async (req, res) => {
  const parsed = IssuerQrcodeDataRequest.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ code: 400, message: 'Invalid body' })
  const { data } = await axiosIssuer.post('/api/qrcode/data', parsed.data)
  return res.status(201).json(data)
})

// ========== 發行端：無個資 QR ==========
app.post('/issuer/qrcode-nodata', async (req, res) => {
  const parsed = IssuerQrcodeNoDataRequest.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ code: 400, message: 'Invalid body' })
  const { data } = await axiosIssuer.post('/api/qrcode/nodata', parsed.data)
  return res.status(201).json(data)
})

// ---------- 全域錯誤（最後一道） ----------
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ code: '500', message: 'Internal Server Error' })
})

// ---------- 啟動 ----------
const port = Number(process.env.PORT) || 4000
app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${port}`)
})
