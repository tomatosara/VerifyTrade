// apps/frontend/src/components/IssuerDemo.tsx
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

  const [body1, setBody1] = useState(`{
    "vcUid":"00000000_ttt123",
    "issuanceDate":"20251015",
    "expiredDate":"20251115",
    "fields":[{"ename":"ad_birthday","content":"20030802"}]
  }`)

  // ✅ 新增：身分證 VC 範本
  const [bodyIdCard, setBodyIdCard] = useState(`{
    "vcUid":"00000000_id_card123",
    "issuanceDate":"20251015",
    "expiredDate":"20261115",
    "fields":[
      { "ename": "name", "content": "LIN, FA-ZONG" },
      { "ename": "nationalId", "content": "A123456789" },
      { "ename": "birthYear", "content": "1999" }
    ]
  }`)

  const [resp, setResp] = useState<any>(null)
  const [error, setError] = useState<string|null>(null)

  async function onSend(path: '/issuer/qrcode-data' | '/issuer/qrcode-nodata', raw: string) {
    setError(null); setResp(null)
    try {
      const payload = JSON.parse(raw)
      const { data } = await api.post(path, payload)
      setResp(data)
    } catch (e:any) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* 原本 body */}
      <textarea
        rows={10}
        value={body}
        onChange={e => setBody(e.target.value)}
        className="w-full border rounded p-2 font-mono text-sm"
      />
      <div className="flex gap-2">
        <button onClick={() => onSend('/issuer/qrcode-data', body)} className="bg-emerald-600 text-white px-4 py-2 rounded">
          送出 /issuer/qrcode-data
        </button>
        <button onClick={() => onSend('/issuer/qrcode-nodata', body)} className="bg-indigo-600 text-white px-4 py-2 rounded">
          送出 /issuer/qrcode-nodata
        </button>
      </div>

      {/* 原本 body1 */}
      <textarea
        rows={10}
        value={body1}
        onChange={e => setBody1(e.target.value)}
        className="w-full border rounded p-2 font-mono text-sm"
      />
      <div className="flex gap-2">
        <button onClick={() => onSend('/issuer/qrcode-data', body1)} className="bg-emerald-600 text-white px-4 py-2 rounded">
          送出 /issuer/qrcode-data
        </button>
        <button onClick={() => onSend('/issuer/qrcode-nodata', body1)} className="bg-indigo-600 text-white px-4 py-2 rounded">
          送出 /issuer/qrcode-nodata
        </button>
      </div>

      {/* ✅ 身分證 VC */}
      <textarea
        rows={10}
        value={bodyIdCard}
        onChange={e => setBodyIdCard(e.target.value)}
        className="w-full border rounded p-2 font-mono text-sm"
      />
      <div className="flex gap-2">
        <button onClick={() => onSend('/issuer/qrcode-data', bodyIdCard)} className="bg-emerald-600 text-white px-4 py-2 rounded">
          送出 /issuer/qrcode-data（身分證）
        </button>
        <button onClick={() => onSend('/issuer/qrcode-nodata', bodyIdCard)} className="bg-indigo-600 text-white px-4 py-2 rounded">
          送出 /issuer/qrcode-nodata（身分證）
        </button>
      </div>

      {error && <div className="text-red-600">錯誤：{error}</div>}
      {resp && (<CredentialQr qrCode={resp.qrCode} deepLink={resp.deepLink} /> ) }
    </div>
  )
}
