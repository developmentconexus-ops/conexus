import type {
  AgentId,
  ConnectionId,
  DraftPatch,
  ToolApproval,
  ToolVersionId,
} from '@conexus/hub-api'
import {
  ConnectionId as ConnectionIdSchema,
  ToolId,
  ToolVersionId as VersionId,
} from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject, OfferedConnection, Tools } from '../tools/public.ts'
import { effectOf, versionsWithTools } from '../tools/public.ts'
import { mayLeaveAlone, targetOf } from './publish.ts'
import { chosenIds } from './store.ts'
import { agentTool } from './tables.ts'

/**
 * Each chosen write's approval: the patch's, else what the tool held, else `ASK` (step 24.5); a read
 * has none, and an approval for a tool that is not a chosen write is the caller's mistake.
 */
async function approvalsOf(
  identity: Parameters<typeof mayLeaveAlone>[0],
  tx: CommandTx,
  a: {
    scope: InProject
    agentId: AgentId
    patch: DraftPatch
    shown: readonly OfferedConnection[]
  },
  homed: Awaited<ReturnType<typeof versionsWithTools>>,
): Promise<Map<string, ToolApproval>> {
  const held = await tx
    .select({ toolId: agentTool.toolId, approval: agentTool.approval })
    .from(agentTool)
    .where(eq(agentTool.agentId, a.agentId))
  const writes = homed.flatMap((row) => {
    if (effectOf(row.tool, a.shown) !== 'WRITE') return []
    const connectionId = ConnectionIdSchema.parse(row.tool.connectionId)
    const target = targetOf(a.shown, { ...row.tool, connectionId })
    return target === undefined ? [] : [{ row, target }]
  })
  const asked = Object.keys(a.patch.approvals ?? {})
  if (asked.some((toolId) => !writes.some(({ row }) => row.tool.id === toolId))) {
    throw new Failure('AGENT_TOOL_REFUSED', { named: { field: 'tools', reason: 'NOT_USABLE' } })
  }
  const approvals = new Map<string, ToolApproval>()
  for (const { row, target } of writes) {
    const before = held.find((each) => each.toolId === row.tool.id)?.approval
    const given = a.patch.approvals?.[ToolId.parse(row.tool.id)]
    if (given === 'AUTO' && before !== 'AUTO') {
      await mayLeaveAlone(identity, tx, a.scope, { slug: row.tool.slug, ...target })
    }
    approvals.set(row.version.id, given ?? (before === 'AUTO' ? 'AUTO' : 'ASK'))
  }
  return approvals
}

/**
 * Replaces the draft's choice of tools: the versions asked, or the current ones, with the ready
 * reads saved in the library first; each one this Projeto may use, one per tool.
 */
export async function choose(
  deps: { tools: Tools; identity: Parameters<typeof mayLeaveAlone>[0] },
  tx: CommandTx,
  a: {
    scope: InProject
    agentId: AgentId
    patch: DraftPatch
    around: readonly OfferedConnection[]
    /** Every read and write of the connections, whatever the editor's role: what tells a write. */
    shown: readonly OfferedConnection[]
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
  const approvals = await approvalsOf(deps.identity, tx, a, kept)
  await tx.delete(agentTool).where(eq(agentTool.agentId, a.agentId))
  if (rows.length > 0) {
    await tx.insert(agentTool).values(
      rows.map((row) => ({
        ...row,
        agentId: a.agentId,
        companyId: a.scope.companyId,
        approval: approvals.get(row.toolVersionId) ?? null,
      })),
    )
  }
  return [...new Set(kept.map((row) => ConnectionIdSchema.parse(row.tool.connectionId)))]
}
