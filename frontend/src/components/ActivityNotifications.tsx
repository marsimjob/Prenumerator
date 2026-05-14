import { useEffect, useRef, useState } from 'react'
import type { FeedEventType, FeedLogEntry } from '@/hooks/useFeedHub'
import type { GroupMemberDto } from '@/api/types'

interface NotifItem extends FeedLogEntry {
  uid: string
  visible: boolean
}

interface Props {
  notifications: FeedLogEntry[]
  members: GroupMemberDto[]
  myMemberId: string | null
  onDismiss: (uid: string) => void
}

const DISMISS_MS = 5000

function getMessage(type: FeedEventType, sub: string, who: string): string {
  switch (type) {
    case 'subscription_created': return `${who} added ${sub}`
    case 'subscription_deleted': return `${who} removed ${sub}`
    case 'subscription_updated': return `${who} updated ${sub}`
    case 'member_joined':        return `${who} joined ${sub}`
    case 'member_left':          return `${who} left ${sub}`
    case 'watcher_changed':      return `${who} started watching ${sub}`
    case 'watcher_cleared':      return `${who} stopped watching ${sub}`
  }
}

const EVENT_COLOR: Record<FeedEventType, string> = {
  subscription_created: '#FF6B00',
  subscription_deleted: '#ef4444',
  subscription_updated: '#60a5fa',
  member_joined:        '#22c55e',
  member_left:          '#f59e0b',
  watcher_changed:      '#a78bfa',
  watcher_cleared:      '#94a3b8',
}

function SingleNotification({
  item,
  members,
  myMemberId,
  onDismiss,
}: {
  item: NotifItem
  members: GroupMemberDto[]
  myMemberId: string | null
  onDismiss: () => void
}) {
  const actor  = item.actorId ? members.find(m => m.id === item.actorId) : undefined
  const isSelf = !!myMemberId && item.actorId === myMemberId
  const who    = isSelf ? 'You' : (actor?.displayName ?? 'Someone')
  const color  = EVENT_COLOR[item.type]
  const text   = getMessage(item.type, item.subscriptionName, who)

  return (
    <div
      onClick={onDismiss}
      className="notched w-[22rem] bg-card border border-border shadow-2xl cursor-pointer select-none overflow-hidden"
      style={{
        transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease',
        transform:  item.visible ? 'translateX(0)' : 'translateX(calc(100% + 3rem))',
        opacity:    item.visible ? 1 : 0,
      }}
    >
      {/* Coloured left accent */}
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: color }} />

      <div className="flex items-center gap-4 px-5 py-4 pl-6">
        {/* Avatar */}
        {actor && !isSelf ? (
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
            style={{ backgroundColor: actor.avatarColor }}
          >
            {actor.displayName[0].toUpperCase()}
          </span>
        ) : (
          <span
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}20`, border: `2px solid ${color}60` }}
          >
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
          </span>
        )}

        {/* Message */}
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-sm text-foreground leading-tight">
            {isSelf ? 'You' : (actor?.displayName ?? 'Someone')}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-snug truncate">
            {/* Strip the "You" / name prefix since it's already in the header line */}
            {text.replace(/^(You|[^ ]+) /, '')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {item.visible && (
        <div className="h-[3px]" style={{ backgroundColor: `${color}25` }}>
          <div
            key={item.uid}
            className="h-full"
            style={{
              backgroundColor: color,
              transformOrigin: 'left',
              animation: `notif-progress ${DISMISS_MS}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function ActivityNotifications({ notifications, members, myMemberId, onDismiss }: Props) {
  const [items, setItems] = useState<NotifItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (notifications.length === 0) return
    const latest = notifications[0]
    const uid    = `${latest.subscriptionId}-${latest.type}-${latest.timestamp.getTime()}`

    setItems(prev => {
      if (prev.some(i => i.uid === uid)) return prev
      return [{ ...latest, uid, visible: false }, ...prev].slice(0, 4)
    })

    setTimeout(() => {
      setItems(prev => prev.map(i => i.uid === uid ? { ...i, visible: true } : i))
    }, 16)

    const t = setTimeout(() => dismiss(uid), DISMISS_MS)
    timers.current.set(uid, t)
    // No per-notification cleanup here — the cleanup was cancelling previous
    // timers every time a new notification arrived, preventing auto-dismiss.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications])

  // Clear all pending timers only on unmount
  useEffect(() => {
    const ref = timers.current
    return () => { ref.forEach(t => clearTimeout(t)) }
  }, [])

  function dismiss(uid: string) {
    const t = timers.current.get(uid)
    if (t) { clearTimeout(t); timers.current.delete(uid) }
    setItems(prev => prev.map(i => i.uid === uid ? { ...i, visible: false } : i))
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.uid !== uid))
      onDismiss(uid)
    }, 450)
  }

  if (items.length === 0) return null

  return (
    <div className="fixed top-20 right-0 z-[200] flex flex-col gap-3 items-end">
      {items.map(item => (
        <SingleNotification
          key={item.uid}
          item={item}
          members={members}
          myMemberId={myMemberId}
          onDismiss={() => dismiss(item.uid)}
        />
      ))}
    </div>
  )
}
