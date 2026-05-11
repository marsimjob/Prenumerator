import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  subscriptionName: string
  currentWatcherName: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmWatchDialog({
  open,
  subscriptionName,
  currentWatcherName,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Replace active watcher?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{currentWatcherName}</span> is currently
          using <span className="font-medium text-foreground">{subscriptionName}</span>.
          Replace them?
        </p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Yes, replace</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
