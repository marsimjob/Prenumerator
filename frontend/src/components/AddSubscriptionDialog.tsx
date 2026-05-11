import { useState } from 'react'
import { toast } from 'sonner'
import { subscriptionsApi } from '@/api/subscriptions'
import type { BillingCycle, WatchMode, ApiError, GroupMemberDto } from '@/api/types'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const SUBSCRIPTION_COLORS = [
  '#E50914', // Netflix red
  '#F47521', // Crunchyroll orange
  '#1DB954', // Spotify green
  '#0078D4', // Disney+ / Microsoft blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#64748B', // Slate
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  members: GroupMemberDto[]
  myMemberId: string | null
  onSuccess: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring w-full'

export default function AddSubscriptionDialog({
  open,
  onOpenChange,
  groupId,
  members,
  myMemberId,
  onSuccess,
}: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(SUBSCRIPTION_COLORS[0])
  const [watchMode, setWatchMode] = useState<WatchMode>('Exclusive')
  const [price, setPrice] = useState('')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly')
  const [ownerId, setOwnerId] = useState(myMemberId ?? '')
  const [pending, setPending] = useState(false)

  const effectiveOwner = ownerId || myMemberId || (members[0]?.id ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price || !effectiveOwner) return
    setPending(true)
    try {
      await subscriptionsApi.create(groupId, {
        name: name.trim(),
        color,
        watchMode,
        price: parseFloat(price),
        billingCycle,
        ownerId: effectiveOwner,
      })
      toast.success(`${name.trim()} added`)
      setName(''); setPrice(''); setBillingCycle('Monthly')
      setColor(SUBSCRIPTION_COLORS[0]); setWatchMode('Exclusive'); setOwnerId('')
      onSuccess()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to add subscription')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">

          {/* Name + live icon preview */}
          <Field label="Name">
            <div className="flex items-center gap-3">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 transition-colors"
                style={{ backgroundColor: color }}
              >
                {name.trim()[0]?.toUpperCase() ?? '?'}
              </span>
              <input
                className={inputClass}
                placeholder="Netflix"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </Field>

          {/* Watch mode */}
          <Field label="Watch mode">
            <div className="flex rounded-lg border border-border p-1 gap-1">
              {(['Exclusive', 'Shared'] as WatchMode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setWatchMode(m)}
                  className={cn(
                    'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                    watchMode === m ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m === 'Exclusive' ? '1 watcher (e.g. Netflix)' : 'Multiple (e.g. Nintendo)'}
                </button>
              ))}
            </div>
          </Field>

          {/* Color picker */}
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {SUBSCRIPTION_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-transform',
                    color === c && 'ring-2 ring-offset-2 ring-foreground scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>

          <div className="flex gap-3">
            <Field label="Price (kr)">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="149"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </Field>
            <Field label="Cycle">
              <select
                className={inputClass}
                value={billingCycle}
                onChange={e => setBillingCycle(e.target.value as BillingCycle)}
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </Field>
          </div>

          <Field label="Owner">
            {members.length > 0 ? (
              <select
                className={inputClass}
                value={effectiveOwner}
                onChange={e => setOwnerId(e.target.value)}
                required
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}{m.id === myMemberId ? ' (you)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={`${inputClass} font-mono text-xs`}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={effectiveOwner}
                onChange={e => setOwnerId(e.target.value)}
                required
              />
            )}
          </Field>

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? 'Adding…' : 'Add Subscription'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
