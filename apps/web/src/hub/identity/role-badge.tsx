import type { Role } from '@conexus/hub-api'
import { useRoleLabel } from './role-labels.tsx'

export function RoleBadge({ role }: { role: Role }) {
  const label = useRoleLabel()
  return <span className="shrink-0 text-label text-text-2">{label(role)}</span>
}
