import type {
  CodeToolVersion,
  CompanyId,
  PersonId,
  ProjectId,
  ReadyTool,
  ToolDetail,
  ToolInput,
  ToolSlug,
  ToolTarget,
  ToolVersionBody,
} from '@conexus/hub-api'
import { ConnectionId, OperationId, ToolId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { violatedConstraint, violatedReference } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type { InProject, OfferedConnection, ToolConnectors, Writer } from './check.ts'
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
import { detailsOf, inserted, presetTargetOf, toolOf, toolsOn } from './store.ts'
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
async function offeredOf(deps: Pick<ToolsDeps, 'connectors'>, scope: InProject) {
  return deps.connectors.connections(sessionScopeOf(scope))
}

function idsOf(offered: readonly OfferedConnection[]) {
  return offered.map((each) => ConnectionId.parse(each.connectionId))
}

/** The tool if this Projeto may use it: the company's, on a connection it received (`usable`). */
async function usableTool(
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

async function detailOf(
  deps: ToolsDeps,
  tx: ReadTx,
  row: typeof tool.$inferSelect,
  offered: readonly OfferedConnection[],
) {
  const [detail] = await detailsOf(tx, deps.usedBy, [row], offered)
  if (detail === undefined) throw new Failure('TOOL_NOT_FOUND')
  return detail
}

/** A new tool of the library at version 1, keyed by its attempt (code C37). */
async function save(
  deps: ToolsDeps,
  scope: InProject,
  body: ToolInput,
  attemptKey: string,
  by: Writer,
) {
  const id = ToolId.parse(derivedUuid('tool', scope.companyId, scope.personId, attemptKey))
  const bodyHash = bodyHashOf(body)
  const { slug, connectionId, operation, ...config } = body
  const offered = await offeredOf(deps, scope)
  const target = await targetOf(
    deps.connectors,
    sessionScopeOf(scope),
    { connectionId, operation },
    offered,
  )
  const detail = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const earlier = await toolOf(tx, scope.companyId, id)
    if (earlier === undefined) {
      fitting(target, config)
      const row = { kind: 'PRESET', slug, connectionId, operation } as const
      const made = { id, scope, target: row, config, bodyHash, createdBy: scope.personId }
      if (await inserted(tx, made)) return detailOf(deps, tx, await found(tx, scope, id), offered)
    }
    const row = await found(tx, scope, id)
    if (row.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
    return detailOf(deps, tx, row, offered)
  })
  deps.log.info({ companyId: scope.companyId, toolId: id, version: 1, by }, 'TOOL_SAVED')
  return detail
}

async function found(tx: ReadTx, scope: InProject, id: ToolId) {
  const row = await toolOf(tx, scope.companyId, id)
  if (row === undefined) throw new Failure('TOOL_NOT_FOUND')
  return row
}

/** What a next version writes: its values, and the check that it fits the tool's connection. */
type Next = { config: object; fit: (tx: CommandTx, row: ToolRow) => Promise<void> }
type ToolRow = typeof tool.$inferSelect

/**
 * The tool's next version, keyed by its attempt (code C37) and written over the version the writer
 * read (`basedOn`): the counter moves only from that number, so two writers over the same one end
 * as one version and `STALE_VERSION`, and a repeat finds its version by id.
 */
async function appendVersion(
  deps: ToolsDeps,
  scope: InProject,
  a: { toolId: ToolId; basedOn: number; attemptKey: string; by: Writer; next: Next },
): Promise<ToolDetail> {
  const { toolId, basedOn, attemptKey, by, next } = a
  const versionId = derivedUuid('tool-version', toolId, scope.personId, attemptKey)
  const bodyHash = bodyHashOf(next.config)
  const offered = await offeredOf(deps, scope)
  async function write(tx: CommandTx) {
    await admitted(deps, tx, scope, 'manageAgents')
    const row = await usableTool(tx, scope, offered, toolId)
    const [earlier] = await tx.select().from(toolVersion).where(eq(toolVersion.id, versionId))
    if (earlier !== undefined) {
      if (earlier.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
      return { detail: await detailOf(deps, tx, row, offered), number: earlier.number }
    }
    await next.fit(tx, row)
    const [moved] = await tx
      .update(tool)
      .set({ currentVersion: sql`${tool.currentVersion} + 1`, updatedAt: sql`now()` })
      .where(and(eq(tool.id, toolId), eq(tool.currentVersion, basedOn)))
      .returning({ number: tool.currentVersion })
    if (moved === undefined) {
      throw new Failure('TOOL_REFUSED', { named: { field: 'toolId', reason: 'STALE_VERSION' } })
    }
    await tx.insert(toolVersion).values({
      ...{ id: versionId, toolId, companyId: scope.companyId, number: moved.number },
      ...{ config: next.config, createdBy: scope.personId, bodyHash },
    })
    return {
      detail: await detailOf(deps, tx, await found(tx, scope, toolId), offered),
      number: moved.number,
    }
  }
  const { detail, number } = await deps.database
    .command(databaseScopeOf(scope), write)
    .catch((error: unknown) => {
      // The same attempt at once: the second insert meets the first's id; it reads that one.
      if (violatedConstraint(error) !== 'tool_version_pkey') throw error
      return deps.database.command(databaseScopeOf(scope), write)
    })
  deps.log.info({ companyId: scope.companyId, toolId, version: number, by }, 'TOOL_SAVED')
  return detail
}

/** A `PRESET` tool's next version, the person's or the Construtor's; a `CODE` tool's is the Construtor's alone. */
async function addVersion(
  deps: ToolsDeps,
  scope: InProject,
  toolId: ToolId,
  body: ToolVersionBody,
  attemptKey: string,
  by: Writer,
): Promise<ToolDetail> {
  const { basedOn, ...config } = body
  const fit = async (tx: CommandTx, row: ToolRow) => {
    if (row.kind !== 'PRESET') {
      throw new Failure('TOOL_REFUSED', { named: { field: 'kind', reason: 'CODE_BY_CONSTRUTOR' } })
    }
    const target = await targetOf(deps.connectors, sessionScopeOf(scope), presetTargetOf(row))
    fitting(target, config)
  }
  return appendVersion(deps, scope, { toolId, basedOn, attemptKey, by, next: { config, fit } })
}

/**
 * Why the reads of a `CODE` version do not fit its connection, or nothing: the Projeto received the
 * connection and every read is one of its reads (the connectors' door alone reads the kit, S36).
 */
async function codeFitting(
  deps: ToolsDeps,
  scope: InProject,
  connectionId: ConnectionId,
  reads: readonly OperationId[],
): Promise<void> {
  const offered = await offeredOf(deps, scope)
  const connection = offered.find((each) => each.connectionId === connectionId)
  if (connection === undefined) {
    throw new Failure('TOOL_REFUSED', { named: { field: 'connectionId', reason: 'NOT_OFFERED' } })
  }
  const known = new Set(connection.reads.map((each) => each.operation))
  if (reads.some((read) => !known.has(read))) {
    throw new Failure('TOOL_REFUSED', { named: { field: 'operation', reason: 'NOT_A_READ' } })
  }
}

/** A new `CODE` tool at version 1, keyed by its attempt: the Construtor's, after its test passed. */
async function saveCode(
  deps: ToolsDeps,
  scope: InProject,
  body: { slug: ToolSlug; connectionId: ConnectionId; version: CodeToolVersion },
  attemptKey: string,
): Promise<ToolDetail> {
  const id = ToolId.parse(derivedUuid('tool', scope.companyId, scope.personId, attemptKey))
  const { slug, connectionId, version } = body
  const bodyHash = bodyHashOf(body)
  await codeFitting(deps, scope, connectionId, version.reads)
  const offered = await offeredOf(deps, scope)
  const detail = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    if ((await toolOf(tx, scope.companyId, id)) === undefined) {
      const target = { kind: 'CODE', slug, connectionId } as const
      const made = { id, scope, target, config: version, bodyHash, createdBy: scope.personId }
      if (await inserted(tx, made)) return detailOf(deps, tx, await found(tx, scope, id), offered)
    }
    const row = await found(tx, scope, id)
    if (row.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
    return detailOf(deps, tx, row, offered)
  })
  deps.log.info(
    { companyId: scope.companyId, toolId: id, version: 1, by: 'CONSTRUTOR' },
    'TOOL_SAVED',
  )
  return detail
}

/** A `CODE` tool's next version over the one the Construtor read; its connection is the tool's, never new. */
async function addCodeVersion(
  deps: ToolsDeps,
  scope: InProject,
  a: { toolId: ToolId; basedOn: number; version: CodeToolVersion },
  attemptKey: string,
): Promise<ToolDetail> {
  const fit = async (_tx: CommandTx, row: ToolRow) => {
    if (row.kind !== 'CODE') {
      throw new Failure('TOOL_REFUSED', { named: { field: 'kind', reason: 'CODE_BY_CONSTRUTOR' } })
    }
    await codeFitting(deps, scope, ConnectionId.parse(row.connectionId), a.version.reads)
  }
  return appendVersion(deps, scope, {
    ...{ toolId: a.toolId, basedOn: a.basedOn, attemptKey, by: 'CONSTRUTOR' },
    next: { config: a.version, fit },
  })
}

/**
 * The library's tools this Projeto may use, and the ready reads of its connections that are not
 * in it yet.
 */
async function list(deps: ToolsDeps, scope: InProject) {
  const offered = await deps.connectors.connections(sessionScopeOf(scope))
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    const ids = idsOf(offered)
    const rows = await toolsOn(tx, scope.companyId, ids)
    const held = new Set(rows.map((row) => row.id))
    const ready: ReadyTool[] = offered.flatMap((connection) =>
      connection.reads.flatMap(({ operation, label, summary }) => {
        const target = {
          connectionId: ConnectionId.parse(connection.connectionId),
          operation: OperationId.parse(operation),
        }
        if (held.has(readyIdOf(scope.companyId, target))) return []
        return [{ ...target, label, summary, slug: readySlug(target) }]
      }),
    )
    const tools = (await detailsOf(tx, deps.usedBy, rows, offered)).map(
      ({ versions: _, ...summary }) => summary,
    )
    return { tools, ready }
  })
}

async function get(deps: ToolsDeps, scope: InProject, toolId: ToolId) {
  const offered = await offeredOf(deps, scope)
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    return detailOf(deps, tx, await usableTool(tx, scope, offered, toolId), offered)
  })
}

/**
 * Deletes a tool and, by cascade, its versions. A choice points at a version with no action on
 * delete, so a tool in use refuses (23503) and nothing changes; the agents are read after.
 */
async function remove(deps: ToolsDeps, scope: InProject, toolId: ToolId): Promise<void> {
  const offered = await offeredOf(deps, scope)
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
    save: (scope: InProject, body: ToolInput, attemptKey: string, by: Writer) =>
      save(deps, scope, body, attemptKey, by),
    addVersion: (
      scope: InProject,
      toolId: ToolId,
      body: ToolVersionBody,
      attemptKey: string,
      by: Writer,
    ) => addVersion(deps, scope, toolId, body, attemptKey, by),
    fitCode: (scope: InProject, connectionId: ConnectionId, reads: readonly OperationId[]) =>
      codeFitting(deps, scope, connectionId, reads),
    saveCode: (
      scope: InProject,
      body: Parameters<typeof saveCode>[2],
      attemptKey: string,
    ) => saveCode(deps, scope, body, attemptKey),
    addCodeVersion: (
      scope: InProject,
      body: Parameters<typeof addCodeVersion>[2],
      attemptKey: string,
    ) => addCodeVersion(deps, scope, body, attemptKey),
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
