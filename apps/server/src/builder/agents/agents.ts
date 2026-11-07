import type {
  AgentDetail,
  AgentId,
  CompanyId,
  CreateAgent,
  DraftPatch,
  ProjectId,
  Publish,
} from '@conexus/hub-api'
import { AgentConfig, AgentId as AgentIdSchema } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { bodyHashOf } from '../conversation/public.ts'
import type {
  InProject,
  OfferedConnection,
  ToolConnectors,
  Tools,
  ToolsDeps,
  Writer,
} from '../tools/public.ts'
import { admitted, databaseScopeOf, derivedUuid, sessionScopeOf } from '../tools/public.ts'
import { choose } from './choose.ts'
import type { AgentEvent } from './events.ts'
import { legacyReads } from './legacy.ts'
import { invalidField, makeActive, published } from './publish.ts'
import {
  agentIn,
  agentsIn,
  agentsOfCompany,
  detailOf,
  listedOf,
  ofProject,
  versionsOf,
} from './store.ts'
import { agent, agentVersion } from './tables.ts'

export type AgentsDeps = Pick<ToolsDeps, 'database' | 'identity' | 'liveProjectOf'> & {
  /** The ids of the company's live Projetos (`liveProjectIdsOf`). */
  liveProjectIdsOf: (tx: ReadTx, companyId: CompanyId) => Promise<ProjectId[]>
  connectors: ToolConnectors
  /** Whether the model selector lists a model (`isChoosable`). */
  isChoosable: (model: string) => boolean
  tools: Tools
  emit: (event: AgentEvent) => Promise<void>
  log: FailureLog
}

/** What the page shows: every read of the connections, those the editor's role lacks marked `allowed: false`. */
function shownOf(deps: AgentsDeps, scope: InProject) {
  return deps.connectors.listing(sessionScopeOf(scope))
}

function offered(deps: AgentsDeps, scope: InProject) {
  return deps.connectors.connections(sessionScopeOf(scope))
}

function defaults(body: CreateAgent): AgentConfig {
  return {
    ...{ name: body.name, description: body.description ?? '', instructions: '', model: null },
    ...{
      memory: { observational: true },
      connections: [],
      web: false,
      appData: false,
      byTool: true,
      machine: false,
    },
  }
}

async function detail(
  tx: ReadTx,
  scope: InProject,
  id: AgentId,
  shown: readonly OfferedConnection[],
) {
  return detailOf(tx, await agentIn(tx, scope, id), shown)
}

/** A new agent of the Projeto as a draft, keyed by its attempt (code C37). */
async function create(deps: AgentsDeps, scope: InProject, body: CreateAgent, attemptKey: string) {
  const id = AgentIdSchema.parse(derivedUuid('agent', scope.companyId, scope.personId, attemptKey))
  const bodyHash = bodyHashOf({ ...body, projectId: scope.projectId })
  const shown = await shownOf(deps, scope)
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
    return { fresh: inserted !== undefined, agent: await detail(tx, scope, id, shown) }
  })
  if (made.fresh) deps.log.info({ companyId: scope.companyId, agentId: id }, 'AGENT_CREATED')
  return made.agent
}

async function list(deps: AgentsDeps, scope: InProject) {
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    return listedOf(tx, await agentsIn(tx, scope))
  })
}

/** The agents of every live Projeto of the company, for a person who may read them. */
async function listCompany(deps: AgentsDeps, ids: Pick<InProject, 'companyId' | 'personId'>) {
  const { companyId, personId } = ids
  return deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
    await deps.identity.admitMember({ tx, companyId, personId, action: 'readAgents' })
    const live = await deps.liveProjectIdsOf(tx, companyId)
    return listedOf(tx, await agentsOfCompany(tx, companyId, live))
  })
}

async function get(deps: AgentsDeps, scope: InProject, agentId: AgentId) {
  const shown = await shownOf(deps, scope)
  return deps.database.read(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'readAgents')
    return detail(tx, scope, agentId, shown)
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
  return AgentConfig.parse({ ...current, ...given, byTool: true })
}

/**
 * Changes the draft at the revision the writer read (code C38): the update holds the row, so of
 * two at the same revision one writes and the other finds no row (`AGENT_DRAFT_STALE`).
 */
async function saveDraft(
  deps: AgentsDeps,
  scope: InProject,
  agentId: AgentId,
  patch: DraftPatch,
  by: Writer,
) {
  const around = await offered(deps, scope)
  const shown = await shownOf(deps, scope)
  checked(deps, patch, around)
  const before = await deps.database.read(databaseScopeOf(scope), async (tx) =>
    AgentConfig.parse((await agentIn(tx, scope, agentId)).row.draft),
  )
  // A draft written before E4 is written in the new shape now: the kit's reads of its
  // connections become chosen tools, and its connections the selected ones.
  const old = before.byTool
    ? []
    : legacyReads(
        await deps.connectors.kitReads(sessionScopeOf(scope)),
        patch.connections ?? before.connections,
      ).map(({ connectionId, operation }) => ({ connectionId, operation }))
  const ready = await deps.tools.readyOf(scope, [...(patch.ready ?? []), ...old])
  const reshapes =
    patch.tools !== undefined ||
    patch.connections !== undefined ||
    ready.length > 0 ||
    !before.byTool
  const saved = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'manageAgents')
    const { row } = await agentIn(tx, scope, agentId)
    const next = merged(AgentConfig.parse(row.draft), patch)
    const [changed] = await tx
      .update(agent)
      .set({
        draft: next,
        revision: sql`${agent.revision} + 1`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(agent.id, agentId), eq(agent.revision, patch.revision)))
      .returning({ revision: agent.revision })
    if (changed === undefined) throw new Failure('AGENT_DRAFT_STALE')
    if (reshapes) {
      const homes = await choose(deps, tx, { scope, agentId, patch, around }, ready)
      // The connection of every chosen tool is selected (decision E4).
      const connections = [...new Set([...next.connections, ...homes])]
      if (connections.length !== next.connections.length) {
        await tx
          .update(agent)
          .set({ draft: { ...next, connections } })
          .where(eq(agent.id, agentId))
      }
    }
    return { revision: changed.revision, agent: await detail(tx, scope, agentId, shown) }
  })
  const { companyId } = scope
  deps.log.info({ companyId, agentId, revision: saved.revision, by }, 'AGENT_DRAFT_SAVED')
  return saved.agent
}

/** Publishes the draft of the revision read (`published`), then says so once it committed. */
async function publish(deps: AgentsDeps, scope: InProject, agentId: AgentId, body: Publish) {
  const around = await offered(deps, scope)
  const shown = await shownOf(deps, scope)
  const kit = await deps.connectors.kitReads(sessionScopeOf(scope))
  const done = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'publishAgent')
    return published(tx, scope, { agentId, body, around, kit, identity: deps.identity })
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
    return { agent: await detailOf(tx, listed, shown), version }
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
  const shown = await shownOf(deps, scope)
  const made = await deps.database.command(databaseScopeOf(scope), async (tx) => {
    await admitted(deps, tx, scope, 'publishAgent')
    await agentIn(tx, scope, agentId)
    const [version] = await tx
      .select({ number: agentVersion.number })
      .from(agentVersion)
      .where(and(eq(agentVersion.agentId, agentId), eq(agentVersion.number, number)))
    if (version === undefined) throw new Failure('AGENT_VERSION_NOT_FOUND')
    await makeActive(tx, agentId, number)
    return detail(tx, scope, agentId, shown)
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
    listCompany: (ids: Pick<InProject, 'companyId' | 'personId'>) => listCompany(deps, ids),
    get: (scope: InProject, agentId: AgentId) => get(deps, scope, agentId),
    saveDraft: (
      scope: InProject,
      agentId: AgentId,
      patch: DraftPatch,
      by: Writer,
    ): Promise<AgentDetail> => saveDraft(deps, scope, agentId, patch, by),
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
