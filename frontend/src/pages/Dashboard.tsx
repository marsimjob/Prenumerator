import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, PackageOpen, LayoutGrid, TrendingUp, KeyRound, Activity, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupsApi } from '@/api/groups'
import { subscriptionsApi } from '@/api/subscriptions'
import type { SubscriptionDto } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SubscriptionCard from '@/components/SubscriptionCard'
import AddSubscriptionDialog from '@/components/AddSubscriptionDialog'
import ConfirmWatchDialog from '@/components/ConfirmWatchDialog'
import CostsTab from '@/components/CostsTab'
import CredentialsTab from '@/components/CredentialsTab'
import FeedTab from '@/components/FeedTab'
import { useFeedHub } from '@/hooks/useFeedHub'

const TAB_ITEMS = [
  { value: 'subscriptions', label: 'Subs',  Icon: LayoutGrid },
  { value: 'costs',         label: 'Costs', Icon: TrendingUp },
  { value: 'credentials',   label: 'Keys',  Icon: KeyRound },
  { value: 'feed',          label: 'Feed',  Icon: Activity },
] as const

type TabValue = typeof TAB_ITEMS[number]['value']

interface ConfirmWatchState {
  subscriptionId: string
  subscriptionName: string
  memberId: string
  currentWatcherName: string
}

export default function Dashboard() {
  const { groupId } = useParams<{ groupId: string }>()
  const [tab, setTab] = useState<TabValue>('subscriptions')
  const [addOpen, setAddOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmWatch, setConfirmWatch] = useState<ConfirmWatchState | null>(null)
  const qc = useQueryClient()

  const myMemberId = groupId
    ? (localStorage.getItem(`prenumerator_member_${groupId}`) ?? null)
    : null

  const feedLog = useFeedHub(groupId, myMemberId)

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.get(groupId!),
    enabled: !!groupId,
  })

  const { data: subscriptions, isLoading, isError } = useQuery({
    queryKey: ['subscriptions', groupId],
    queryFn: () => subscriptionsApi.listByGroup(groupId!),
    enabled: !!groupId,
  })

  useEffect(() => {
    if (isError) toast.error('Failed to load subscriptions')
  }, [isError])

  // Exclusive mode: claim the single active slot
  const claimExclusive = useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      subscriptionsApi.setActiveUser(id, { memberId }),
    onMutate: async ({ id, memberId }) => {
      await qc.cancelQueries({ queryKey: ['subscriptions', groupId] })
      const prev = qc.getQueryData<SubscriptionDto[]>(['subscriptions', groupId])
      qc.setQueryData<SubscriptionDto[]>(['subscriptions', groupId], old =>
        old?.map(s => s.id === id ? { ...s, activeMemberIds: [memberId] } : s)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['subscriptions', groupId], ctx?.prev)
      toast.error('Failed to claim slot')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['subscriptions', groupId] }),
  })

  // Shared mode: toggle your own active status
  const toggleShared = useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      subscriptionsApi.toggleSharedWatcher(id, memberId),
    onMutate: async ({ id, memberId }) => {
      await qc.cancelQueries({ queryKey: ['subscriptions', groupId] })
      const prev = qc.getQueryData<SubscriptionDto[]>(['subscriptions', groupId])
      qc.setQueryData<SubscriptionDto[]>(['subscriptions', groupId], old =>
        old?.map(s => {
          if (s.id !== id) return s
          const isActive = s.activeMemberIds.includes(memberId)
          return {
            ...s,
            activeMemberIds: isActive
              ? s.activeMemberIds.filter(m => m !== memberId)
              : [...s.activeMemberIds, memberId],
          }
        })
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['subscriptions', groupId], ctx?.prev)
      toast.error('Failed to update watcher status')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['subscriptions', groupId] }),
  })

  const joinSubscription = useMutation({
    mutationFn: (subscriptionId: string) =>
      subscriptionsApi.addMember(subscriptionId, myMemberId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions', groupId] }),
    onError: () => toast.error('Failed to join subscription'),
  })

  // Shared mode: toggle your own chip
  function handleChipClick(sub: SubscriptionDto, memberId: string) {
    if (!myMemberId || memberId !== myMemberId || sub.watchMode !== 'Shared') return
    toggleShared.mutate({ id: sub.id, memberId })
  }

  // Exclusive mode: "Watch now" button
  function handleWatchNow(sub: SubscriptionDto) {
    if (!myMemberId) return
    const currentActive = sub.activeMemberIds[0]
    if (!currentActive) {
      // Slot is free — claim directly
      claimExclusive.mutate({ id: sub.id, memberId: myMemberId })
    } else {
      // Someone else is watching — ask to replace
      const watcher = sub.members.find(m => m.memberId === currentActive)
      setConfirmWatch({
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        memberId: myMemberId,
        currentWatcherName: watcher?.displayName ?? 'Someone',
      })
    }
  }

  function handleAddSuccess() {
    void qc.invalidateQueries({ queryKey: ['subscriptions', groupId] })
    setAddOpen(false)
  }

  function copyInviteCode() {
    if (!group) return
    void navigator.clipboard.writeText(group.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const subs = subscriptions ?? []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt=""
              className="h-7 w-auto"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <span className="font-extrabold text-foreground tracking-tight hidden sm:inline text-sm">
              Prenumerator
            </span>
          </div>
          <span className="text-border hidden sm:inline">│</span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate text-sm md:text-base leading-tight">
              {group?.name ?? '…'}
            </p>
            {group && (
              <button
                type="button"
                onClick={copyInviteCode}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="font-mono tracking-wider">{group.inviteCode}</span>
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
          <Plus />
          <span className="hidden md:inline">Add subscription</span>
        </Button>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
        <Tabs value={tab} onValueChange={v => setTab(v as TabValue)}>
          <TabsList className="hidden md:inline-flex mb-6">
            {TAB_ITEMS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="relative">
                {label}
                {value === 'feed' && feedLog.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center leading-none">
                    {feedLog.length > 9 ? '9+' : feedLog.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="subscriptions">
            {isLoading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
              </div>
            )}
            {!isLoading && subs.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-20 text-center">
                <PackageOpen className="w-14 h-14 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium text-foreground">No subscriptions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first shared subscription to get started.</p>
                </div>
                <Button onClick={() => setAddOpen(true)}><Plus /> Add subscription</Button>
              </div>
            )}
            {subs.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {subs.map(sub => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    myMemberId={myMemberId}
                    onChipClick={memberId => handleChipClick(sub, memberId)}
                    onWatch={() => handleWatchNow(sub)}
                    onJoin={() => joinSubscription.mutate(sub.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="costs">
            {isLoading
              ? <div className="flex flex-col gap-4"><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
              : <CostsTab subscriptions={subs} />
            }
          </TabsContent>

          <TabsContent value="credentials">
            {isLoading
              ? <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
              : <CredentialsTab subscriptions={subs} myMemberId={myMemberId} />
            }
          </TabsContent>

          <TabsContent value="feed">
            <FeedTab feedLog={feedLog} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex md:hidden h-16 border-t border-border bg-background">
        {TAB_ITEMS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
              tab === value ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon className={cn('w-5 h-5', tab === value && 'text-primary')} />
            {label}
            {value === 'feed' && feedLog.length > 0 && (
              <span className="absolute top-2 right-[calc(50%-14px)] rounded-full bg-primary text-primary-foreground text-[9px] w-3.5 h-3.5 flex items-center justify-center leading-none">
                {feedLog.length > 9 ? '9+' : feedLog.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      <AddSubscriptionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        groupId={groupId!}
        members={group?.members ?? []}
        myMemberId={myMemberId}
        onSuccess={handleAddSuccess}
      />

      <ConfirmWatchDialog
        open={!!confirmWatch}
        subscriptionName={confirmWatch?.subscriptionName ?? ''}
        currentWatcherName={confirmWatch?.currentWatcherName ?? ''}
        onConfirm={() => {
          if (confirmWatch) claimExclusive.mutate({ id: confirmWatch.subscriptionId, memberId: confirmWatch.memberId })
          setConfirmWatch(null)
        }}
        onCancel={() => setConfirmWatch(null)}
      />
    </div>
  )
}
