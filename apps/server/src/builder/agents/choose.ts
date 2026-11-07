import type { AgentId, ConnectionId, DraftPatch, ToolVersionId } from '@conexus/hub-api'
import { ConnectionId as ConnectionIdSchema, ToolVersionId as VersionId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import type { InProject, OfferedConnection, Tools } from '../tools/public.ts'
import { versionsWithTools } from '../tools/public.ts'
import { chosenIds } from './store.ts'
import { agentTool } from './tables.ts'

/**
 * Replaces the draft's choice of tools: the versions asked, or the current ones, with the ready
 * reads saved in the library first; each one this Projeto may use, one per tool.
 */
export async function choose(
  deps: { tools: Tools },
  tx: CommandTx,
  a: {
    scope: InProject
    agentId: AgentId
    patch: DraftPatch
    around: readonly OfferedConnection[]
  },
  ready: Awaited<ReturnType<Tools['readyOf']>>,
): Promise<ConnectionId[]> {
  const asked = a.patch.tools ?? (await chosenIds(tx, a.agentId))
  const added = await deps.tools.saveReady(tx, a.scope, ready)
  const held = new Set((await versionsWithTools(tx, asked)).map((row) => row.tool.id))
  const extra = (await versionsWithTools(tx, added)).filter((row) => !held.has(row.tool.id))
  const wanted: ToolVersionId[] = [...asked, ...extra.map((row) => VersionId.parse(row.version.id))]
  const ids = a.around.map((each) => each.connectionId)
  const usable = await deps.tools.usable(tx, ids, wanted)
  // Taking a connection out of the selected takes its tools out (decision E4).
  const selected = a.patch.tools === undefined ? a.patch.connections : undefined
  const homed = await versionsWithTools(tx, wanted)
  const kept = homed.filter(
    (row) =>
      selected === undefined || selected.includes(ConnectionIdSchema.parse(row.tool.connectionId)),
  )
  const keptVersions = new Set(kept.map((row) => row.version.id))
  const rows = usable.filter((row) => keptVersions.has(row.toolVersionId))
  await tx.delete(agentTool).where(eq(agentTool.agentId, a.agentId))
  if (rows.length > 0) {
    await tx
      .insert(agentTool)
      .values(rows.map((row) => ({ ...row, agentId: a.agentId, companyId: a.scope.companyId })))
  }
  return [...new Set(kept.map((row) => ConnectionIdSchema.parse(row.tool.connectionId)))]
}
