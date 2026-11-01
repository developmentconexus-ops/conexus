import { Badge } from '../../ui/badge.tsx'
import { cn } from '../../ui/cn.ts'

/** **Automação · <nome>**: the mark of a conversation an automation's run opened (step 24.2, U3). */
export function AutomationBadge(props: { name: string; className?: string }) {
  return (
    <Badge className={cn('max-w-full shrink overflow-hidden', props.className)}>
      <span className="truncate">{`Automação · ${props.name}`}</span>
    </Badge>
  )
}
