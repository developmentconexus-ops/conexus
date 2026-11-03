import type {
  AgentDetail,
  AgentListed,
  AgentState,
  AgentSummary,
  AgentVersionSummary,
  OfProject,
  ToolId,
} from '@conexus/hub-api'
import {
  AgentConfig,
  AgentId,
  PersonId,
  ProjectId as ProjectIdSchema,
  ToolId as ToolIdSchema,
  ToolVersionId,
} from '@conexus/hub-api'
import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm'
import { personNameColumn } from '../../hub/identity/public.ts'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject, OfferedConnection, UsedBy } from '../tools/public.ts'
import { chosenOf, toolVersionsOf } from '../tools/public.ts'
import { agent, agentTool, agentVersion, agentVersionTool } from './tables.ts'

type AgentRow = typeof agent.$inferSelect

const columns = {
  row: agent,
  // The active version's revision: the draft changed when it moved past it.
  activeRevision: agentVersion.sourceRevision,
  author: personNameColumn(agent.createdBy),
}

function withActive(tx: ReadTx) {
  return tx
    .select(columns)
    .from(agent)
    .leftJoin(
      agentVersion,
      and(eq(agentVersion.agentId, agent.id), eq(agentVersion.number, agent.activeVersion)),
    )
}

type Listed = Awaited<ReturnType<ReturnType<typeof withActive>['where']>>[number]

/** The agent of this id in the Projeto: one of another Projeto is none (security S10). */
export function ofProject(ids: OfProject, agentId: AgentId) {
  return and(
    eq(agent.id, agentId),
    eq(agent.companyId, ids.companyId),
    eq(agent.projectId, ids.projectId),
  )
}

/** The agent of this Projeto, or `AGENT_NOT_FOUND` for one of another Projeto or none (S10). */
export async function agentIn(tx: ReadTx, scope: InProject, agentId: AgentId): Promise<Listed> {
  const [found] = await withActive(tx).where(ofProject(scope, agentId))
  if (found === undefined) throw new Failure('AGENT_NOT_FOUND')
  return found
}

export function agentsIn(tx: ReadTx, ids: OfProject) {
  return withActive(tx)
    .where(and(eq(agent.companyId, ids.companyId), eq(agent.projectId, ids.projectId)))
    .orderBy(asc(agent.createdAt), asc(agent.id))
}

function stateOf(row: AgentRow, activeRevision: number | null): AgentState {
  if (row.activeVersion === null) return { kind: 'DRAFT' }
  return {
    kind: 'PUBLISHED',
    version: row.activeVersion,
    changed: row.revision !== activeRevision,
  }
}

function summaryOf({ row, activeRevision }: Listed): AgentSummary {
  const draft = AgentConfig.parse(row.draft)
  return {
    id: AgentId.parse(row.id),
    projectId: ProjectIdSchema.parse(row.projectId),
    name: draft.name,
    description: draft.description,
    state: stateOf(row, activeRevision),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** The rows of the list, each with the number of tools its draft holds, counted in one query. */
export async function listedOf(tx: ReadTx, rows: readonly Listed[]): Promise<AgentListed[]> {
  const counted = await tx
    .select({ agentId: agentTool.agentId, tools: count() })
    .from(agentTool)
    .where(
      inArray(
        agentTool.agentId,
        rows.map(({ row }) => row.id),
      ),
    )
    .groupBy(agentTool.agentId)
  const byAgent = new Map(counted.map((each) => [each.agentId, each.tools]))
  return rows.map((listed) => ({ ...summaryOf(listed), tools: byAgent.get(listed.row.id) ?? 0 }))
}

/** The versions of each tool the draft chose. */
export async function chosenIds(tx: ReadTx, agentId: AgentId): Promise<ToolVersionId[]> {
  const rows = await tx
    .select({ id: agentTool.toolVersionId })
    .from(agentTool)
    .where(eq(agentTool.agentId, agentId))
  return rows.map((row) => ToolVersionId.parse(row.id))
}

/** The versions of each tool a published version holds. */
export async function pinnedIds(
  tx: ReadTx,
  agentId: AgentId,
  number: number,
): Promise<ToolVersionId[]> {
  const rows = await tx
    .select({ id: agentVersionTool.toolVersionId })
    .from(agentVersionTool)
    .where(and(eq(agentVersionTool.agentId, agentId), eq(agentVersionTool.number, number)))
  return rows.map((row) => ToolVersionId.parse(row.id))
}

export async function detailOf(
  tx: ReadTx,
  listed: Listed,
  offered: readonly OfferedConnection[],
): Promise<AgentDetail> {
  const { row, author } = listed
  return {
    ...summaryOf(listed),
    draft: AgentConfig.parse(row.draft),
    revision: row.revision,
    tools: await chosenOf(tx, await chosenIds(tx, AgentId.parse(row.id))),
    offered: offered.map(({ connectionId, connector, name, reads }) => ({
      ...{ connectionId, connector, name },
      reads: reads.map(({ operation, label, summary }) => ({ operation, label, summary })),
    })),
    createdBy:
      row.createdBy === null || author === null
        ? null
        : { personId: PersonId.parse(row.createdBy), name: author },
  }
}

/** The agent's published versions, newest first. */
export async function versionsOf(tx: ReadTx, row: AgentRow): Promise<AgentVersionSummary[]> {
  const rows = await tx
    .select({ version: agentVersion, by: personNameColumn(agentVersion.publishedBy) })
    .from(agentVersion)
    .where(eq(agentVersion.agentId, row.id))
    .orderBy(desc(agentVersion.number))
  return rows.map(({ version, by }) => ({
    number: version.number,
    message: version.message,
    active: version.number === row.activeVersion,
    publishedAt: version.publishedAt.toISOString(),
    publishedBy:
      version.publishedBy === null || by === null
        ? null
        : { personId: PersonId.parse(version.publishedBy), name: by },
  }))
}

/**
 * The agents that use each tool, by a draft's choice or a published version's: what the library
 * shows and what `TOOL_IN_USE` names, by the agents' names.
 */
export async function usedBy(tx: ReadTx, toolIds: readonly ToolId[]): ReturnType<UsedBy> {
  const versions = await toolVersionsOf(tx, toolIds)
  const toolOf = new Map(versions.map((each) => [each.id, ToolIdSchema.parse(each.toolId)]))
  const ids = [...toolOf.keys()]
  const found = new Map<ToolId, { id: AgentId; name: string }[]>()
  if (ids.length === 0) return found
  const name = sql<string>`${agent.draft}->>'name'`
  const chosen = tx
    .selectDistinct({ versionId: agentTool.toolVersionId, id: agent.id, name })
    .from(agentTool)
    .innerJoin(agent, eq(agent.id, agentTool.agentId))
    .where(inArray(agentTool.toolVersionId, ids))
  const pinned = tx
    .selectDistinct({ versionId: agentVersionTool.toolVersionId, id: agent.id, name })
    .from(agentVersionTool)
    .innerJoin(agent, eq(agent.id, agentVersionTool.agentId))
    .where(inArray(agentVersionTool.toolVersionId, ids))
  for (const row of [...(await chosen), ...(await pinned)]) {
    const toolId = toolOf.get(row.versionId)
    if (toolId === undefined) continue
    const users = found.get(toolId) ?? []
    if (!users.some((each) => each.id === row.id))
      users.push({ id: AgentId.parse(row.id), name: row.name })
    found.set(
      toolId,
      users.sort((a, b) => a.name.localeCompare(b.name)),
    )
  }
  return found
}
