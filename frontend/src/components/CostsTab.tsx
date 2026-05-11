import type { SubscriptionDto } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Props {
  subscriptions: SubscriptionDto[]
}

function monthlyEquivalent(price: number, cycle: string) {
  return cycle === 'Yearly' ? price / 12 : price
}

function fmt(n: number) {
  return n.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function CostsTab({ subscriptions }: Props) {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="gap-0">
          <CardHeader className="pb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly total</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{fmt(totalMonthly)} kr</p>
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardHeader className="pb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Yearly total</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{fmt(totalYearly)} kr</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown table — scrollable on small screens */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[400px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Subscription</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cycle</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">/month</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">/year</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map(sub => {
              const monthly = monthlyEquivalent(sub.price, sub.billingCycle)
              const yearly = monthly * 12
              return (
                <tr key={sub.id} className="bg-background hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{sub.name}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="secondary" className="text-[10px]">
                      {sub.billingCycle}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {fmt(monthly)} kr
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {fmt(yearly)} kr
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-muted/50 border-t border-border">
            <tr>
              <td colSpan={2} className="px-4 py-2.5 font-semibold">Total</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{fmt(totalMonthly)} kr</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{fmt(totalYearly)} kr</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
