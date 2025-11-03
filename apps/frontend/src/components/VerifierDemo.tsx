// apps/frontend/src/components/VerifierDemo.tsx
import { useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { useCountdown } from '@/hooks/useCountdown'
import { usePolling } from '@/hooks/usePolling'
import CredentialQr from '@/components/CredentialQr'  

const EXPIRY = 300 // 5 分鐘

export default function VerifierDemo() {
  // ✅ 預設使用身分證 VC 代碼
  const [ref, setRef] = useState('00000000_id_card123')
  const [tx, setTx] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [authUri, setAuthUri] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)

  const left = useCountdown(
    useMemo(
      () =>
        startedAt
          ? Math.max(0, EXPIRY - Math.floor((Date.now() - startedAt) / 1000))
          : 0,
      [startedAt]
    )
  )
  const canPoll = !!tx && left > 0 && !result

  async function onGenerate() {
    setError(null)
    setResult(null)
    setTx(null)
    setQr(null)
    setAuthUri(null)
    try {
      const { data } = await api.post('/verifier/qrcode', { ref })
      setTx(data.transactionId)
      setQr(data.qrcodeImage)
      setAuthUri(data.authUri)
      setStartedAt(Date.now())
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  // ✅ 一鍵身分證登入（走新後端捷徑）
  async function onIdCardLogin() {
    setError(null)
    setResult(null)
    setTx(null)
    setQr(null)
    setAuthUri(null)
    try {
      const { data } = await api.post('/login/id-card/qrcode', {})
      setTx(data.transactionId)
      setQr(data.qrcodeImage)
      setAuthUri(data.authUri)
      setStartedAt(Date.now())
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  usePolling(
    async () => {
      if (!tx) return
      const { data } = await api.post('/verifier/result', { transactionId: tx })
      setResult(data)
    },
    3000,
    canPoll
  )

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 flex-wrap'>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder='驗證服務代碼 (ref)'
          className='border rounded px-3 py-2 w-96'
        />
        <button
          onClick={onGenerate}
          className='bg-sky-600 text-white px-4 py-2 rounded'
        >
          產生驗證 QR
        </button>

        {/* ✅ 快速選單 */}
        <button
          onClick={() => setRef('00000000_id_card123')}
          className='bg-gray-200 px-3 py-2 rounded'
        >
          使用身分證 VC 代碼
        </button>
        <button
          onClick={onIdCardLogin}
          className='bg-amber-600 text-white px-3 py-2 rounded'
        >
          一鍵用身分證登入
        </button>
      </div>

      {error && <div className='text-red-600'>錯誤：{error}</div>}

      {tx && (
        <div className='p-3 border rounded space-y-2'>
          <div>
            <b>transactionId：</b>
            <code>{tx}</code>
          </div>
          <div className='text-sm text-gray-500 truncate'>
            <b>DeepLink：</b> {authUri || '(無)'}
          </div>

          <CredentialQr qrCode={qr || undefined} deepLink={authUri || undefined} />

          <div className='mt-2 text-sm'>
            QR 有效剩餘：<b>{left}s</b>
          </div>
        </div>
      )}

      {canPoll && <div className='text-gray-600'>輪詢中…（每 3 秒）</div>}

      {result && (
        <pre className='bg-gray-50 border rounded p-3 overflow-auto max-h-96 text-sm'>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
