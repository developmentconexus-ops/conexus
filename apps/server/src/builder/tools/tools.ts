import type {
  CompanyId,
  PersonId,
  ReadyTool,
  ToolInput,
  ToolTarget,
  ToolVersionBody,
} from '@conexus/hub-api'
import { ConnectionId, OperationId, ToolId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import { violatedReference } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type { ToolsDeps } from './access.ts'
import { admitted, detailOf, idsOf, offeredOf, savedOnce, usableTool } from './access.ts'
import type { InProject, Writer } from './check.ts'
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
import { detailsOf, toolOf, toolsOn } from './store.ts'
import { tool, toolVersion } from './tables.ts'
import { addCodeVersion, addVersion, fitCode, saveCode } from './versions.ts'

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
    const fresh = (await toolOf(tx, scope.companyId, id)) === undefined
    if (fresh) fitting(target, config)
    const row = { kind: 'PRESET', slug, connectionId, operation } as const
    const made = { id, scope, target: row, config, bodyHash, createdBy: scope.personId }
    return savedOnce(deps, tx, { scope, id, offered, bodyHash }, fresh ? made : undefined)
  })
  deps.log.info({ companyId: scope.companyId, toolId: id, version: 1, by }, 'TOOL_SAVED')
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
      fitCode(deps, scope, connectionId, reads),
    saveCode: (scope: InProject, body: Parameters<typeof saveCode>[2], attemptKey: string) =>
      saveCode(deps, scope, body, attemptKey),
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
