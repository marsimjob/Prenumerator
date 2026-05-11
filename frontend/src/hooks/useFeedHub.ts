import { useEffect, useState } from 'react'
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
] as const

export type FeedEventType = typeof GROUP_EVENTS[number]

export interface FeedLogEntry {
  type: FeedEventType
  subscriptionId: string
  timestamp: Date
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
): FeedLogEntry[] {
  const qc = useQueryClient()
  const [feedLog, setFeedLog] = useState<FeedLogEntry[]>([])

  useEffect(() => {
    if (!groupId) return

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    // Group-level events → invalidate subscriptions query + append to feed log
    for (const eventType of GROUP_EVENTS) {
      connection.on(eventType, (payload: { id: string }) => {
        void qc.invalidateQueries({ queryKey: ['subscriptions', groupId] })
        setFeedLog(prev =>
          [{ type: eventType, subscriptionId: payload.id, timestamp: new Date() }, ...prev].slice(0, 50)
        )
      })
    }

    // Member-targeted: someone wants to take your spot
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

    // Member-targeted: your watch request was accepted
    connection.on('watch_accepted', (payload: WatchResolvedPayload) => {
      toast.success(`You're now watching ${payload.subscriptionName}`)
      void qc.invalidateQueries({ queryKey: ['subscriptions', groupId] })
    })

    // Member-targeted: your watch request was declined
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
