// src/components/CredentialQr.tsx
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'

interface Props {
  qrCode: string            // data:image/png;base64,...
  deepLink?: string         // 可選：deeplink 做複製用
  size?: number             // 預設 240px
}

export default function CredentialQr({ qrCode, deepLink, size = 240 }: Props) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    if (!deepLink) return
    await navigator.clipboard.writeText(deepLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <Card className="w-fit">
      <CardContent className="p-4 flex flex-col items-center space-y-3">
        <img src={qrCode} alt="QR code" width={size} />
        {deepLink && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onCopy}
            className="gap-1"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已複製' : '複製 DeepLink'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
