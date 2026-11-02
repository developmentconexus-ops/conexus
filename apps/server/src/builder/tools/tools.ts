import type {
  CompanyId,
  PersonId,
  ProjectId,
  ReadyTool,
  ToolDetail,
  ToolInput,
  ToolTarget,
  ToolVersionConfig,
} from '@conexus/hub-api'
import { ConnectionId, OperationId, ToolId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { violatedConstraint, violatedReference } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type { InProject, ToolConnectors } from './check.ts'
import {
  databaseScopeOf,
  fitting,
  readyIdOf,
  readySlug,
  sessionScopeOf,
  targetOf,
} from './check.ts'
import { readyOf, saveReady, usable } from './choice.ts'
import { derivedUuid } from './derived.ts'
import type { UsedBy } from './store.ts'
import { detailsOf, inserted, toolOf, toolsOn } from './store.ts'
import { tool, toolVersion } from './tables.ts'

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
async function offeredIds(deps: Pick<ToolsDeps, 'connectors'>, scope: InProject) {
  const offered = await deps.connectors.connections(sessionScopeOf(scope))
  return offered.map((each) => ConnectionId.parse(each.connectionId))
}

/** The tool if this Projeto may use it: the company's, on a connection it received (`usable`). */
async function usableTool(
  tx: ReadTx,
  scope: InProject,
  offered: readonly ConnectionId[],
  id: ToolId,
) {
  const row = await toolOf(tx, scope.companyId, id)
  if (row === undefined || !offered.includes(ConnectionId.parse(row.connectionId))) {
    throw new Failure('TOOL_NOT_FOUND')
  }
  return row
}

async function detailOf(deps: ToolsDeps, tx: ReadTx, row: typeof tool.$inferSelect) {
  const [detail] = await detailsOf(tx, deps.usedBy, [row])
  if (detail === undefined) throw new Failure('TOOL_NOT_FOUND')
  return detail
}

/** A new tool of the library at version 1, keyed by its attempt (code C37). */
async function save(deps: ToolsDeps, scope: InProject, body: ToolInput, attemptKey: string) {
  const id = ToolId.parse(derivedUuid('tool', scope.companyId, scope.personId, attemptKey))
  const bodyHash = bodyHashOf(body)
  const { slug, connectionId, operation, ...config } = body
  const target = await targetOf(deps.connectors, sessionScopeOf(scope), { connectionId, operation })
  const detail = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const earlier = await toolOf(tx, scope.companyId, id)
    if (earlier === undefined) {
      fitting(target, config)
      const row = { slug, connectionId, operation }
      const made = { id, scope, target: row, config, bodyHash, createdBy: scope.personId }
      if (await inserted(tx, made)) return detailOf(deps, tx, await found(tx, scope, id))
    }
    const row = await found(tx, scope, id)
    if (row.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
    return detailOf(deps, tx, row)
  })
  deps.log.info({ companyId: scope.companyId, toolId: id, version: 1 }, 'TOOL_SAVED')
  return detail
}

async function found(tx: ReadTx, scope: InProject, id: ToolId) {
  const row = await toolOf(tx, scope.companyId, id)
  if (row === undefined) throw new Failure('TOOL_NOT_FOUND')
  return row
}

/**
 * The tool's next version, keyed by its attempt (code C37): the counter's update holds the tool's
 * row, so two at once become `n+1` and `n+2`; a repeat finds its version by id.
 */
async function addVersion(
  deps: ToolsDeps,
  scope: InProject,
  toolId: ToolId,
  config: ToolVersionConfig,
  attemptKey: string,
): Promise<ToolDetail> {
  const versionId = derivedUuid('tool-version', toolId, scope.personId, attemptKey)
  const bodyHash = bodyHashOf(config)
  const offered = await offeredIds(deps, scope)
  async function write(tx: CommandTx) {
    await admitted(deps, tx, scope, 'manageAgents')
    const row = await usableTool(tx, scope, offered, toolId)
    const [earlier] = await tx.select().from(toolVersion).where(eq(toolVersion.id, versionId))
    if (earlier !== undefined) {
      if (earlier.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
      return { detail: await detailOf(deps, tx, row), number: earlier.number }
    }
    const { connectionId, operation } = row
    const target = {
      connectionId: ConnectionId.parse(connectionId),
      operation: OperationId.parse(operation),
    }
    fitting(await targetOf(deps.connectors, sessionScopeOf(scope), target), config)
    const [next] = await tx
      .update(tool)
      .set({ currentVersion: sql`${tool.currentVersion} + 1`, updatedAt: sql`now()` })
      .where(eq(tool.id, toolId))
      .returning({ number: tool.currentVersion })
    if (next === undefined) throw new Failure('TOOL_NOT_FOUND')
    await tx.insert(toolVersion).values({
      ...{ id: versionId, toolId, companyId: scope.companyId, number: next.number },
      ...{ config, createdBy: scope.personId, bodyHash },
    })
    return { detail: await detailOf(deps, tx, await found(tx, scope, toolId)), number: next.number }
  }
  const { detail, number } = await deps.database
    .command(databaseScopeOf(scope), write)
    .catch((error: unknown) => {
      // The same attempt at once: the second insert meets the first's id; it reads that one.
      if (violatedConstraint(error) !== 'tool_version_pkey') throw error
      return deps.database.command(databaseScopeOf(scope), write)
    })
  deps.log.info({ companyId: scope.companyId, toolId, version: number }, 'TOOL_SAVED')
  return detail
}

/**
 * The library's tools this Projeto may use, and the ready reads of its connections that are not
 * in it yet.
 */
async function list(deps: ToolsDeps, scope: InProject) {
  const offered = await deps.connectors.connections(sessionScopeOf(scope))
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    const ids = offered.map((each) => ConnectionId.parse(each.connectionId))
    const rows = await toolsOn(tx, scope.companyId, ids)
    const held = new Set(rows.map((row) => row.id))
    const ready: ReadyTool[] = offered.flatMap((connection) =>
      connection.reads.flatMap(({ operation, summary }) => {
        const target = {
          connectionId: ConnectionId.parse(connection.connectionId),
          operation: OperationId.parse(operation),
        }
        if (held.has(readyIdOf(scope.companyId, target))) return []
        return [{ ...target, summary, slug: readySlug(target) }]
      }),
    )
    const tools = (await detailsOf(tx, deps.usedBy, rows)).map(
      ({ versions: _, ...summary }) => summary,
    )
    return { tools, ready }
  })
}

async function get(deps: ToolsDeps, scope: InProject, toolId: ToolId) {
  const offered = await offeredIds(deps, scope)
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    return detailOf(deps, tx, await usableTool(tx, scope, offered, toolId))
  })
}

/**
 * Deletes a tool and, by cascade, its versions. A choice points at a version with no action on
 * delete, so a tool in use refuses (23503) and nothing changes; the agents are read after.
 */
async function remove(deps: ToolsDeps, scope: InProject, toolId: ToolId): Promise<void> {
  const offered = await offeredIds(deps, scope)
  await deps.database
    .command(databaseScopeOf(scope), async (tx) => {
      await admitted(deps, tx, scope, 'manageAgents')
      await usableTool(tx, scope, offered, toolId)
      const gone = await tx.delete(tool).where(eq(tool.id, toolId)).returning({ id: tool.id })
      if (gone.length === 0) throw new Failure('TOOL_NOT_FOUND')
    })
    .catch(async (error: unknown) => {
      if (violatedReference(error) === undefined) throw error
      const users = await deps.database.read(databaseScopeOf(scope), (tx) =>
        deps.usedBy(tx, [toolId]),
      )
      const agents = [...(users.get(toolId) ?? [])]
      throw new Failure('TOOL_IN_USE', { named: { agents }, cause: error })
    })
  deps.log.info({ companyId: scope.companyId, toolId }, 'TOOL_DELETED')
}

/** The person's authorship leaves with them: their tools and versions stay with no author (data D17). */
async function releasePerson(tx: CommandTx, companyId: CompanyId, personId: PersonId) {
  await tx
    .update(tool)
    .set({ createdBy: null })
    .where(and(eq(tool.companyId, companyId), eq(tool.createdBy, personId)))
  await tx
    .update(toolVersion)
    .set({ createdBy: null })
    .where(and(eq(toolVersion.companyId, companyId), eq(toolVersion.createdBy, personId)))
}

/**
 * The company's tool library (step 24.3, `T1`): one tool per read slice, with versions that never
 * change. Every route admits the person who may manage agents in a live Projeto; a tool this
 * Projeto may not use is `TOOL_NOT_FOUND` (security S10).
 */
export function createTools(deps: ToolsDeps) {
  return Object.freeze({
    save: (scope: InProject, body: ToolInput, attemptKey: string) =>
      save(deps, scope, body, attemptKey),
    addVersion: (scope: InProject, toolId: ToolId, config: ToolVersionConfig, key: string) =>
      addVersion(deps, scope, toolId, config, key),
    list: (scope: InProject) => list(deps, scope),
    get: (scope: InProject, toolId: ToolId) => get(deps, scope, toolId),
    remove: (scope: InProject, toolId: ToolId) => remove(deps, scope, toolId),
    usable,
    readyOf: (scope: InProject, targets: readonly ToolTarget[]) =>
      readyOf(deps.connectors, scope, targets),
    saveReady,
    releasePerson,
  })
}

export type Tools = ReturnType<typeof createTools>
