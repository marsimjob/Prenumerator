import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, EyeOff, Pencil, KeyRound } from 'lucide-react'
import type { SubscriptionDto } from '@/api/types'
import type { ApiError } from '@/api/types'
import { credentialsApi } from '@/api/credentials'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Props {
  subscriptions: SubscriptionDto[]
  myMemberId: string | null
}

const inputClass =
  'border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring w-full'

function CredentialRow({ subscription, isOwner }: { subscription: SubscriptionDto; isOwner: boolean }) {
  const qc = useQueryClient()
  const [revealed, setRevealed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const { data, isFetching, isError } = useQuery({
    queryKey: ['credential', subscription.id],
    queryFn: () => credentialsApi.get(subscription.id),
    retry: false,
  })

  const upsert = useMutation({
    mutationFn: () => credentialsApi.upsert(subscription.id, { username, password }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['credential', subscription.id] })
      toast.success('Credentials saved')
      setEditing(false)
      setRevealed(false)
    },
    onError: (err) => {
      const apiErr = err as unknown as ApiError
      toast.error(apiErr.message ?? 'Failed to save credentials')
    },
  })

  function openEdit() {
    setUsername(data?.username ?? '')
    setPassword(data?.password ?? '')
    setEditing(true)
  }

  const dots = '•'.repeat(12)

  return (
    <Card
      className="gap-0 border-border"
      style={{ backgroundColor: `color-mix(in srgb, ${subscription.color} 8%, oklch(0.15 0 0))` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          {/* Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: subscription.ownerAvatarColor }}
            >
              {subscription.ownerDisplayName[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{subscription.name}</p>
              <p className="text-xs text-muted-foreground">by {subscription.ownerDisplayName}</p>
            </div>
          </div>

          {/* Edit button — owner only */}
          {isOwner && !editing && (
            <Button variant="outline" size="sm" onClick={openEdit} className="shrink-0">
              <Pencil className="w-3.5 h-3.5" />
              {data ? 'Edit' : 'Set credentials'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isFetching && (
          <p className="text-xs text-muted-foreground py-2">Loading…</p>
        )}

        {!isFetching && isError && !data && !editing && (
          isOwner ? (
            <p className="text-xs text-muted-foreground py-1">
              No credentials saved yet — press <span className="text-foreground font-medium">Set credentials</span> to add them.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground py-1 italic">
              The owner hasn't set credentials yet.
            </p>
          )
        )}

        {data && !editing && (
          <div className="flex flex-col gap-2 pt-1">
            {/* Username row */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Username</span>
              <span className="font-mono text-sm select-all">{data.username}</span>
            </div>

            {/* Password row — click to reveal */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Password</span>
              <button
                type="button"
                onClick={() => setRevealed(r => !r)}
                className="flex items-center gap-2 font-mono text-sm hover:text-foreground text-muted-foreground transition-colors group"
                title={revealed ? 'Click to hide' : 'Click to reveal'}
              >
                <span className="select-all">
                  {revealed ? data.password : dots}
                </span>
                <span className="opacity-0 group-hover:opacity-60 transition-opacity">
                  {revealed
                    ? <EyeOff className="w-3.5 h-3.5" />
                    : <Eye className="w-3.5 h-3.5" />
                  }
                </span>
              </button>
            </div>
          </div>
        )}

        {editing && (
          <form
            onSubmit={e => { e.preventDefault(); upsert.mutate() }}
            className="flex flex-col gap-3 pt-1"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                <KeyRound className="w-3 h-3 inline mr-1 mb-0.5" />
                Username / email
              </label>
              <input
                className={inputClass}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. mario@email.com"
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                <KeyRound className="w-3 h-3 inline mr-1 mb-0.5" />
                Password
              </label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={upsert.isPending}>
                {upsert.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function CredentialsTab({ subscriptions, myMemberId }: Props) {
  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        No subscriptions to manage credentials for.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {subscriptions.map(sub => (
        <CredentialRow
          key={sub.id}
          subscription={sub}
          isOwner={!!myMemberId && sub.ownerId === myMemberId}
        />
      ))}
    </div>
  )
}
