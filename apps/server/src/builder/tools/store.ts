import type {
  AgentId,
  AgentTool,
  CompanyId,
  PersonId,
  ToolDetail,
  ToolSlug,
  ToolSummary,
  ToolTarget,
} from '@conexus/hub-api'
import {
  ConnectionId,
  OperationId,
  ToolId,
  ToolSlug as ToolSlugSchema,
  ToolVersionConfig,
  ToolVersionId,
} from '@conexus/hub-api'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject } from './check.ts'
import { derivedUuid } from './derived.ts'
import { tool, toolVersion } from './tables.ts'

/** The agents that use each tool, which the agents' owner reads for the library (`TOOL_IN_USE`). */
export type UsedBy = (
  tx: ReadTx,
  toolIds: readonly ToolId[],
) => Promise<ReadonlyMap<ToolId, readonly { id: AgentId; name: string }[]>>

type ToolRow = typeof tool.$inferSelect
type VersionRow = typeof toolVersion.$inferSelect

export function toolOf(tx: ReadTx, companyId: CompanyId, toolId: ToolId) {
  return tx
    .select()
    .from(tool)
    .where(and(eq(tool.id, toolId), eq(tool.companyId, companyId)))
    .then(([row]) => row)
}

/** The company's tools of the connections given, which are those the Projeto received. */
export function toolsOn(tx: ReadTx, companyId: CompanyId, connections: readonly ConnectionId[]) {
  if (connections.length === 0) return Promise.resolve([])
  return tx
    .select()
    .from(tool)
    .where(and(eq(tool.companyId, companyId), inArray(tool.connectionId, [...connections])))
    .orderBy(asc(tool.slug))
}

export function versionsOf(tx: ReadTx, toolIds: readonly ToolId[]) {
  if (toolIds.length === 0) return Promise.resolve([])
  return tx
    .select()
    .from(toolVersion)
    .where(inArray(toolVersion.toolId, [...toolIds]))
    .orderBy(asc(toolVersion.toolId), asc(toolVersion.number))
}

/** The versions named, each with its tool, of the company only (the row policy). */
export function versionsWithTools(tx: ReadTx, versionIds: readonly ToolVersionId[]) {
  if (versionIds.length === 0) return Promise.resolve([])
  return tx
    .select({ version: toolVersion, tool })
    .from(toolVersion)
    .innerJoin(tool, eq(tool.id, toolVersion.toolId))
    .where(inArray(toolVersion.id, [...versionIds]))
}

function targetOfRow(row: ToolRow): ToolTarget & { slug: ToolSlug } {
  return {
    connectionId: ConnectionId.parse(row.connectionId),
    operation: OperationId.parse(row.operation),
    slug: ToolSlugSchema.parse(row.slug),
  }
}

function versionDetail(row: VersionRow) {
  return {
    ...ToolVersionConfig.parse(row.config),
    id: ToolVersionId.parse(row.id),
    number: row.number,
  }
}

function latestOf(row: ToolRow, versions: readonly VersionRow[]) {
  const latest = versions.find(
    (each) => each.toolId === row.id && each.number === row.currentVersion,
  )
  // The version and the counter are written in one transaction (`tools.ts`).
  if (latest === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'TOOL_VERSION_MISSING' } })
  }
  return latest
}

/** Each tool with its versions, its newest one and the agents that use it. */
export async function detailsOf(
  tx: ReadTx,
  usedBy: UsedBy,
  rows: readonly ToolRow[],
): Promise<ToolDetail[]> {
  const ids = rows.map((row) => ToolId.parse(row.id))
  const versions = await versionsOf(tx, ids)
  const users = await usedBy(tx, ids)
  return rows.map((row): ToolDetail => {
    const latest = latestOf(row, versions)
    const summary: ToolSummary = {
      ...targetOfRow(row),
      id: ToolId.parse(row.id),
      description: ToolVersionConfig.parse(latest.config).description,
      effect: 'READ',
      latest: { id: ToolVersionId.parse(latest.id), number: latest.number },
      usedBy: [...(users.get(ToolId.parse(row.id)) ?? [])],
    }
    const own = versions.filter((each) => each.toolId === row.id).map(versionDetail)
    return { ...summary, versions: own }
  })
}

/** The chosen versions as an agent shows them: each with its tool's newest one. */
export async function chosenOf(
  tx: ReadTx,
  versionIds: readonly ToolVersionId[],
): Promise<AgentTool[]> {
  const found = await versionsWithTools(tx, versionIds)
  const latest = await versionsOf(
    tx,
    found.map((each) => ToolId.parse(each.tool.id)),
  )
  return found
    .map(({ version, tool: row }): AgentTool => {
      const newest = latestOf(row, latest)
      return {
        ...targetOfRow(row),
        id: ToolId.parse(row.id),
        effect: 'READ',
        latest: { id: ToolVersionId.parse(newest.id), number: newest.number },
        version: versionDetail(version),
      }
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

type Insert = {
  id: ToolId
  scope: InProject
  target: ToolTarget & { slug: string }
  config: ToolVersionConfig
  bodyHash: string
  createdBy: PersonId | null
}

/**
 * The tool and its version 1 in the caller's transaction, or nothing if its id is already there.
 * Every unique key arbitrates, so a twin written at once waits and then finds that row; no row of
 * this id after it is the slug another tool holds (`TOOL_REFUSED`).
 */
export async function inserted(tx: CommandTx, a: Insert): Promise<boolean> {
  const { companyId } = a.scope
  const [made] = await tx
    .insert(tool)
    .values({ id: a.id, companyId, ...a.target, createdBy: a.createdBy, bodyHash: a.bodyHash })
    .onConflictDoNothing()
    .returning({ id: tool.id })
  if (made === undefined) {
    if ((await toolOf(tx, companyId, a.id)) !== undefined) return false
    throw new Failure('TOOL_REFUSED', { named: { field: 'slug', reason: 'SLUG_TAKEN' } })
  }
  await tx.insert(toolVersion).values({
    ...{ id: derivedUuid('tool-version', a.id, '1'), toolId: a.id, companyId, number: 1 },
    ...{ config: a.config, createdBy: a.createdBy, bodyHash: a.bodyHash },
  })
  return true
}
