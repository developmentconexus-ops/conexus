// In the app: src/components/ticket-status.tsx
import { Badge } from '@/components/ui/badge'
import type { TicketStatus } from '../../shared/operations'

// The words the person reads for each status and how each one looks, in the order they move.
// The values come from shared/operations.ts, so a status the server does not know fails the check.
export const STATUS_ITEMS = [
  { value: 'open', label: 'Aberto', variant: 'outline' },
  { value: 'in_progress', label: 'Em andamento', variant: 'secondary' },
  { value: 'waiting', label: 'Aguardando peça', variant: 'default' },
  { value: 'done', label: 'Resolvido', variant: 'ghost' },
] as const satisfies ReadonlyArray<{
  value: TicketStatus
  label: string
  variant: 'default' | 'outline' | 'secondary' | 'ghost'
}>

export function statusLabel(status: TicketStatus): string {
  return STATUS_ITEMS.find((item) => item.value === status)?.label ?? status
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const item = STATUS_ITEMS.find((entry) => entry.value === status)
  return <Badge variant={item?.variant ?? 'outline'}>{item?.label ?? status}</Badge>
}
