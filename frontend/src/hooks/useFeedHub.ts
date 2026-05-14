import { useEffect, useRef, useState } from 'react'
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { subscriptionsApi } from '@/api/subscriptions'

const HUB_URL = `${import.meta.env.VITE_API_URL ?? ''}/hubs/feed`

const GROUP_EVENTS = [
  'subscription_created',
  'subscription_updated',
  'subscription_deleted',
  'member_joined',
  'member_left',
  'watcher_changed',
  'watcher_cleared',
] as const

export type FeedEventType = typeof GROUP_EVENTS[number]

export interface FeedLogEntry {
  type: FeedEventType
  subscriptionId: string
  subscriptionName: string
  actorId?: string
  timestamp: Date
}

interface GroupEventPayload {
  id: string
  groupId: string
  name?: string
  actorId?: string
}

interface WatchRequestedPayload {
  subscriptionId: string
  subscriptionName: string
  requestorMemberId: string
  requestorName: string
}

interface WatchResolvedPayload {
  subscriptionId: string
  subscriptionName: string
}

export function useFeedHub(
  groupId: string | undefined,
  myMemberId: string | null,
  onNotify?: (entry: FeedLogEntry) => void,
): FeedLogEntry[] {
  const qc = useQueryClient()
  const [feedLog, setFeedLog] = useState<FeedLogEntry[]>([])
  const onNotifyRef = useRef(onNotify)
  onNotifyRef.current = onNotify

  useEffect(() => {
    if (!groupId) return

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    for (const eventType of GROUP_EVENTS) {
      connection.on(eventType, (payload: GroupEventPayload) => {
        void qc.invalidateQueries({ queryKey: ['subscriptions', groupId] })

        const entry: FeedLogEntry = {
          type: eventType,
          subscriptionId: payload.id,
          subscriptionName: payload.name ?? payload.id,
          actorId: payload.actorId,
          timestamp: new Date(),
        }

        setFeedLog(prev => [entry, ...prev].slice(0, 50))
        onNotifyRef.current?.(entry)
      })
    }

    connection.on('watch_requested', (payload: WatchRequestedPayload) => {
      toast(`${payload.requestorName} wants to watch ${payload.subscriptionName}`, {
        duration: Infinity,
        action: {
          label: 'Accept',
          onClick: () => {
            void subscriptionsApi
              .resolveWatch(payload.subscriptionId, payload.requestorMemberId, true)
              .then(() => qc.invalidateQueries({ queryKey: ['subscriptions', groupId] }))
          },
        },
        cancel: {
          label: 'Decline',
          onClick: () => {
            void subscriptionsApi.resolveWatch(
              payload.subscriptionId, payload.requestorMemberId, false
            )
          },
        },
      })
    })

    connection.on('watch_accepted', (payload: WatchResolvedPayload) => {
      toast.success(`You're now watching ${payload.subscriptionName}`)
      void qc.invalidateQueries({ queryKey: ['subscriptions', groupId] })
    })

    connection.on('watch_declined', (payload: WatchResolvedPayload) => {
      toast.error(`Your request to watch ${payload.subscriptionName} was declined`)
    })

    connection
      .start()
      .then(async () => {
        if (connection.state !== HubConnectionState.Connected) return
        await connection.invoke('JoinGroup', groupId)
        if (myMemberId) {
          await connection.invoke('JoinMemberChannel', myMemberId)
        }
      })
      .catch(console.error)

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        const cleanup = myMemberId
          ? connection.invoke('LeaveMemberChannel', myMemberId).catch(() => undefined)
          : Promise.resolve()
        void cleanup
          .then(() => connection.invoke('LeaveGroup', groupId).catch(() => undefined))
          .finally(() => { void connection.stop() })
      } else {
        void connection.stop()
      }
    }
  }, [groupId, myMemberId, qc])

  return feedLog
}
