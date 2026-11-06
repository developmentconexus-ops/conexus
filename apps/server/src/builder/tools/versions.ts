import type {
  CodeToolVersion,
  OperationId,
  ToolDetail,
  ToolSlug,
  ToolVersionBody,
} from '@conexus/hub-api'
import { ConnectionId, ToolId, ToolVersionId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type { ToolsDeps } from './access.ts'
import { admitted, detailOf, found, offeredOf, savedOnce, usableTool } from './access.ts'
import type { InProject, OfferedConnection, Writer } from './check.ts'
import { databaseScopeOf, fitting, sessionScopeOf, targetOf } from './check.ts'
import { derivedUuid } from './derived.ts'
import { firstVersionIdOf, presetTargetOf, toolOf } from './store.ts'
import { tool, toolVersion } from './tables.ts'
import { uploadWorker } from './workers.ts'

/**
 * What a next version writes: its values, the request it came from (what the attempt is keyed by,
 * so a repeat of the same request finds its version), and the check that it fits the tool's
 * connection among the ones the Projeto received.
 */
type Next = {
  config: object
  request: object
  fit: (row: ToolRow, offered: readonly OfferedConnection[]) => Promise<void>
  /** What runs once the version committed, outside the transaction (data D22). */
  saved?: (versionId: ToolVersionId) => Promise<void>
}
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
  const bodyHash = bodyHashOf(next.request)
  const offered = await offeredOf(deps, scope)
  async function write(tx: CommandTx) {
    await admitted(deps, tx, scope, 'manageAgents')
    const row = await usableTool(tx, scope, offered, toolId)
    const [earlier] = await tx
      .select({ bodyHash: toolVersion.bodyHash, number: toolVersion.number })
      .from(toolVersion)
      .where(eq(toolVersion.id, versionId))
    if (earlier !== undefined) {
      if (earlier.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
      return { detail: await detailOf(deps, tx, row, offered), number: earlier.number }
    }
    await next.fit(row, offered)
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
  await next.saved?.(ToolVersionId.parse(versionId))
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
  return appendVersion(deps, scope, {
    toolId,
    basedOn,
    attemptKey,
    by,
    next: { config, request: config, fit },
  })
}

/**
 * Why the reads of a `CODE` version do not fit its connection, or nothing: the Projeto received the
 * connection and every read is one of its reads (the connectors' door alone reads the kit, S36).
 */
function codeFitting(
  offered: readonly OfferedConnection[],
  connectionId: ConnectionId,
  reads: readonly OperationId[],
): void {
  const connection = offered.find((each) => each.connectionId === connectionId)
  if (connection === undefined) {
    throw new Failure('TOOL_REFUSED', { named: { field: 'connectionId', reason: 'NOT_OFFERED' } })
  }
  const known = new Set(connection.reads.map((each) => each.operation))
  if (reads.some((read) => !known.has(read))) {
    throw new Failure('TOOL_REFUSED', { named: { field: 'operation', reason: 'NOT_A_READ' } })
  }
}

/** The check above before the Construtor's machine runs, so a refused tool costs no machine. */
export async function fitCode(
  deps: ToolsDeps,
  scope: InProject,
  connectionId: ConnectionId,
  reads: readonly OperationId[],
): Promise<void> {
  codeFitting(await offeredOf(deps, scope), connectionId, reads)
}

/** A new `CODE` tool at version 1, keyed by its attempt: the Construtor's, after its test passed. */
export async function saveCode(
  deps: ToolsDeps,
  scope: InProject,
  body: { slug: ToolSlug; connectionId: ConnectionId; version: CodeToolVersion; request: object },
  attemptKey: string,
): Promise<ToolDetail> {
  const id = ToolId.parse(derivedUuid('tool', scope.companyId, scope.personId, attemptKey))
  const { slug, connectionId, version } = body
  const bodyHash = bodyHashOf(body.request)
  const offered = await offeredOf(deps, scope)
  codeFitting(offered, connectionId, version.reads)
  const detail = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const fresh = (await toolOf(tx, scope.companyId, id)) === undefined
    const target = { kind: 'CODE', slug, connectionId } as const
    const made = { id, scope, target, config: version, bodyHash, createdBy: scope.personId }
    return savedOnce(deps, tx, { scope, id, offered, bodyHash }, fresh ? made : undefined)
  })
  deps.log.info(
    { companyId: scope.companyId, toolId: id, version: 1, by: 'CONSTRUTOR' },
    'TOOL_SAVED',
  )
  const toolVersionId = firstVersionIdOf(id)
  await uploadWorker(
    deps,
    { companyId: scope.companyId, toolId: id, toolVersionId },
    version.module,
  )
  return detail
}

/** A `CODE` tool's next version over the one the Construtor read; its connection is the tool's, never new. */
export async function addCodeVersion(
  deps: ToolsDeps,
  scope: InProject,
  a: { toolId: ToolId; basedOn: number; version: CodeToolVersion; request: object },
  attemptKey: string,
): Promise<ToolDetail> {
  async function fit(row: ToolRow, offered: readonly OfferedConnection[]) {
    if (row.kind !== 'CODE') {
      throw new Failure('TOOL_REFUSED', { named: { field: 'kind', reason: 'VALUE_REFUSED' } })
    }
    codeFitting(offered, ConnectionId.parse(row.connectionId), a.version.reads)
  }
  const { companyId } = scope
  async function saved(toolVersionId: ToolVersionId) {
    await uploadWorker(deps, { companyId, toolId: a.toolId, toolVersionId }, a.version.module)
  }
  return appendVersion(deps, scope, {
    ...{ toolId: a.toolId, basedOn: a.basedOn, attemptKey, by: 'CONSTRUTOR' },
    next: { config: a.version, request: a.request, fit, saved },
  })
}
