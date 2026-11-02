import type {
  AgentDetail,
  AgentId,
  CreateAgent,
  DraftPatch,
  Publish,
  ToolVersionId,
} from '@conexus/hub-api'
import { AgentConfig, AgentId as AgentIdSchema, ToolVersionId as VersionId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type {
  InProject,
  OfferedConnection,
  ToolConnectors,
  Tools,
  ToolsDeps,
} from '../tools/public.ts'
import {
  admitted,
  databaseScopeOf,
  derivedUuid,
  sessionScopeOf,
  versionsWithTools,
} from '../tools/public.ts'
import type { AgentEvent } from './events.ts'
import { invalidField, makeActive, published } from './publish.ts'
import {
  agentIn,
  agentsIn,
  chosenIds,
  detailOf,
  ofProject,
  summaryOf,
  versionsOf,
} from './store.ts'
import { agent, agentTool, agentVersion } from './tables.ts'

export type AgentsDeps = Pick<ToolsDeps, 'database' | 'identity' | 'liveProjectOf'> & {
  connectors: ToolConnectors
  /** Whether the model selector lists a model (`isChoosable`). */
  isChoosable: (model: string) => boolean
  tools: Tools
  emit: (event: AgentEvent) => Promise<void>
  log: FailureLog
}

function offered(deps: AgentsDeps, scope: InProject) {
  return deps.connectors.connections(sessionScopeOf(scope))
}

function defaults(body: CreateAgent): AgentConfig {
  return {
    ...{ name: body.name, description: body.description ?? '', instructions: '', model: null },
    ...{ memory: { observational: true }, connections: [], web: false, appData: false },
  }
}

async function detail(
  tx: ReadTx,
  scope: InProject,
  id: AgentId,
  around: readonly OfferedConnection[],
) {
  return detailOf(tx, await agentIn(tx, scope, id), around)
}

/** A new agent of the Projeto as a draft, keyed by its attempt (code C37). */
async function create(deps: AgentsDeps, scope: InProject, body: CreateAgent, attemptKey: string) {
  const id = AgentIdSchema.parse(derivedUuid('agent', scope.companyId, scope.personId, attemptKey))
  const bodyHash = bodyHashOf({ ...body, projectId: scope.projectId })
  const around = await offered(deps, scope)
  const made = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const [inserted] = await tx
      .insert(agent)
      .values({
        ...{ id, companyId: scope.companyId, projectId: scope.projectId, draft: defaults(body) },
        ...{ createdBy: scope.personId, bodyHash },
      })
      .onConflictDoNothing()
      .returning({ id: agent.id })
    const [row] = await tx.select({ bodyHash: agent.bodyHash }).from(agent).where(eq(agent.id, id))
    if (row?.bodyHash !== bodyHash) throw new Failure('IDEMPOTENCY_CONFLICT')
    return { fresh: inserted !== undefined, agent: await detail(tx, scope, id, around) }
  })
  if (made.fresh) deps.log.info({ companyId: scope.companyId, agentId: id }, 'AGENT_CREATED')
  return made.agent
}

async function list(deps: AgentsDeps, scope: InProject) {
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    return (await agentsIn(tx, scope)).map(summaryOf)
  })
}

async function get(deps: AgentsDeps, scope: InProject, agentId: AgentId) {
  const around = await offered(deps, scope)
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    return detail(tx, scope, agentId, around)
  })
}

/**
 * The fields the patch changes are of the Projeto's choice: each connection one it offers now and
 * a model the selector lists; else `REQUEST_MALFORMED` with the field.
 */
function checked(deps: AgentsDeps, patch: DraftPatch, around: readonly OfferedConnection[]) {
  const ids = new Set(around.map((each) => each.connectionId))
  if (patch.connections?.some((each) => !ids.has(each))) {
    throw new Failure('REQUEST_MALFORMED', {
      named: { field: 'connections', reason: 'NOT_OFFERED' },
    })
  }
  if (patch.model != null && !deps.isChoosable(patch.model)) {
    throw new Failure('REQUEST_MALFORMED', { named: { field: 'model', reason: 'VALUE_REFUSED' } })
  }
}

/** The draft with the patch's fields over it; `revision`, `tools` and `ready` are not fields. */
function merged(current: AgentConfig, patch: DraftPatch): AgentConfig {
  const { revision: _, tools: __, ready: ___, ...fields } = patch
  const given = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  )
  return AgentConfig.parse({ ...current, ...given })
}

/**
 * Replaces the draft's choice of tools: the versions asked, or the current ones, with the ready
 * reads saved in the library first; each one this Projeto may use, one per tool.
 */
async function choose(
  deps: AgentsDeps,
  tx: CommandTx,
  a: {
    scope: InProject
    agentId: AgentId
    patch: DraftPatch
    around: readonly OfferedConnection[]
  },
  ready: Awaited<ReturnType<Tools['readyOf']>>,
) {
  const asked = a.patch.tools ?? (await chosenIds(tx, a.agentId))
  const added = await deps.tools.saveReady(tx, a.scope, ready)
  const held = new Set((await versionsWithTools(tx, asked)).map((row) => row.tool.id))
  const extra = (await versionsWithTools(tx, added)).filter((row) => !held.has(row.tool.id))
  const versions: ToolVersionId[] = [
    ...asked,
    ...extra.map((row) => VersionId.parse(row.version.id)),
  ]
  const ids = a.around.map((each) => each.connectionId)
  const rows = await deps.tools.usable(tx, ids, versions)
  await tx.delete(agentTool).where(eq(agentTool.agentId, a.agentId))
  if (rows.length === 0) return
  await tx
    .insert(agentTool)
    .values(rows.map((row) => ({ ...row, agentId: a.agentId, companyId: a.scope.companyId })))
}

/**
 * Changes the draft at the revision the writer read (code C38): the update holds the row, so of
 * two at the same revision one writes and the other finds no row (`AGENT_DRAFT_STALE`).
 */
async function saveDraft(deps: AgentsDeps, scope: InProject, agentId: AgentId, patch: DraftPatch) {
  const around = await offered(deps, scope)
  checked(deps, patch, around)
  const ready = await deps.tools.readyOf(scope, patch.ready ?? [])
  const saved = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const { row } = await agentIn(tx, scope, agentId)
    const [changed] = await tx
      .update(agent)
      .set({
        draft: merged(AgentConfig.parse(row.draft), patch),
        revision: sql`${agent.revision} + 1`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(agent.id, agentId), eq(agent.revision, patch.revision)))
      .returning({ revision: agent.revision })
    if (changed === undefined) throw new Failure('AGENT_DRAFT_STALE')
    if (patch.tools !== undefined || ready.length > 0) {
      await choose(deps, tx, { scope, agentId, patch, around }, ready)
    }
    return { revision: changed.revision, agent: await detail(tx, scope, agentId, around) }
  })
  const { companyId } = scope
  deps.log.info({ companyId, agentId, revision: saved.revision, by: 'PERSON' }, 'AGENT_DRAFT_SAVED')
  return saved.agent
}

/** Publishes the draft of the revision read (`published`), then says so once it committed. */
async function publish(deps: AgentsDeps, scope: InProject, agentId: AgentId, body: Publish) {
  const around = await offered(deps, scope)
  const done = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'publishAgent')
    return published(tx, scope, { agentId, body, around })
  })
  if (done.did !== 'NONE') {
    const { companyId } = scope
    const line = done.did === 'PUBLISHED' ? 'AGENT_PUBLISHED' : 'AGENT_ACTIVATED'
    deps.log.info({ companyId, agentId, version: done.number }, line)
    await deps.emit({ kind: 'ACTIVATED', companyId, agentId, version: done.number })
  }
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    const listed = await agentIn(tx, scope, agentId)
    const versions = await versionsOf(tx, listed.row)
    const version = versions.find((each) => each.number === done.number)
    if (version === undefined) throw new Failure('AGENT_VERSION_NOT_FOUND')
    return { agent: await detailOf(tx, listed, around), version }
  })
}

async function versions(deps: AgentsDeps, scope: InProject, agentId: AgentId) {
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    return versionsOf(tx, (await agentIn(tx, scope, agentId)).row)
  })
}

/**
 * Whether the draft can run as it is: what publishing needs of it (`invalidField`), so a test of
 * the draft refuses with the same `AGENT_DRAFT_INVALID` and the field.
 */
async function testable(deps: AgentsDeps, scope: InProject, agentId: AgentId): Promise<void> {
  const around = await offered(deps, scope)
  await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const { row } = await agentIn(tx, scope, agentId)
    const field = await invalidField(tx, AgentConfig.parse(row.draft), agentId, around)
    if (field !== undefined) throw new Failure('AGENT_DRAFT_INVALID', { named: { field } })
  })
}

/** Makes a published version the active one; the draft does not change. The last one written wins. */
async function activate(deps: AgentsDeps, scope: InProject, agentId: AgentId, number: number) {
  const around = await offered(deps, scope)
  const made = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'publishAgent')
    await agentIn(tx, scope, agentId)
    const [version] = await tx
      .select({ number: agentVersion.number })
      .from(agentVersion)
      .where(and(eq(agentVersion.agentId, agentId), eq(agentVersion.number, number)))
    if (version === undefined) throw new Failure('AGENT_VERSION_NOT_FOUND')
    await makeActive(tx, agentId, number)
    return detail(tx, scope, agentId, around)
  })
  const { companyId } = scope
  deps.log.info({ companyId, agentId, version: number }, 'AGENT_ACTIVATED')
  await deps.emit({ kind: 'ACTIVATED', companyId, agentId, version: number })
  return made
}

/**
 * Deletes the agent, and by cascade its versions, its choices of tools and its conversations' rows;
 * the tools stay in the library. The agent is read in the company first: one of another Projeto
 * answers `AGENT_NOT_FOUND` before any sweep (security S10); one gone from the whole company is
 * still swept and answers `AGENT_NOT_FOUND`, which takes the threads a cut between the steps left.
 * With no lock across a call outside (data D22): its conversations' threads leave first, then the
 * row, then they are swept again (`DELETED`), which takes a thread opened between the two.
 */
async function remove(deps: AgentsDeps, scope: InProject, agentId: AgentId): Promise<void> {
  const { companyId } = scope
  await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const [found] = await tx
      .select({ projectId: agent.projectId })
      .from(agent)
      .where(and(eq(agent.id, agentId), eq(agent.companyId, companyId)))
    if (found !== undefined && found.projectId !== scope.projectId) {
      throw new Failure('AGENT_NOT_FOUND')
    }
  })
  await deps.emit({ kind: 'DELETING', companyId, agentId })
  await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const gone = await tx.delete(agent).where(ofProject(scope, agentId)).returning({ id: agent.id })
    if (gone.length === 0) throw new Failure('AGENT_NOT_FOUND')
  })
  deps.log.info({ companyId, agentId }, 'AGENT_DELETED')
  await deps.emit({ kind: 'DELETED', companyId, agentId })
}

/**
 * The service of a Projeto's agents (step 24.3, U1), which the routes and the Construtor (U4) call
 * with the same refusals. Every operation admits the person who may manage agents in a live
 * Projeto; an agent of another Projeto is `AGENT_NOT_FOUND` (security S10).
 */
export function createAgentService(deps: AgentsDeps) {
  return Object.freeze({
    create: (scope: InProject, body: CreateAgent, key: string) => create(deps, scope, body, key),
    list: (scope: InProject) => list(deps, scope),
    get: (scope: InProject, agentId: AgentId) => get(deps, scope, agentId),
    saveDraft: (scope: InProject, agentId: AgentId, patch: DraftPatch): Promise<AgentDetail> =>
      saveDraft(deps, scope, agentId, patch),
    publish: (scope: InProject, agentId: AgentId, body: Publish) =>
      publish(deps, scope, agentId, body),
    versions: (scope: InProject, agentId: AgentId) => versions(deps, scope, agentId),
    testable: (scope: InProject, agentId: AgentId) => testable(deps, scope, agentId),
    activate: (scope: InProject, agentId: AgentId, number: number) =>
      activate(deps, scope, agentId, number),
    remove: (scope: InProject, agentId: AgentId) => remove(deps, scope, agentId),
  })
}

export type AgentService = ReturnType<typeof createAgentService>
