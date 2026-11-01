import { Badge } from '../../ui/badge.tsx'

/** **Automação · <nome>**: the mark of a conversation an automation's run opened (step 24.2, U3). */
export function AutomationBadge({ name }: { name: string }) {
  return <Badge>{`Automação · ${name}`}</Badge>
}
