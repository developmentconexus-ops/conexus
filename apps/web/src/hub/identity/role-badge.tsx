import type { Role } from '@conexus/hub-api'
import { roleLabel } from '@conexus/hub-api'

export function RoleBadge({ role }: { role: Role }) {
  return <span className="shrink-0 text-label text-text-2">{roleLabel(role)}</span>
}
