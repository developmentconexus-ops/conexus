import type { ToolId, ToolTarget } from '@conexus/hub-api'
import { ConnectionId, ToolVersionId } from '@conexus/hub-api'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type { InProject, ToolConnectors } from './check.ts'
import { readyConfig, readyIdOf, readySlug, sessionScopeOf, targetOf } from './check.ts'
import { inserted, toolOf, versionsOf, versionsWithTools } from './store.ts'

/**
 * The versions an agent of this Projeto may choose: the company's, of a connection the Projeto
 * received, one per tool; else `AGENT_TOOL_REFUSED` (the agents' service calls it in its own
 * transaction).
 */
export async function usable(
  tx: ReadTx,
  offered: readonly ConnectionId[],
  versionIds: readonly ToolVersionId[],
) {
  const rows = await versionsWithTools(tx, versionIds)
  const allowed = rows.filter((row) => offered.includes(ConnectionId.parse(row.tool.connectionId)))
  if (allowed.length !== versionIds.length) {
    throw new Failure('AGENT_TOOL_REFUSED', { named: { field: 'tools', reason: 'NOT_USABLE' } })
  }
  if (new Set(allowed.map((row) => row.tool.id)).size !== allowed.length) {
    throw new Failure('AGENT_TOOL_REFUSED', {
      named: { field: 'tools', reason: 'SAME_TOOL_TWICE' },
    })
  }
  return allowed.map((row) => ({ toolId: row.tool.id, toolVersionId: row.version.id }))
}

/** What a ready read needs before the transaction that saves it: its input and its summary. */
export async function readyOf(
  connectors: ToolConnectors,
  scope: InProject,
  targets: readonly ToolTarget[],
) {
  const session = sessionScopeOf(scope)
  const offered = await connectors.connections(session)
  return Promise.all(
    targets.map(async (target) => {
      const resolved = await targetOf(connectors, session, target)
      if (resolved.kind === 'REFUSED') throw new Failure('TOOL_REFUSED', { named: resolved.named })
      const connection = offered.find((each) => each.connectionId === target.connectionId)
      const read = connection?.reads.find((each) => each.operation === target.operation)
      if (read === undefined) {
        throw new Failure('TOOL_REFUSED', { named: { field: 'operation', reason: 'NOT_A_READ' } })
      }
      return { target, config: readyConfig(resolved.input, read.summary) }
    }),
  )
}

/**
 * Saves each ready read in the library, in the caller's transaction, once for the company: two
 * people choosing it at once find one row. Answers the version each tool has now.
 */
export async function saveReady(
  tx: CommandTx,
  scope: InProject,
  ready: Awaited<ReturnType<typeof readyOf>>,
): Promise<ToolVersionId[]> {
  const ids: ToolId[] = []
  for (const { target, config } of ready) {
    const id = readyIdOf(scope.companyId, target)
    const row = { ...target, kind: 'PRESET', slug: readySlug(target) } as const
    const bodyHash = bodyHashOf({ ...row, ...config })
    await inserted(tx, { id, scope, target: row, config, bodyHash, createdBy: scope.personId })
    ids.push(id)
  }
  const versions = await versionsOf(tx, ids)
  const rows = await Promise.all(ids.map((id) => toolOf(tx, scope.companyId, id)))
  return rows.flatMap((row) => {
    const newest = versions.find(
      (each) => each.toolId === row?.id && each.number === row?.currentVersion,
    )
    return newest === undefined ? [] : [ToolVersionId.parse(newest.id)]
  })
}
