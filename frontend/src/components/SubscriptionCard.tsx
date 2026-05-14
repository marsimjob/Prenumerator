import { useState, useEffect, useRef } from 'react'
import type { SubscriptionDto } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Play, Tv2, LogOut, Trash2, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberChipProps {
  displayName: string
  avatarColor: string
  isActive: boolean
  isClickable: boolean
  onClick: () => void
}

function MemberChip({ displayName, avatarColor, isActive, isClickable, onClick }: MemberChipProps) {
  return (
    <button
      type="button"
      title={isActive ? `${displayName} is watching` : displayName}
      onClick={() => { if (isClickable) onClick() }}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all border',
        isClickable && !isActive && 'hover:opacity-80 cursor-pointer',
        !isClickable && 'cursor-default',
        isActive ? 'border-transparent' : 'border-border bg-secondary/50',
      )}
      style={isActive ? { backgroundColor: `${avatarColor}22`, color: avatarColor, borderColor: `${avatarColor}55` } : undefined}
    >
      <span className="relative shrink-0">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: avatarColor }}
        >
          {displayName[0].toUpperCase()}
        </span>
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-1 ring-background" />
        )}
      </span>
      {displayName}
    </button>
  )
}

function formatPrice(price: number, cycle: string) {
  const f = price.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `${f} kr/${cycle === 'Monthly' ? 'mån' : 'år'}`
}

interface Props {
  subscription: SubscriptionDto
  myMemberId: string | null
  index: number
  onChipClick: (memberId: string) => void
  onWatch: () => void
  onStopWatch: () => void
  onJoin: () => void
  onLeave: () => void
  onDelete: () => void
}

// Staggered left offsets so cards aren't all flush-left
const OFFSETS = [0, 14, 5, 20, 2, 10]


export default function SubscriptionCard({
  subscription: sub,
  myMemberId,
  index,
  onChipClick,
  onWatch,
  onStopWatch,
  onJoin,
  onLeave,
  onDelete,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [visible, setVisible]             = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const offset = OFFSETS[index % OFFSETS.length]
  const delay  = index * 0.07

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.05 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Convex bump: the side closest to the mouse grows outward
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const r  = el.getBoundingClientRect()
    const x  = (e.clientX - r.left)  / r.width  - 0.5   // -0.5 → 0.5
    const y  = (e.clientY - r.top)   / r.height - 0.5

    // Tilt toward the mouse (opposite of the old inward tilt)
    const tiltX =  y * 10   // positive: top edge rises when mouse is near top
    const tiltY = -x * 14   // positive: left edge rises when mouse is near left

    el.style.transition = 'transform 0.06s ease-out, box-shadow 0.06s ease-out'
    el.style.transform  = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`
    el.style.boxShadow  = `${x * 20}px ${y * 14}px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)`
  }

  function onMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    el.style.transition = 'transform 0.45s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.4s ease'
    el.style.transform  = 'none'
    el.style.boxShadow  = ''
  }

  const isShared   = sub.watchMode === 'Shared'
  const isOwner    = !!myMemberId && sub.ownerId === myMemberId
  const isMember   = !!myMemberId && sub.members.some(m => m.memberId === myMemberId)
  const imWatching = !!myMemberId && sub.activeMemberIds.includes(myMemberId)

  return (
    <div
      ref={wrapRef}
      style={{
        marginLeft: `${offset}px`,
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(56px)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="notched flex flex-col border border-border shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
        style={{
          backgroundColor: `color-mix(in srgb, ${sub.color} 8%, oklch(0.15 0 0))`,
        }}
      >
        {/* Top row */}
        <div className="flex items-center gap-4 px-6 pt-5 pb-3">
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ backgroundColor: sub.color }}
          >
            {sub.name[0]?.toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-lg text-foreground leading-tight truncate">{sub.name}</p>
            <p className="text-sm text-muted-foreground truncate">{sub.ownerDisplayName}</p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <p className="font-display font-bold tabular-nums text-base text-foreground">
                {formatPrice(sub.price, sub.billingCycle)}
              </p>
              {isOwner && (
                confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { onDelete(); setConfirmDelete(false) }}
                      className="text-[11px] font-medium text-destructive hover:underline">Confirm</button>
                    <span className="text-muted-foreground text-[11px]">/</span>
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      className="text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="text-muted-foreground hover:text-destructive transition-colors" title="Delete subscription">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {sub.billingCycle === 'Monthly' ? 'Monthly' : 'Yearly'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {isShared ? 'Shared' : 'Exclusive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-2 flex-wrap px-6 pb-5 pt-3 border-t border-border/50">
          {sub.members.length === 0
            ? <p className="text-sm text-muted-foreground">No members yet</p>
            : sub.members.map(m => (
                <MemberChip
                  key={m.memberId}
                  displayName={m.displayName}
                  avatarColor={m.avatarColor}
                  isActive={sub.activeMemberIds.includes(m.memberId)}
                  isClickable={isShared && m.memberId === myMemberId}
                  onClick={() => onChipClick(m.memberId)}
                />
              ))
          }

          {!isMember && myMemberId && (
            <Button variant="outline" size="sm" onClick={onJoin} className="h-8 text-sm">
              <UserPlus className="w-3.5 h-3.5" /> Join
            </Button>
          )}

          {!isShared && isMember && (
            imWatching ? (
              <div className="flex items-center gap-2 text-sm text-primary font-medium ml-auto">
                <Tv2 className="w-4 h-4" />
                You're watching
                <button
                  type="button"
                  onClick={onStopWatch}
                  title="Stop watching"
                  className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop
                </button>
              </div>
            ) : (
              <Button size="sm" variant="ghost"
                className="ml-auto h-8 text-sm text-primary hover:bg-primary/10 hover:text-primary"
                onClick={onWatch}>
                <Play className="w-3.5 h-3.5" />
                Watch now
                {sub.activeMemberIds.length > 0 && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    · {sub.members.find(m => m.memberId === sub.activeMemberIds[0])?.displayName}
                  </span>
                )}
              </Button>
            )
          )}

          {isMember && myMemberId && (
            <button type="button" onClick={onLeave}
              className={cn('flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors', isShared && 'ml-auto')}
              title="Leave this subscription">
              <LogOut className="w-3.5 h-3.5" /> Leave
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
