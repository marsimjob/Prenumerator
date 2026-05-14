import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronRight, Plus, LogOut, Pencil, Trash2, Check, X } from 'lucide-react'
import { authApi } from '@/api/auth'
import { groupsApi } from '@/api/groups'
import type { ApiError } from '@/api/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAccount } from '@/hooks/useAccount'
import { useSavedGroups, loadRemoved, type SavedGroup } from '@/hooks/useSavedGroups'

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
]

function saveMemberId(groupId: string, memberId: string) {
  localStorage.setItem(`prenumerator_member_${groupId}`, memberId)
}

const inputClass =
  'w-full bg-white/10 border border-white/20 rounded-md px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all'

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/Logo.png" alt="" className="h-9 w-auto"
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
      <span className="font-display font-extrabold text-2xl tracking-widest uppercase text-white">
        Prenumerator
      </span>
    </div>
  )
}

type AuthMode  = 'login' | 'register'
type GroupMode = 'create' | 'join'

export default function Landing() {
  const navigate = useNavigate()
  const { account, saveAccount, clearAccount } = useAccount()
  const { groups, saveGroup, renameGroup, removeGroup } = useSavedGroups(account?.userId)

  // Auth fields
  const [authMode,        setAuthMode]        = useState<AuthMode>('login')
  const [username,        setUsername]        = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName,     setDisplayName]     = useState('')
  const [avatarColor,     setAvatarColor]     = useState(AVATAR_COLORS[0])
  const [phoneNumber,     setPhoneNumber]     = useState('')
  const [authPending,     setAuthPending]     = useState(false)

  // Group fields
  const [groupMode,    setGroupMode]    = useState<GroupMode>('create')
  const [groupName,    setGroupName]    = useState('')
  const [inviteCode,   setInviteCode]   = useState('')
  const [groupPending, setGroupPending] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)

  // Inline rename state: groupId → current edit value
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [renamePending, setRenamePending] = useState(false)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    if (authMode === 'register' && password !== confirmPassword) {
      toast.error('Passwords do not match'); return
    }
    setAuthPending(true)
    try {
      const result = authMode === 'register'
        ? await authApi.register({ username, password, displayName: displayName.trim(), avatarColor, phoneNumber: phoneNumber.trim() || undefined })
        : await authApi.login({ username, password })

      const removed = loadRemoved(result.userId)
      const serverGroups: SavedGroup[] = result.groups
        .filter(g => !removed.has(g.groupId))
        .map(g => ({
          groupId:   g.groupId,
          memberId:  g.memberId,
          name:      g.groupName,
          isCreator: g.isCreator,
        }))
      const key = `prenumerator_groups_${result.userId}`
      const existing: SavedGroup[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      const merged = [...serverGroups, ...existing.filter(e => !serverGroups.some(s => s.groupId === e.groupId) && !removed.has(e.groupId))]
      localStorage.setItem(key, JSON.stringify(merged))
      serverGroups.forEach(g => localStorage.setItem(`prenumerator_member_${g.groupId}`, g.memberId))
      saveAccount({ ...result, phoneNumber: result.phoneNumber ?? null })
    } catch (err) {
      toast.error((err as ApiError).message ?? (authMode === 'register' ? 'Registration failed' : 'Invalid username or password'))
    } finally {
      setAuthPending(false)
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!account) return
    setGroupPending(true)
    try {
      const res = await groupsApi.create({
        name: groupName.trim(), userId: account.userId,
        displayName: account.displayName, avatarColor: account.avatarColor,
      })
      saveMemberId(res.groupId, res.memberId)
      saveGroup({ groupId: res.groupId, memberId: res.memberId, name: groupName.trim(), isCreator: true })
      navigate(`/${res.groupId}`)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to create group')
      setGroupPending(false)
    }
  }

  async function handleJoinGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!account) return
    setGroupPending(true)
    try {
      const res = await groupsApi.join({
        inviteCode: inviteCode.trim().toUpperCase(), userId: account.userId,
        displayName: account.displayName, avatarColor: account.avatarColor,
      })
      saveMemberId(res.groupId, res.memberId)
      saveGroup({ groupId: res.groupId, memberId: res.memberId, name: res.groupName, isCreator: false })
      navigate(`/${res.groupId}`)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Invalid invite code')
      setGroupPending(false)
    }
  }

  async function handleRename(g: SavedGroup) {
    if (!account || !editingName.trim() || editingName.trim() === g.name) {
      setEditingId(null); return
    }
    setRenamePending(true)
    try {
      await groupsApi.rename(g.groupId, account.userId, editingName.trim())
      renameGroup(g.groupId, editingName.trim())
      setEditingId(null)
    } catch {
      toast.error('Failed to rename group')
    } finally {
      setRenamePending(false)
    }
  }

  async function handleDelete(g: SavedGroup) {
    if (!account) return
    try {
      await groupsApi.delete(g.groupId, account.userId)
      removeGroup(g.groupId)
      setDeletingId(null)
    } catch {
      toast.error('Failed to delete group')
    }
  }

  return (
    <div className="relative min-h-svh flex flex-col bg-background overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/istockphoto-889642362-1024x1024.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />

      <header className="relative z-10 px-8 pt-8 pb-4">
        <Logo />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ── Step 1: not signed in ── */}
          {!account && (
            <div className="notched bg-black/70 backdrop-blur-md border border-white/10 p-8 shadow-2xl">
              <h1 className="font-display font-extrabold text-4xl text-white mb-1">
                {authMode === 'login' ? 'Sign in' : 'Create account'}
              </h1>
              <p className="text-sm text-white/50 mb-6">
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-primary hover:underline font-medium">
                  {authMode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <input className={inputClass} placeholder="Username" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  minLength={3} required autoFocus />

                {authMode === 'register' && (
                  <input className={inputClass} placeholder="Display name (shown to your group)"
                    value={displayName} onChange={e => setDisplayName(e.target.value)} required />
                )}

                <input type="password" className={inputClass} placeholder="Password"
                  value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />

                {authMode === 'register' && (
                  <>
                    <input type="password" className={inputClass} placeholder="Confirm password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

                    <input type="tel" className={inputClass} placeholder="Swish number (optional, e.g. 0701234567)"
                      value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />

                    <div>
                      <p className="text-xs text-white/50 mb-2">Your colour</p>
                      <div className="flex gap-2 flex-wrap">
                        {AVATAR_COLORS.map(c => (
                          <button key={c} type="button" onClick={() => setAvatarColor(c)}
                            className={cn('w-8 h-8 rounded-full transition-transform',
                              avatarColor === c && 'ring-2 ring-offset-2 ring-white scale-110')}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" disabled={authPending} className="w-full mt-2 h-12 text-base font-bold">
                  {authPending ? '…' : authMode === 'login' ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            </div>
          )}

          {/* ── Step 2: signed in ── */}
          {account && (
            <div className="notched bg-black/70 backdrop-blur-md border border-white/10 p-8 shadow-2xl flex flex-col gap-6">

              {/* Account bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: account.avatarColor }}>
                    {account.displayName[0].toUpperCase()}
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-white leading-tight">{account.displayName}</p>
                    <p className="text-white/40 text-xs">@{account.username}</p>
                  </div>
                </div>
                <button type="button" onClick={clearAccount}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>

              {/* Saved groups */}
              {groups.length > 0 && !showNewGroup && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Your groups</p>
                  {groups.map(g => (
                    <div key={g.groupId}>
                      {editingId === g.groupId ? (
                        /* Inline rename */
                        <div className="flex items-center gap-2 w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2">
                          <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {editingName[0]?.toUpperCase() || g.name[0]?.toUpperCase()}
                          </span>
                          <input
                            autoFocus
                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') void handleRename(g); if (e.key === 'Escape') setEditingId(null) }}
                          />
                          <button type="button" onClick={() => void handleRename(g)} disabled={renamePending}
                            className="text-primary hover:text-primary/80 transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="text-white/40 hover:text-white/70 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : deletingId === g.groupId ? (
                        /* Delete confirmation */
                        <div className="flex items-center gap-2 w-full rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
                          <span className="text-sm text-white/70 flex-1">Delete <strong className="text-white">{g.name}</strong>?</span>
                          <button type="button" onClick={() => void handleDelete(g)}
                            className="text-xs font-medium text-destructive hover:underline">Delete</button>
                          <span className="text-white/30 text-xs">/</span>
                          <button type="button" onClick={() => setDeletingId(null)}
                            className="text-xs text-white/40 hover:text-white/70">Cancel</button>
                        </div>
                      ) : (
                        /* Normal row */
                        <div className="flex items-center gap-1 w-full rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 transition-colors">
                          <button type="button" onClick={() => navigate(`/${g.groupId}`)}
                            className="flex items-center gap-3 flex-1 text-left min-w-0">
                            <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              {g.name[0]?.toUpperCase()}
                            </span>
                            <span className="font-semibold text-white text-sm truncate">{g.name}</span>
                          </button>

                          {/* Creator-only: rename + delete from server */}
                          {g.isCreator && (
                            <>
                              <button type="button"
                                onClick={() => { setEditingId(g.groupId); setEditingName(g.name) }}
                                className="p-1.5 text-white/30 hover:text-white/70 transition-colors" title="Rename group">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button type="button"
                                onClick={() => setDeletingId(g.groupId)}
                                className="p-1.5 text-white/30 hover:text-destructive transition-colors" title="Delete group">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Everyone: remove from local list */}
                          <button type="button"
                            onClick={() => removeGroup(g.groupId)}
                            className="p-1.5 text-white/30 hover:text-white/50 transition-colors" title="Remove from list">
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <button type="button" onClick={() => navigate(`/${g.groupId}`)}>
                            <ChevronRight className="w-4 h-4 text-white/30" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  <button type="button" onClick={() => setShowNewGroup(true)}
                    className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mt-1 self-start">
                    <Plus className="w-3.5 h-3.5" /> Join or create another group
                  </button>
                </div>
              )}

              {/* New group forms */}
              {(groups.length === 0 || showNewGroup) && (
                <>
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {(['create', 'join'] as GroupMode[]).map(m => (
                      <button key={m} type="button" onClick={() => setGroupMode(m)}
                        className={cn('flex-1 py-2 rounded-md text-sm font-semibold transition-all',
                          groupMode === m ? 'bg-primary text-primary-foreground shadow' : 'text-white/50 hover:text-white')}>
                        {m === 'create' ? 'Create group' : 'Join group'}
                      </button>
                    ))}
                  </div>

                  {groupMode === 'create' && (
                    <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
                      <input className={inputClass} placeholder="Group name" value={groupName}
                        onChange={e => setGroupName(e.target.value)} required autoFocus />
                      <Button type="submit" disabled={groupPending} className="w-full h-12 text-base font-bold">
                        {groupPending ? 'Creating…' : 'Create group'}
                      </Button>
                    </form>
                  )}

                  {groupMode === 'join' && (
                    <form onSubmit={handleJoinGroup} className="flex flex-col gap-4">
                      <input
                        className={`${inputClass} font-mono uppercase tracking-[0.3em] text-center text-lg`}
                        placeholder="INVITE CODE" value={inviteCode}
                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                        maxLength={8} required autoFocus />
                      <Button type="submit" disabled={groupPending} className="w-full h-12 text-base font-bold">
                        {groupPending ? 'Joining…' : 'Join group'}
                      </Button>
                    </form>
                  )}

                  {groups.length > 0 && (
                    <button type="button" onClick={() => setShowNewGroup(false)}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors self-center">
                      ← Back to my groups
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
