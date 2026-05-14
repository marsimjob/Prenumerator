import type { FeedEventType, FeedLogEntry } from '@/hooks/useFeedHub'
import type { GroupMemberDto } from '@/api/types'
import { Activity } from 'lucide-react'

interface Props {
  feedLog: FeedLogEntry[]
  members: GroupMemberDto[]
}

const EVENT_LABELS: Record<FeedEventType, string> = {
  subscription_created: 'Subscription added',
  subscription_updated: 'Subscription updated',
  subscription_deleted: 'Subscription removed',
  member_joined:        'Member joined',
  member_left:          'Member left',
  watcher_changed:      'Started watching',
  watcher_cleared:      'Stopped watching',
}

const EVENT_DOT: Record<FeedEventType, string> = {
  subscription_created: 'bg-primary',
  subscription_deleted: 'bg-destructive',
  subscription_updated: 'bg-blue-400',
  member_joined:        'bg-green-500',
  member_left:          'bg-amber-500',
  watcher_changed:      'bg-violet-500',
  watcher_cleared:      'bg-slate-400',
}

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 5)  return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

export default function FeedTab({ feedLog, members }: Props) {
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
      {feedLog.map((entry, i) => {
        const actor = entry.actorId ? members.find(m => m.id === entry.actorId) : undefined
        return (
          <div key={i} className="flex items-center justify-between px-4 py-3 bg-background hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              {actor ? (
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: actor.avatarColor }}
                >
                  {actor.displayName[0].toUpperCase()}
                </span>
              ) : (
                <span className={`w-2 h-2 rounded-full shrink-0 ${EVENT_DOT[entry.type]}`} />
              )}
              <div>
                <p className="text-sm font-medium">{EVENT_LABELS[entry.type]}</p>
                <p className="text-xs text-muted-foreground">
                  {actor ? `${actor.displayName} · ` : ''}{entry.subscriptionName}
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-4">{timeAgo(entry.timestamp)}</span>
          </div>
        )
      })}
    </div>
  )
}
