import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { groupsApi } from '@/api/groups'
import type { ApiError } from '@/api/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAccount } from '@/hooks/useAccount'
import { LogOut } from 'lucide-react'

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
      <img
        src="/Logo.png"
        alt=""
        className="h-9 w-auto"
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
      <span className="text-2xl font-extrabold tracking-tight text-white">
        Prenumerator
      </span>
    </div>
  )
}

type AuthMode = 'login' | 'register'
type GroupMode = 'create' | 'join'

export default function Landing() {
  const navigate = useNavigate()
  const { account, saveAccount, clearAccount } = useAccount()

  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0])
  const [authPending, setAuthPending] = useState(false)

  const [groupMode, setGroupMode] = useState<GroupMode>('create')
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [groupPending, setGroupPending] = useState(false)

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    if (authMode === 'register' && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setAuthPending(true)
    try {
      const result = authMode === 'register'
        ? await authApi.register({ username, password, displayName: displayName.trim(), avatarColor })
        : await authApi.login({ username, password })
      saveAccount(result)
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
      const res = await groupsApi.create({ name: groupName.trim(), userId: account.userId, displayName: account.displayName, avatarColor: account.avatarColor })
      saveMemberId(res.groupId, res.memberId)
      navigate(`/${res.groupId}`)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to create group')
    } finally {
      setGroupPending(false)
    }
  }

  async function handleJoinGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!account) return
    setGroupPending(true)
    try {
      const res = await groupsApi.join({ inviteCode: inviteCode.trim().toUpperCase(), userId: account.userId, displayName: account.displayName, avatarColor: account.avatarColor })
      saveMemberId(res.groupId, res.memberId)
      navigate(`/${res.groupId}`)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Invalid invite code')
    } finally {
      setGroupPending(false)
    }
  }

  return (
    <div className="relative min-h-svh flex flex-col bg-background overflow-hidden">

      {/* Background image + gradient overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/istockphoto-889642362-1024x1024.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />

      {/* Top bar with logo */}
      <header className="relative z-10 px-8 pt-8 pb-4">
        <Logo />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ── Step 1: Auth ── */}
          {!account && (
            <div className="bg-black/70 backdrop-blur-md rounded-xl border border-white/10 p-8 shadow-2xl">
              <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight">
                {authMode === 'login' ? 'Sign in' : 'Create account'}
              </h1>
              <p className="text-sm text-white/50 mb-6">
                {authMode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-primary hover:underline font-medium"
                >
                  {authMode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <input
                  className={inputClass}
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  minLength={3}
                  required
                  autoFocus
                />

                {authMode === 'register' && (
                  <input
                    className={inputClass}
                    placeholder="Display name (shown to your group)"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                  />
                )}

                <input
                  type="password"
                  className={inputClass}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                />

                {authMode === 'register' && (
                  <>
                    <input
                      type="password"
                      className={inputClass}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                    <div>
                      <p className="text-xs text-white/50 mb-2">Your colour</p>
                      <div className="flex gap-2 flex-wrap">
                        {AVATAR_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setAvatarColor(c)}
                            className={cn(
                              'w-8 h-8 rounded-full transition-transform',
                              avatarColor === c && 'ring-2 ring-offset-2 ring-white scale-110',
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={authPending}
                  className="w-full mt-2 h-12 text-base font-bold rounded-md"
                >
                  {authPending ? '…' : authMode === 'login' ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            </div>
          )}

          {/* ── Step 2: Pick a group ── */}
          {account && (
            <div className="bg-black/70 backdrop-blur-md rounded-xl border border-white/10 p-8 shadow-2xl">

              {/* Account bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: account.avatarColor }}
                  >
                    {account.displayName[0].toUpperCase()}
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-white leading-tight">{account.displayName}</p>
                    <p className="text-white/40 text-xs">@{account.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearAccount}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-6">
                {(['create', 'join'] as GroupMode[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setGroupMode(m)}
                    className={cn(
                      'flex-1 py-2 rounded-md text-sm font-semibold transition-all',
                      groupMode === m
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-white/50 hover:text-white',
                    )}
                  >
                    {m === 'create' ? 'Create group' : 'Join group'}
                  </button>
                ))}
              </div>

              {groupMode === 'create' && (
                <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
                  <input
                    className={inputClass}
                    placeholder="Group name"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                    autoFocus
                  />
                  <Button type="submit" disabled={groupPending} className="w-full h-12 text-base font-bold">
                    {groupPending ? 'Creating…' : 'Create group'}
                  </Button>
                </form>
              )}

              {groupMode === 'join' && (
                <form onSubmit={handleJoinGroup} className="flex flex-col gap-4">
                  <input
                    className={`${inputClass} font-mono uppercase tracking-[0.3em] text-center text-lg`}
                    placeholder="INVITE CODE"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    required
                    autoFocus
                  />
                  <Button type="submit" disabled={groupPending} className="w-full h-12 text-base font-bold">
                    {groupPending ? 'Joining…' : 'Join group'}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
