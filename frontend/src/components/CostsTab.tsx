import { useState } from 'react'
import type { SubscriptionDto } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode } from 'lucide-react'
import SwishQrDialog from './SwishQrDialog'

interface Props {
  subscriptions: SubscriptionDto[]
  myDisplayName: string
}

interface SwishTarget {
  subscriptionName: string
  ownerDisplayName: string
  ownerSwishNumber: string | null
  amount: number
  billingCycle: string
}

function monthlyEquivalent(price: number, cycle: string) {
  return cycle === 'Yearly' ? price / 12 : price
}

function fmt(n: number) {
  return n.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function CostsTab({ subscriptions, myDisplayName }: Props) {
  const [swishTarget, setSwishTarget] = useState<SwishTarget | null>(null)

  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        No subscriptions to show costs for.
      </p>
    )
  }

  const sorted = [...subscriptions].sort(
    (a, b) => monthlyEquivalent(b.price, b.billingCycle) - monthlyEquivalent(a.price, a.billingCycle)
  )

  const totalMonthly = subscriptions.reduce(
    (sum, s) => sum + monthlyEquivalent(s.price, s.billingCycle), 0
  )
  const totalYearly = totalMonthly * 12

  const totalPerPersonMonthly = subscriptions.reduce((sum, s) => {
    const members = Math.max(s.members.length, 1)
    return sum + monthlyEquivalent(s.price, s.billingCycle) / members
  }, 0)
  const totalPerPersonYearly = totalPerPersonMonthly * 12

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="gap-0">
          <CardHeader className="pb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Group / month</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold tabular-nums">{fmt(totalMonthly)} kr</p>
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardHeader className="pb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Group / year</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold tabular-nums">{fmt(totalYearly)} kr</p>
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardHeader className="pb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Per person / month</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold tabular-nums text-primary">{fmt(totalPerPersonMonthly)} kr</p>
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardHeader className="pb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Per person / year</p>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold tabular-nums text-primary">{fmt(totalPerPersonYearly)} kr</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Subscription</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cycle</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Members</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Per person</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Total / mo</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map(sub => {
              const monthly = monthlyEquivalent(sub.price, sub.billingCycle)
              const memberCount = Math.max(sub.members.length, 1)
              const perPerson = monthly / memberCount
              return (
                <tr key={sub.id} className="bg-background hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: sub.color }}
                      >
                        {sub.name[0]?.toUpperCase()}
                      </span>
                      <span className="font-display font-bold">{sub.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="secondary" className="text-[10px]">
                      {sub.billingCycle}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      {sub.members.slice(0, 4).map(m => (
                        <span
                          key={m.memberId}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: m.avatarColor }}
                          title={m.displayName}
                        >
                          {m.displayName[0].toUpperCase()}
                        </span>
                      ))}
                      {sub.members.length > 4 && (
                        <span className="text-xs text-muted-foreground">+{sub.members.length - 4}</span>
                      )}
                      {sub.members.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="font-display px-4 py-3 text-right tabular-nums font-semibold text-primary">
                    {fmt(perPerson)} kr
                  </td>
                  <td className="font-display px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {fmt(monthly)} kr
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-muted-foreground hover:text-foreground"
                      title={`Pay ${sub.ownerDisplayName} via Swish`}
                      onClick={() => setSwishTarget({
                        subscriptionName: sub.name,
                        ownerDisplayName: sub.ownerDisplayName,
                        ownerSwishNumber: sub.ownerSwishNumber,
                        amount: perPerson,
                        billingCycle: sub.billingCycle,
                      })}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-muted/50 border-t border-border">
            <tr>
              <td colSpan={3} className="px-4 py-2.5 font-semibold">Total</td>
              <td className="font-display px-4 py-2.5 text-right tabular-nums font-semibold text-primary">
                {fmt(totalPerPersonMonthly)} kr
              </td>
              <td className="font-display px-4 py-2.5 text-right tabular-nums font-semibold">
                {fmt(totalMonthly)} kr
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <SwishQrDialog
        open={swishTarget !== null}
        onOpenChange={open => { if (!open) setSwishTarget(null) }}
        subscriptionName={swishTarget?.subscriptionName ?? ''}
        ownerDisplayName={swishTarget?.ownerDisplayName ?? ''}
        ownerSwishNumber={swishTarget?.ownerSwishNumber ?? null}
        amount={swishTarget?.amount ?? 0}
        myDisplayName={myDisplayName}
        billingCycle={swishTarget?.billingCycle ?? 'Monthly'}
      />
    </div>
  )
}
