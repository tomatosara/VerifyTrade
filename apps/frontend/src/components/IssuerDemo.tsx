/* apps/frontend/src/components/IssuerDemo.tsx */
import { useState } from 'react'
import { api } from '@/lib/api'
import CredentialQr from './CredentialQr'

export default function IssuerDemo() {
  const [body, setBody] = useState(`{
  "vcUid":"00000000_fff123",
  "issuanceDate":"20251015",
  "expiredDate":"20251115",
  "fields":[{"ename":"name","content":"asdsad"}]
}`)

// const [body, setBody] = useState(`{
//   "vcUid":"00000000_ttt123",
//   "issuanceDate":"20251015",
//   "expiredDate":"20251115",
//   "fields":[{"ename":"ad_birthday","content":"20030802"}]
// }`)
  const [resp, setResp] = useState<any>(null)
  const [error, setError] = useState<string|null>(null)

  async function onSend(path: '/issuer/qrcode-data' | '/issuer/qrcode-nodata') {
    setError(null); setResp(null)
    try {
      const payload = JSON.parse(body)
      const { data } = await api.post(path, payload)
      setResp(data)
    } catch (e:any) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        rows={10}
        value={body}
        onChange={e => setBody(e.target.value)}
        className="w-full border rounded p-2 font-mono text-sm"
      />

      <div className="flex gap-2">
        <button
          onClick={() => onSend('/issuer/qrcode-data')}
          className="bg-emerald-600 text-white px-4 py-2 rounded"
        >
          送出 /issuer/qrcode-data
        </button>
        <button
          onClick={() => onSend('/issuer/qrcode-nodata')}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          送出 /issuer/qrcode-nodata
        </button>
      </div>

      {error && <div className="text-red-600">錯誤：{error}</div>}
      {/* {resp && (
        <pre className="bg-gray-50 border rounded p-3 overflow-auto max-h-96 text-sm">
          {JSON.stringify(resp,null,2)}
        </pre>
      )} */}
      {resp && (
  <CredentialQr qrCode={resp.qrCode} deepLink={resp.deepLink} />
)}
    </div>
  )
}
