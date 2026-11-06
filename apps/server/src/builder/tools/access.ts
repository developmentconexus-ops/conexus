import type { CompanyId, ProjectId, ToolId } from '@conexus/hub-api'
import { ConnectionId } from '@conexus/hub-api'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject, OfferedConnection, ToolConnectors } from './check.ts'
import { sessionScopeOf } from './check.ts'
import type { UsedBy } from './store.ts'
import { detailsOf, toolOf } from './store.ts'
import type { tool } from './tables.ts'

export type ToolsDeps = {
  database: Database
  identity: Pick<IdentityPorts, 'admitMember'>
  liveProjectOf: (
    tx: ReadTx,
    ids: { companyId: CompanyId; projectId: ProjectId },
  ) => Promise<unknown | undefined>
  connectors: ToolConnectors
  usedBy: UsedBy
  log: FailureLog
}

/**
 * The person may manage agents now and the Projeto is live; else the same `NOT_FOUND` (security
 * S10). `manageAgents` holds the membership until the write commits; a read holds no row.
 */
export async function admitted(
  deps: Pick<ToolsDeps, 'identity' | 'liveProjectOf'>,
  tx: ReadTx,
  scope: InProject,
  action: 'readAgents' | 'manageAgents' | 'publishAgent',
): Promise<void> {
  const { companyId, personId, projectId } = scope
  await deps.identity.admitMember({ tx, companyId, personId, action })
  if ((await deps.liveProjectOf(tx, { companyId, projectId })) === undefined) {
    throw new Failure('NOT_FOUND', { details: { reason: 'PROJECT' } })
  }
}

/** The ids of the connections the Projeto received, read through the connectors' door. */
export async function offeredOf(deps: Pick<ToolsDeps, 'connectors'>, scope: InProject) {
  return deps.connectors.connections(sessionScopeOf(scope))
}

export function idsOf(offered: readonly OfferedConnection[]) {
  return offered.map((each) => ConnectionId.parse(each.connectionId))
}

/** The tool if this Projeto may use it: the company's, on a connection it received (`usable`). */
export async function usableTool(
  tx: ReadTx,
  scope: InProject,
  offered: readonly OfferedConnection[],
  id: ToolId,
) {
  const row = await toolOf(tx, scope.companyId, id)
  if (row === undefined || !idsOf(offered).includes(ConnectionId.parse(row.connectionId))) {
    throw new Failure('TOOL_NOT_FOUND')
  }
  return row
}

export async function detailOf(
  deps: ToolsDeps,
  tx: ReadTx,
  row: typeof tool.$inferSelect,
  offered: readonly OfferedConnection[],
) {
  const [detail] = await detailsOf(tx, deps.usedBy, [row], offered)
  if (detail === undefined) throw new Failure('TOOL_NOT_FOUND')
  return detail
}

export async function found(tx: ReadTx, scope: InProject, id: ToolId) {
  const row = await toolOf(tx, scope.companyId, id)
  if (row === undefined) throw new Failure('TOOL_NOT_FOUND')
  return row
}
