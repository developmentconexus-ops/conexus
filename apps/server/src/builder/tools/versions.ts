import type {
  CodeToolVersion,
  OperationId,
  ToolDetail,
  ToolSlug,
  ToolVersionBody,
} from '@conexus/hub-api'
import { ConnectionId, ToolId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type { ToolsDeps } from './access.ts'
import { admitted, detailOf, found, offeredOf, usableTool } from './access.ts'
import type { InProject, Writer } from './check.ts'
import { databaseScopeOf, fitting, sessionScopeOf, targetOf } from './check.ts'
import { derivedUuid } from './derived.ts'
import { inserted, presetTargetOf, toolOf } from './store.ts'
import { tool, toolVersion } from './tables.ts'

/** What a next version writes: its values, and the check that it fits the tool's connection. */
type Next = { config: object; fit: (row: ToolRow) => Promise<void> }
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
    await next.fit(row)
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
export async function addVersion(
  deps: ToolsDeps,
  scope: InProject,
  toolId: ToolId,
  body: ToolVersionBody,
  attemptKey: string,
  by: Writer,
): Promise<ToolDetail> {
  const { basedOn, ...config } = body
  async function fit(row: ToolRow) {
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
export async function codeFitting(
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
export async function saveCode(
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
export async function addCodeVersion(
  deps: ToolsDeps,
  scope: InProject,
  a: { toolId: ToolId; basedOn: number; version: CodeToolVersion },
  attemptKey: string,
): Promise<ToolDetail> {
  async function fit(row: ToolRow) {
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
