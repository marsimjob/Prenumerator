import { useState, useCallback } from 'react'
import type { FeedEventType } from './useFeedHub'

export const NOTIF_TYPES: FeedEventType[] = [
  'subscription_created',
  'subscription_updated',
  'subscription_deleted',
  'member_joined',
  'member_left',
  'watcher_changed',
  'watcher_cleared',
]

export const NOTIF_LABELS: Record<FeedEventType, string> = {
  subscription_created: 'Subscription added',
  subscription_updated: 'Subscription updated',
  subscription_deleted: 'Subscription removed',
  member_joined:        'Member joined a subscription',
  member_left:          'Member left a subscription',
  watcher_changed:      'Someone started watching',
  watcher_cleared:      'Someone stopped watching',
}

const STORAGE_KEY = 'prenumerator_notif_prefs'

function load(): Set<FeedEventType> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw) as FeedEventType[])
  } catch { /* ignore */ }
  return new Set(NOTIF_TYPES)
}

export function useNotificationPrefs() {
  const [enabled, setEnabled] = useState<Set<FeedEventType>>(load)

  const toggle = useCallback((type: FeedEventType) => {
    setEnabled(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const isEnabled = useCallback((type: FeedEventType) => enabled.has(type), [enabled])

  return { enabled, toggle, isEnabled }
}
