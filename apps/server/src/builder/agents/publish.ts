import type { AgentId, Publish } from '@conexus/hub-api'
import { AgentConfig, AgentId as AgentIdSchema } from '@conexus/hub-api'
import { and, eq, max, sql } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject, OfferedConnection } from '../tools/public.ts'
import { versionsWithTools } from '../tools/public.ts'
import { chosenIds, ofProject } from './store.ts'
import { agent, agentTool, agentVersion, agentVersionTool } from './tables.ts'

/** What publishing needs of the draft: instructions, and only connections the Projeto still offers. */
export async function invalidField(
  tx: ReadTx,
  draft: AgentConfig,
  agentId: AgentId,
  around: readonly OfferedConnection[],
) {
  if (draft.instructions.trim() === '') return 'instructions'
  const ids = new Set<string>(around.map((each) => each.connectionId))
  if (draft.connections.some((each) => !ids.has(each))) return 'connections'
  const tools = await versionsWithTools(tx, await chosenIds(tx, agentId))
  if (tools.some((each) => !ids.has(each.tool.connectionId))) return 'tools'
  return undefined
}

/** Makes the version the agent's active one; the draft does not change. */
export function makeActive(tx: CommandTx, agentId: AgentId, number: number) {
  return tx
    .update(agent)
    .set({ activeVersion: number, updatedAt: sql`now()` })
    .where(eq(agent.id, agentId))
}

/**
 * What a publish did: a new version, the version of the same revision made active again (after a
 * return to an older one), or nothing, that version being the active one already.
 */
type Published = { number: number; did: 'PUBLISHED' | 'ACTIVATED' | 'NONE' }

type AgentRow = typeof agent.$inferSelect

/**
 * The version the same revision made before, if any. It is made active again only while the draft
 * is still that revision, after a return to another version; once the draft moved on, a late
 * publish of the old revision returns the version and changes nothing.
 */
async function republished(
  tx: CommandTx,
  row: AgentRow,
  revision: number,
): Promise<Published | undefined> {
  const [earlier] = await tx
    .select({ number: agentVersion.number })
    .from(agentVersion)
    .where(and(eq(agentVersion.agentId, row.id), eq(agentVersion.sourceRevision, revision)))
  if (earlier === undefined) return undefined
  if (row.activeVersion === earlier.number || row.revision !== revision) {
    return { number: earlier.number, did: 'NONE' }
  }
  await makeActive(tx, AgentIdSchema.parse(row.id), earlier.number)
  return { number: earlier.number, did: 'ACTIVATED' }
}

/** The draft as the next version, with the version of each tool it chose, made active. */
async function frozen(
  tx: CommandTx,
  scope: InProject,
  a: { agentId: AgentId; draft: AgentConfig; body: Publish },
): Promise<Published> {
  const { agentId, draft, body } = a
  const { companyId } = scope
  const [last] = await tx
    .select({ number: max(agentVersion.number) })
    .from(agentVersion)
    .where(eq(agentVersion.agentId, agentId))
  const number = (last?.number ?? 0) + 1
  await tx.insert(agentVersion).values({
    ...{ agentId, number, companyId, config: draft },
    ...{ sourceRevision: body.revision, message: body.message, publishedBy: scope.personId },
  })
  const chosen = await tx.select().from(agentTool).where(eq(agentTool.agentId, agentId))
  if (chosen.length > 0) {
    await tx
      .insert(agentVersionTool)
      .values(chosen.map(({ toolVersionId }) => ({ agentId, number, toolVersionId, companyId })))
  }
  await makeActive(tx, agentId, number)
  return { number, did: 'PUBLISHED' }
}

/**
 * Freezes the draft of the revision read as the next version, with the version of each chosen
 * tool, and makes it active. The agent's row is held first, which waits for a draft change in
 * flight; the same revision again finds the version it made (see `republished`).
 */
export async function published(
  tx: CommandTx,
  scope: InProject,
  a: { agentId: AgentId; body: Publish; around: readonly OfferedConnection[] },
): Promise<Published> {
  const { agentId, body } = a
  const [row] = await tx.select().from(agent).where(ofProject(scope, agentId)).for('update')
  if (row === undefined) throw new Failure('AGENT_NOT_FOUND')
  const earlier = await republished(tx, row, body.revision)
  if (earlier !== undefined) return earlier
  if (row.revision !== body.revision) throw new Failure('AGENT_DRAFT_STALE')
  const draft = AgentConfig.parse(row.draft)
  const field = await invalidField(tx, draft, agentId, a.around)
  if (field !== undefined) throw new Failure('AGENT_DRAFT_INVALID', { named: { field } })
  return frozen(tx, scope, { agentId, draft, body })
}
