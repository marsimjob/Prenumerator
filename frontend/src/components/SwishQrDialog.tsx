import { QRCode } from 'react-qr-code'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionName: string
  ownerDisplayName: string
  ownerSwishNumber: string | null
  amount: number
  myDisplayName: string
  billingCycle: string
}

const MONTHS = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec']

function toSwishNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('46')) return digits
  if (digits.startsWith('0')) return '46' + digits.slice(1)
  return digits
}

function buildSwishUrl(phone: string, amount: number, message: string): string {
  const data = JSON.stringify({
    version: 1,
    payee: { value: toSwishNumber(phone), editable: false },
    amount: { value: Math.round(amount), editable: false },
    message: { value: message.slice(0, 50), editable: false },
  })
  return `swish://payment?data=${encodeURIComponent(data)}`
}

function fmt(n: number) {
  return n.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function SwishQrDialog({
  open,
  onOpenChange,
  subscriptionName,
  ownerDisplayName,
  ownerSwishNumber,
  amount,
  myDisplayName,
  billingCycle,
}: Props) {
  const now = new Date()
  const periodLabel = billingCycle === 'Yearly'
    ? `${now.getFullYear()}`
    : `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  const message = `${subscriptionName} ${periodLabel} ${myDisplayName}`
  const swishUrl = ownerSwishNumber ? buildSwishUrl(ownerSwishNumber, amount, message) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Pay via Swish</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            />
            <span className="font-medium">{subscriptionName}</span>
          </div>

          <div className="text-sm text-muted-foreground">
            To <span className="font-semibold text-foreground">{ownerDisplayName}</span>
          </div>

          <div className="font-display text-3xl font-bold tabular-nums">
            {fmt(amount)} <span className="text-lg font-normal text-muted-foreground">kr</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Message: <span className="font-mono">{message}</span>
          </p>

          {swishUrl ? (
            <>
              <div className="bg-white p-4 rounded-xl">
                <QRCode value={swishUrl} size={180} />
              </div>
              <p className="text-xs text-muted-foreground">
                Scan with your phone's Swish app
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
              {ownerDisplayName} hasn't set their Swish number yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
