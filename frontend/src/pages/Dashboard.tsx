import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, PackageOpen, LayoutGrid, TrendingUp, KeyRound, Activity, Copy, Check, Bell, UserRound, LogOut, Phone, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupsApi } from '@/api/groups'
import { subscriptionsApi } from '@/api/subscriptions'
import { authApi } from '@/api/auth'
import type { SubscriptionDto } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import SubscriptionCard from '@/components/SubscriptionCard'
import AddSubscriptionDialog from '@/components/AddSubscriptionDialog'
import ConfirmWatchDialog from '@/components/ConfirmWatchDialog'
import CostsTab from '@/components/CostsTab'
import CredentialsTab from '@/components/CredentialsTab'
import FeedTab from '@/components/FeedTab'
import ActivityNotifications from '@/components/ActivityNotifications'
import { useFeedHub, type FeedLogEntry } from '@/hooks/useFeedHub'
import { useNotificationPrefs, NOTIF_TYPES, NOTIF_LABELS } from '@/hooks/useNotificationPrefs'
import { useAccount } from '@/hooks/useAccount'
import type { SavedGroup } from '@/hooks/useSavedGroups'

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
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabValue>('subscriptions')
  const [addOpen, setAddOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmWatch, setConfirmWatch] = useState<ConfirmWatchState | null>(null)
  const [pendingNotifs, setPendingNotifs] = useState<FeedLogEntry[]>([])
  const [phonePending, setPhonePending] = useState(false)
  const [renamingGroup, setRenamingGroup]       = useState(false)
  const [groupNameInput, setGroupNameInput]     = useState('')
  const [groupRenamePending, setGroupRenamePending] = useState(false)
  const qc = useQueryClient()

  const { account, updatePhone, clearAccount } = useAccount()
  const [phoneInput, setPhoneInput] = useState(() => account?.phoneNumber ?? '')
  const { isEnabled, toggle } = useNotificationPrefs()

  const isGroupCreator = (() => {
    if (!account?.userId || !groupId) return false
    try {
      const saved: SavedGroup[] = JSON.parse(localStorage.getItem(`prenumerator_groups_${account.userId}`) ?? '[]')
      return saved.find(g => g.groupId === groupId)?.isCreator === true
    } catch { return false }
  })()

  const myMemberId = groupId
    ? (localStorage.getItem(`prenumerator_member_${groupId}`) ?? null)
    : null

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault()
    if (!account) return
    setPhonePending(true)
    try {
      await authApi.updatePhone(account.userId, phoneInput.trim() || null)
      updatePhone(phoneInput.trim() || null)
      await qc.invalidateQueries({ queryKey: ['subscriptions', groupId] })
      toast.success('Swish number saved')
    } catch {
      toast.error('Failed to save phone number')
    } finally {
      setPhonePending(false)
    }
  }

  function handleLogout() {
    clearAccount()
    navigate('/')
  }

  async function handleRenameGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!account || !groupId || !groupNameInput.trim()) { setRenamingGroup(false); return }
    setGroupRenamePending(true)
    try {
      await groupsApi.rename(groupId, account.userId, groupNameInput.trim())
      await qc.invalidateQueries({ queryKey: ['group', groupId] })
      // Update localStorage too
      const key = `prenumerator_groups_${account.userId}`
      const saved: SavedGroup[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      localStorage.setItem(key, JSON.stringify(saved.map(g => g.groupId === groupId ? { ...g, name: groupNameInput.trim() } : g)))
      setRenamingGroup(false)
    } catch {
      toast.error('Failed to rename group')
    } finally {
      setGroupRenamePending(false)
    }
  }

  const handleNotify = useCallback((entry: FeedLogEntry) => {
    if (!isEnabled(entry.type)) return
    setPendingNotifs(prev => [entry, ...prev])
  }, [isEnabled])

  const feedLog = useFeedHub(groupId, myMemberId, handleNotify)

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

  const deleteSubscription = useMutation({
    mutationFn: (id: string) => subscriptionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions', groupId] }),
    onError: () => toast.error('Failed to delete subscription'),
  })

  const stopWatching = useMutation({
    mutationFn: (id: string) => subscriptionsApi.stopWatching(id, myMemberId!),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['subscriptions', groupId] })
      const prev = qc.getQueryData<SubscriptionDto[]>(['subscriptions', groupId])
      qc.setQueryData<SubscriptionDto[]>(['subscriptions', groupId], old =>
        old?.map(s => s.id === id ? { ...s, activeMemberIds: [] } : s)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['subscriptions', groupId], ctx?.prev)
      toast.error('Failed to stop watching')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['subscriptions', groupId] }),
  })

  const joinSubscription = useMutation({
    mutationFn: (subscriptionId: string) =>
      subscriptionsApi.addMember(subscriptionId, myMemberId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions', groupId] }),
    onError: () => toast.error('Failed to join subscription'),
  })

  const leaveSubscription = useMutation({
    mutationFn: (subscriptionId: string) =>
      subscriptionsApi.removeMember(subscriptionId, myMemberId!),
    onMutate: async (subscriptionId) => {
      await qc.cancelQueries({ queryKey: ['subscriptions', groupId] })
      const prev = qc.getQueryData<SubscriptionDto[]>(['subscriptions', groupId])
      qc.setQueryData<SubscriptionDto[]>(['subscriptions', groupId], old =>
        old?.map(s => s.id === subscriptionId
          ? {
              ...s,
              members: s.members.filter(m => m.memberId !== myMemberId),
              activeMemberIds: s.activeMemberIds.filter(id => id !== myMemberId),
            }
          : s
        )
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['subscriptions', groupId], ctx?.prev)
      toast.error('Failed to leave subscription')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['subscriptions', groupId] }),
  })

  function handleChipClick(sub: SubscriptionDto, memberId: string) {
    if (!myMemberId || memberId !== myMemberId || sub.watchMode !== 'Shared') return
    toggleShared.mutate({ id: sub.id, memberId })
  }

  function handleWatchNow(sub: SubscriptionDto) {
    if (!myMemberId) return
    const currentActive = sub.activeMemberIds[0]
    if (!currentActive) {
      claimExclusive.mutate({ id: sub.id, memberId: myMemberId })
    } else {
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
  const members = group?.members ?? []

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[linear-gradient(to_right,#161616,#1C1410)] border-b border-primary/20 shadow-[0_2px_16px_rgba(0,0,0,0.6)] sticky top-0 z-40 px-4 md:px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/Logo.png"
              alt=""
              className="h-7 w-auto"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <span className="font-display font-extrabold hidden sm:inline text-sm tracking-widest uppercase bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              Prenumerator
            </span>
          </div>
          <span className="text-primary/30 hidden sm:inline">│</span>
          <div className="min-w-0">
            {renamingGroup ? (
              <form onSubmit={handleRenameGroup} className="flex items-center gap-1">
                <input
                  autoFocus
                  value={groupNameInput}
                  onChange={e => setGroupNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setRenamingGroup(false)}
                  className="bg-transparent border-b border-primary text-sm md:text-base font-display font-bold text-foreground outline-none w-36 md:w-48"
                />
                <button type="submit" disabled={groupRenamePending} className="text-primary hover:text-primary/70 transition-colors">
                  <Check className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setRenamingGroup(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="font-display font-bold text-foreground truncate text-sm md:text-base leading-tight">
                  {group?.name ?? '…'}
                </p>
                {group && (
                  <button
                    type="button"
                    onClick={() => { setGroupNameInput(group.name); setRenamingGroup(true) }}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Rename group"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            {group && !renamingGroup && (
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

        <div className="flex items-center gap-2 shrink-0">
          {/* Notification settings */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Notification settings">
                <Bell className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </SheetTitle>
              </SheetHeader>
              <p className="text-xs text-muted-foreground mb-4">
                Choose which activity pops up as a notification in the corner.
              </p>
              <div className="flex flex-col gap-3">
                {NOTIF_TYPES.map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isEnabled(type)}
                      onChange={() => toggle(type)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-sm group-hover:text-foreground text-muted-foreground transition-colors">
                      {NOTIF_LABELS[type]}
                    </span>
                  </label>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Profile & settings */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Account settings">
                <UserRound className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 flex flex-col">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <UserRound className="w-4 h-4" />
                  Account
                </SheetTitle>
              </SheetHeader>

              {account && (
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: account.avatarColor }}
                  >
                    {account.displayName[0].toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{account.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{account.username}</p>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mb-2">Swish number</p>
              <form onSubmit={handleSavePhone} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    className="w-full bg-muted border border-border rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                    placeholder="0701234567"
                    type="tel"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" disabled={phonePending}>
                  {phonePending ? '…' : 'Save'}
                </Button>
              </form>

              <div className="mt-auto pt-4 border-t border-border">
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus />
            <span className="hidden md:inline">Add subscription</span>
          </Button>
        </div>
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
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
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
              <div className="flex flex-col gap-3">
                {subs.map((sub, i) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    myMemberId={myMemberId}
                    index={i}
                    onChipClick={memberId => handleChipClick(sub, memberId)}
                    onWatch={() => handleWatchNow(sub)}
                    onStopWatch={() => stopWatching.mutate(sub.id)}
                    onJoin={() => joinSubscription.mutate(sub.id)}
                    onLeave={() => leaveSubscription.mutate(sub.id)}
                    onDelete={() => deleteSubscription.mutate(sub.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="costs">
            {isLoading
              ? <div className="flex flex-col gap-4"><Skeleton className="h-28 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
              : <CostsTab subscriptions={subs} myDisplayName={account?.displayName ?? ''} />
            }
          </TabsContent>

          <TabsContent value="credentials">
            {isLoading
              ? <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
              : <CredentialsTab subscriptions={subs} myMemberId={myMemberId} />
            }
          </TabsContent>

          <TabsContent value="feed">
            <FeedTab feedLog={feedLog} members={members} />
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

      <ActivityNotifications
        notifications={pendingNotifs}
        members={members}
        myMemberId={myMemberId}
        onDismiss={() => {}}
      />

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
