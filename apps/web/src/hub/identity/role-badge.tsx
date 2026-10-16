import type { Role } from '@conexus/hub-api'
import { ROLE_LABELS } from '@conexus/hub-api'

export function RoleBadge({ role }: { role: Role }) {
  return <span className="shrink-0 text-label text-text-2">{ROLE_LABELS[role]}</span>
}
