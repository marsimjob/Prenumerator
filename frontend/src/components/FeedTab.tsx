import type { FeedLogEntry } from '@/hooks/useFeedHub'
import { Activity } from 'lucide-react'

interface Props {
  feedLog: FeedLogEntry[]
}

const EVENT_LABELS: Record<FeedLogEntry['type'], string> = {
  subscription_created: 'Subscription added',
  subscription_updated: 'Subscription updated',
  subscription_deleted: 'Subscription removed',
}

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 5)  return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

export default function FeedTab({ feedLog }: Props) {
  if (feedLog.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Activity className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No activity yet — changes made while you're on this page will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
      {feedLog.map((entry, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3 bg-background hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <span
              className={[
                'w-2 h-2 rounded-full shrink-0',
                entry.type === 'subscription_created' ? 'bg-primary' :
                entry.type === 'subscription_deleted' ? 'bg-destructive' :
                'bg-blue-400',
              ].join(' ')}
            />
            <div>
              <p className="text-sm font-medium">{EVENT_LABELS[entry.type]}</p>
              <p className="text-xs text-muted-foreground font-mono">{entry.subscriptionId}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 ml-4">{timeAgo(entry.timestamp)}</span>
        </div>
      ))}
    </div>
  )
}
