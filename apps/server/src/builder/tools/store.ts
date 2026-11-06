import type {
  AgentTool,
  CodeToolVersion,
  CompanyId,
  NamedAgent,
  PersonId,
  ToolDetail,
  ToolSlug,
  ToolTarget,
  ToolVersionDetail,
} from '@conexus/hub-api'
import {
  CodeToolRead,
  ConnectionId,
  OperationId,
  ToolId,
  ToolKind,
  ToolSlug as ToolSlugSchema,
  ToolVersionConfig,
  ToolVersionId,
} from '@conexus/hub-api'
import { and, asc, eq, getTableColumns, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { InProject, OfferedConnection } from './check.ts'
import { derivedUuid } from './derived.ts'
import { tool, toolVersion } from './tables.ts'

/** The agents that use each tool, which the agents' owner reads for the library (`TOOL_IN_USE`). */
export type UsedBy = (
  tx: ReadTx,
  toolIds: readonly ToolId[],
) => Promise<ReadonlyMap<ToolId, readonly NamedAgent[]>>

type ToolRow = typeof tool.$inferSelect
type VersionRow = typeof toolVersion.$inferSelect

/**
 * A version's columns with its config minus the bundled module (453 KB a version): no read but the
 * Worker's upload needs it, so none brings it from the database.
 */
const withoutModule = {
  ...getTableColumns(toolVersion),
  config: sql<unknown>`${toolVersion.config} - 'module'`,
}

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
    .select(withoutModule)
    .from(toolVersion)
    .where(inArray(toolVersion.toolId, [...toolIds]))
    .orderBy(asc(toolVersion.toolId), asc(toolVersion.number))
}

/** The versions named, each with its tool, of the company only (the row policy). */
export function versionsWithTools(tx: ReadTx, versionIds: readonly ToolVersionId[]) {
  if (versionIds.length === 0) return Promise.resolve([])
  return tx
    .select({ version: withoutModule, tool })
    .from(toolVersion)
    .innerJoin(tool, eq(tool.id, toolVersion.toolId))
    .where(inArray(toolVersion.id, [...versionIds]))
}

/** A `PRESET` tool's read; its row holds the operation by the table's check. */
export function presetTargetOf(row: ToolRow): ToolTarget & { slug: ToolSlug } {
  return {
    connectionId: ConnectionId.parse(row.connectionId),
    operation: OperationId.parse(row.operation),
    slug: ToolSlugSchema.parse(row.slug),
  }
}

/** A version as a screen reads it, by its tool's kind (code C21): a `CODE` one without its module. */
function versionDetail(
  kind: ToolKind,
  row: Pick<VersionRow, 'id' | 'number' | 'config'>,
): ToolVersionDetail {
  const identity = { id: ToolVersionId.parse(row.id), number: row.number }
  switch (kind) {
    case 'CODE':
      return { ...CodeToolRead.parse(row.config), kind, ...identity }
    case 'PRESET':
      return { ...ToolVersionConfig.parse(row.config), kind, ...identity }
    default:
      return kind satisfies never
  }
}

/** The description the latest version gives: the same field in both kinds. */
function descriptionOf(row: Pick<VersionRow, 'config'>): string {
  return z.object({ description: z.string() }).parse(row.config).description
}

function latestOf<V extends Pick<VersionRow, 'toolId' | 'number'>>(
  row: ToolRow,
  versions: readonly V[],
) {
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
  offered: readonly OfferedConnection[],
): Promise<ToolDetail[]> {
  const ids = rows.map((row) => ToolId.parse(row.id))
  const versions = await versionsOf(tx, ids)
  const users = await usedBy(tx, ids)
  return rows.map((row): ToolDetail => {
    const latest = latestOf(row, versions)
    // A connection the Projeto lost: the tool is not usable from here, as a tool it never had (#712).
    const connection = offered.find((each) => each.connectionId === row.connectionId)
    if (connection === undefined) throw new Failure('TOOL_NOT_FOUND')
    const base = {
      connectionName: connection.name,
      id: ToolId.parse(row.id),
      slug: ToolSlugSchema.parse(row.slug),
      connectionId: ConnectionId.parse(row.connectionId),
      description: descriptionOf(latest),
      effect: 'READ' as const,
      latest: { id: ToolVersionId.parse(latest.id), number: latest.number },
      usedBy: [...(users.get(ToolId.parse(row.id)) ?? [])],
    }
    const kind = ToolKind.parse(row.kind)
    const detailed = versions
      .filter((each) => each.toolId === row.id)
      .map((each) => versionDetail(kind, each))
    switch (kind) {
      case 'CODE':
        return {
          ...base,
          ...{ kind, reads: CodeToolRead.parse(latest.config).reads, versions: detailed },
          readLabels: Object.fromEntries(
            connection.reads.map((each) => [each.operation, each.label]),
          ),
        }
      case 'PRESET': {
        const { operation } = presetTargetOf(row)
        const read = connection.reads.find((each) => each.operation === operation)
        return { ...base, kind, operation, readLabel: read?.label ?? operation, versions: detailed }
      }
      default:
        return kind satisfies never
    }
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
      const base = {
        id: ToolId.parse(row.id),
        slug: ToolSlugSchema.parse(row.slug),
        effect: 'READ' as const,
        latest: { id: ToolVersionId.parse(newest.id), number: newest.number },
      }
      const detail = versionDetail(ToolKind.parse(row.kind), version)
      if (detail.kind === 'CODE') {
        return {
          ...base,
          kind: 'CODE',
          connectionId: ConnectionId.parse(row.connectionId),
          version: detail,
        }
      }
      return { ...base, ...presetTargetOf(row), kind: 'PRESET', version: detail }
    })
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

type Insert = {
  id: ToolId
  scope: InProject
  /** The tool's row: a `PRESET` one names its operation, a `CODE` one none (the table's check). */
  target: { kind: 'PRESET' | 'CODE'; slug: string; connectionId: ConnectionId; operation?: string }
  /** What version 1 holds: a `PRESET` tool's values or a `CODE` tool's version. */
  config: ToolVersionConfig | CodeToolVersion
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
