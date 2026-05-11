import type { SubscriptionDto } from '@/api/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, Play, Tv2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberChipProps {
  displayName: string
  avatarColor: string
  isActive: boolean
  /** clickable only in Shared mode */
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
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
        isClickable && !isActive && 'hover:opacity-80 cursor-pointer',
        !isClickable && 'cursor-default',
      )}
      style={{ backgroundColor: `${avatarColor}20`, color: avatarColor }}
    >
      <span className="relative shrink-0">
        <span
          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
          style={{ backgroundColor: avatarColor }}
        >
          {displayName[0].toUpperCase()}
        </span>
        {isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-1 ring-background" />
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
  /** Shared mode: toggles your active status */
  onChipClick: (memberId: string) => void
  /** Exclusive mode: "Watch now" button was pressed */
  onWatch: () => void
  onJoin: () => void
}

export default function SubscriptionCard({
  subscription: sub,
  myMemberId,
  onChipClick,
  onWatch,
  onJoin,
}: Props) {
  const isShared = sub.watchMode === 'Shared'
  const isMember = !!myMemberId && sub.members.some(m => m.memberId === myMemberId)
  const imWatching = !!myMemberId && sub.activeMemberIds.includes(myMemberId)

  return (
    <Card className="gap-0 transition-all hover:border-border/60 hover:bg-secondary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{ backgroundColor: sub.color }}
            >
              {sub.name[0]?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground leading-tight truncate">{sub.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Owner: {sub.ownerDisplayName}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-semibold text-foreground tabular-nums">
              {formatPrice(sub.price, sub.billingCycle)}
            </p>
            <div className="flex items-center gap-1 justify-end mt-1">
              <Badge variant="secondary" className="text-[10px]">
                {sub.billingCycle === 'Monthly' ? 'Monthly' : 'Yearly'}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {isShared ? 'Shared' : 'Exclusive'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Member chips — status only in Exclusive, toggleable in Shared */}
        <div className="flex flex-wrap gap-2 items-center">
          {sub.members.length === 0
            ? <p className="text-xs text-muted-foreground">No members yet</p>
            : sub.members.map(m => {
                const isActive = sub.activeMemberIds.includes(m.memberId)
                const isYours = m.memberId === myMemberId
                return (
                  <MemberChip
                    key={m.memberId}
                    displayName={m.displayName}
                    avatarColor={m.avatarColor}
                    isActive={isActive}
                    isClickable={isShared && isYours}
                    onClick={() => onChipClick(m.memberId)}
                  />
                )
              })
          }
          {!isMember && myMemberId && (
            <Button variant="outline" size="xs" onClick={onJoin}>
              <UserPlus /> Join
            </Button>
          )}
        </div>

        {/* Exclusive mode: Watch now / You're watching */}
        {!isShared && isMember && (
          imWatching ? (
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <Tv2 className="w-3.5 h-3.5" />
              You're watching
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="self-start text-xs h-7 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={onWatch}
            >
              <Play className="w-3 h-3" />
              Watch now
              {sub.activeMemberIds.length > 0 && (
                <span className="ml-1 text-muted-foreground font-normal">
                  · replaces {sub.members.find(m => m.memberId === sub.activeMemberIds[0])?.displayName}
                </span>
              )}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  )
}
