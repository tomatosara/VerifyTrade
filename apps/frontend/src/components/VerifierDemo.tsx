/* apps/frontend/src/components/VerifierDemo.tsx */
import { useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { useCountdown } from '@/hooks/useCountdown'
import { usePolling } from '@/hooks/usePolling'

const EXPIRY = 300 // 5 分鐘

export default function VerifierDemo() {
  /* ---------- state ---------- */
  const [ref, setRef] = useState('')
  const [tx, setTx] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [authUri, setAuthUri] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)

  /* ---------- 倒數 ---------- */
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

  /* ---------- 產生 QR ---------- */
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

  /* ---------- 輪詢結果 ---------- */
  usePolling(
    async () => {
      if (!tx) return
      const { data } = await api.post('/verifier/result', { transactionId: tx })
      setResult(data)
    },
    3000,
    canPoll
  )

  /* ---------- JSX ---------- */
  return (
    <div className='space-y-4'>
      {/* 輸入 ref 與按鈕 */}
      <div className='flex items-center gap-2'>
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
      </div>

      {/* 錯誤訊息 */}
      {error && <div className='text-red-600'>錯誤：{error}</div>}

      {/* QR 與倒數 */}
      {tx && (
        <div className='p-3 border rounded'>
          <div>
            <b>transactionId：</b>
            <code>{tx}</code>
          </div>
          <div className='text-sm text-gray-500 truncate'>
            <b>DeepLink：</b>
            {authUri || '(無)'}
          </div>
          <div className='mt-2'>
            {qr ? (
              <img src={qr} alt='QR' width={240} />
            ) : (
              <em>未回傳 QR</em>
            )}
          </div>
          <div className='mt-2 text-sm'>
            QR 有效剩餘：<b>{left}s</b>
          </div>
        </div>
      )}

      {/* 輪詢提示 */}
      {canPoll && <div className='text-gray-600'>輪詢中…（每 3 秒）</div>}

      {/* 驗證結果 */}
      {result && (
        <pre className='bg-gray-50 border rounded p-3 overflow-auto max-h-96 text-sm'>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
