import { listRoles } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'
import { KIT_SANKHYA as SANKHYA } from './src/platform/test-kit.ts'
import { connectionsPage } from './sweep-connections.ts'

const EVERY = SANKHYA.subjects.flatMap((subject) => subject.operations)
const READS = EVERY.filter((operation) => operation.effect === 'READ')

function role(
  name: string,
  label: string,
  kind: 'ALL' | 'EDITABLE' | 'CUSTOM',
  ids: string[],
  members: number,
) {
  return {
    role: name,
    label,
    kind,
    connectors: { sankhya: ids },
    unattended: kind === 'ALL',
    members,
  }
}

const ROLES = [
  role(
    'owner',
    'Dono',
    'ALL',
    EVERY.map((one) => one.id),
    1,
  ),
  role(
    'admin',
    'Administrador',
    'ALL',
    EVERY.map((one) => one.id),
    0,
  ),
  role(
    'developer',
    'Desenvolvedor',
    'EDITABLE',
    READS.map((one) => one.id),
    0,
  ),
  role(
    'member',
    'Membro',
    'EDITABLE',
    READS.map((one) => one.id),
    1,
  ),
  role('atendente', 'Atendente', 'CUSTOM', ['pedidos'], 1),
]

/** The company's roles, which only whoever manages them reads. */
function rolesPage(id: string, mayManage: boolean): Replies {
  return mayManage ? { [`GET /api/companies/${id}/roles`]: ok(listRoles, { roles: ROLES }) } : {}
}

/** What the company's settings preload on focus: its connections and its roles, each from its own page's replies. */
export function settingsLists(id: string, mayManage: boolean): Replies {
  return { ...connectionsPage(id, mayManage), ...rolesPage(id, mayManage) }
}
