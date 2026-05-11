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
  'rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring w-full'

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
    },
    onError: (err) => {
      const apiErr = err as ApiError
      toast.error(apiErr.message ?? 'Failed to save credentials')
    },
  })

  function openEdit() {
    setUsername(data?.username ?? '')
    setPassword(data?.password ?? '')
    setEditing(true)
  }

  return (
    <Card className="gap-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">{subscription.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setRevealed(r => !r)}
                title={revealed ? 'Hide' : 'Reveal'}
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
            {isOwner && (
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil /> {data ? 'Edit' : 'Set credentials'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isFetching && (
          <p className="text-xs text-muted-foreground">Loading…</p>
        )}

        {!isFetching && isError && !data && (
          <p className="text-xs text-muted-foreground italic">No credentials set yet.</p>
        )}

        {data && !editing && (
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono">{data.username}</span>
            <span className="text-muted-foreground">Password</span>
            <span className="font-mono">
              {revealed ? data.password : '•'.repeat(Math.min(data.password.length, 16))}
            </span>
          </div>
        )}

        {editing && (
          <form
            onSubmit={e => { e.preventDefault(); upsert.mutate() }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Username</label>
              <input
                className={inputClass}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={upsert.isPending}>
                {upsert.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
              >
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
    <div className="grid gap-4 sm:grid-cols-2">
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
