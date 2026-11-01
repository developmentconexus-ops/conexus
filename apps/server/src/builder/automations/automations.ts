import type { AutomationSummary, CreateAutomation, ProjectId } from '@conexus/hub-api'
import { AutomationId, AutomationRunId, Cadence, CompanyId } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { WorkflowSchedule } from '@mastra/core/schedules'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Assistant, Owner } from '../assistant/public.ts'
import { assistantOwner, conversationIdOf, offeredOnly } from '../assistant/public.ts'
import { bodyHashOf } from '../conversation/public.ts'
import { ACTIVE_AUTOMATIONS_PER_COMPANY, AUTOMATION_TIMEZONE, cronOf } from './cadence.ts'
import { deleteRunsOf, stored } from './release.ts'
import { AUTOMATION_WORKFLOW, AutomationInput } from './run.ts'
import type { AutomationRuns } from './runs.ts'

type Place = SessionScope['place']

/** What the row's `metadata` keeps beside its `inputData`: the cadence the person chose and the creation's hash (code C37). */
const Metadata = z.object({
  companyId: CompanyId,
  cadence: Cadence,
  bodyHash: z.string(),
})

type Owned = { view: WorkflowSchedule; input: AutomationInput }

export type AutomationsDeps = {
  mastra: Mastra
  assistant: Pick<Assistant, 'admit'>
  connectors: Pick<Connectors['assistant'], 'connections'>
  runs: AutomationRuns
  updating: () => boolean
  log: FailureLog
}

function placeOf(projectId: ProjectId | undefined | null): Place {
  return projectId == null ? { kind: 'COMPANY' } : { kind: 'PROJECT', projectId }
}

function samePlace(a: Place, b: Place): boolean {
  return a.kind === 'COMPANY'
    ? b.kind === 'COMPANY'
    : b.kind === 'PROJECT' && a.projectId === b.projectId
}

/** The automation an attempt names: one id per company, person and key, as a conversation's (code C37). */
function automationIdOf(owner: Owner, attemptKey: string): AutomationId {
  const uuid = conversationIdOf(owner, `automation:${attemptKey}`)
  return AutomationId.parse(`schedule_conexus-automation-${uuid}`)
}

/** A schedule row of an automation, with what it is; a row of another workflow, or unreadable, is none. */
function ownedOf(view: Awaited<ReturnType<Mastra['schedules']['get']>>): Owned | undefined {
  if (view?.workflowId !== AUTOMATION_WORKFLOW) return undefined
  const input = AutomationInput.safeParse(view.inputData)
  return input.success ? { view, input: input.data } : undefined
}

function changed(view: Awaited<ReturnType<Mastra['schedules']['pause']>>): Owned {
  const found = ownedOf(view)
  if (found === undefined) throw new Failure('AUTOMATION_NOT_FOUND')
  return found
}

function isOwner(input: AutomationInput, owner: Owner): boolean {
  return input.companyId === owner.companyId && input.personId === owner.personId
}

async function owned(deps: AutomationsDeps, owner: Owner, id: AutomationId): Promise<Owned> {
  await deps.assistant.admit(owner, { kind: 'COMPANY' })
  const found = ownedOf(await stored(deps.mastra.schedules.get(id)))
  if (found === undefined || !isOwner(found.input, owner)) {
    throw new Failure('AUTOMATION_NOT_FOUND')
  }
  return found
}

async function summaryOf(
  deps: AutomationsDeps,
  { view, input }: Owned,
): Promise<AutomationSummary> {
  const { cadence } = Metadata.parse(view.metadata)
  const offered = await deps.connectors.connections({ ...input, chosen: input.connections })
  const paused = view.status !== 'active'
  return {
    id: input.automationId,
    name: input.name,
    prompt: input.prompt,
    cadence,
    projectId: input.place.kind === 'PROJECT' ? input.place.projectId : null,
    connections: offered.map(({ connectionId, connector, name, chosen }) => ({
      ...{ connectionId, connector, name, chosen },
    })),
    state: paused ? 'PAUSED' : 'ACTIVE',
    nextRunAt: paused ? null : new Date(view.nextFireAt).toISOString(),
    createdAt: new Date(view.createdAt).toISOString(),
  }
}

/** Whether the company holds its most active automations, of every person: the limit counts them all. */
async function atLimit(deps: AutomationsDeps, companyId: CompanyId): Promise<boolean> {
  const active = await stored(
    deps.mastra.schedules.list({ workflowId: AUTOMATION_WORKFLOW, status: 'active' }),
  )
  const count = active.filter((row) => ownedOf(row)?.input.companyId === companyId).length
  return count >= ACTIVE_AUTOMATIONS_PER_COMPANY
}

/** A repeated attempt finds its row: the same body answers it, another is `IDEMPOTENCY_CONFLICT`. */
function repeated(deps: AutomationsDeps, found: Owned, bodyHash: string) {
  if (Metadata.parse(found.view.metadata).bodyHash !== bodyHash) {
    throw new Failure('IDEMPOTENCY_CONFLICT')
  }
  return summaryOf(deps, found)
}

/**
 * A new automation, keyed by its attempt (code C37). Mastra's `create` error has no stable field
 * for a race lost at the row's key (code C52), so any failure reads the row again: there, the race;
 * absent, the database's failure.
 */
async function create(
  deps: AutomationsDeps,
  owner: Owner,
  body: CreateAutomation,
  attemptKey: string,
): Promise<AutomationSummary> {
  const { schedules } = deps.mastra
  const place = placeOf(body.projectId)
  await deps.assistant.admit(owner, place)
  const id = automationIdOf(owner, attemptKey)
  const bodyHash = bodyHashOf(body)
  const earlier = ownedOf(await stored(schedules.get(id)))
  if (earlier !== undefined) return repeated(deps, earlier, bodyHash)
  if (await atLimit(deps, owner.companyId)) throw new Failure('AUTOMATION_LIMIT')
  // A `create` after the scheduler stopped would start it again.
  if (deps.updating()) throw new Failure('HUB_UPDATING')
  const connections = await offeredOnly(deps, { ...owner, place, chosen: [] }, body.connections)
  const input: AutomationInput = {
    ...{ version: 1, automationId: id, ...owner, place },
    ...{ name: body.name, prompt: body.prompt, connections },
  }
  try {
    await schedules.create({
      ...{ id, workflowId: AUTOMATION_WORKFLOW, cron: cronOf(body.cadence) },
      ...{ timezone: AUTOMATION_TIMEZONE, inputData: input, resourceId: assistantOwner(owner) },
      metadata: { companyId: owner.companyId, cadence: body.cadence, bodyHash },
    })
  } catch (error) {
    const raced = ownedOf(await stored(schedules.get(id)))
    if (raced === undefined) throw databaseFailure(error)
    return repeated(deps, raced, bodyHash)
  }
  const { companyId } = owner
  deps.log.info({ companyId, automationId: id, cadence: body.cadence.kind }, 'AUTOMATION_CREATED')
  return summaryOf(deps, await owned(deps, owner, id))
}

/** The person's automations of one place: the Início's, or one live Projeto's. */
async function list(deps: AutomationsDeps, owner: Owner, projectId: ProjectId | undefined) {
  const place = placeOf(projectId)
  await deps.assistant.admit(owner, place)
  const rows = await stored(
    deps.mastra.schedules.list({
      workflowId: AUTOMATION_WORKFLOW,
      resourceId: assistantOwner(owner),
    }),
  )
  const mine = rows.flatMap((row) => {
    const found = ownedOf(row)
    const shown = found !== undefined && isOwner(found.input, owner)
    return shown && samePlace(found.input.place, place) ? [found] : []
  })
  return Promise.all(mine.map((each) => summaryOf(deps, each)))
}

async function pause(deps: AutomationsDeps, owner: Owner, id: AutomationId) {
  await owned(deps, owner, id)
  const view = await stored(deps.mastra.schedules.pause(id))
  deps.log.info({ companyId: owner.companyId, automationId: id }, 'AUTOMATION_PAUSED')
  return summaryOf(deps, changed(view))
}

async function resume(deps: AutomationsDeps, owner: Owner, id: AutomationId) {
  const found = await owned(deps, owner, id)
  // `resume` does not start a stopped scheduler (measured), but its row would fire at the next start.
  if (deps.updating()) throw new Failure('HUB_UPDATING')
  const paused = found.view.status !== 'active'
  if (paused && (await atLimit(deps, owner.companyId))) throw new Failure('AUTOMATION_LIMIT')
  const view = await stored(deps.mastra.schedules.resume(id))
  deps.log.info({ companyId: owner.companyId, automationId: id }, 'AUTOMATION_RESUMED')
  return summaryOf(deps, changed(view))
}

/** Runs the automation now, paused or not, unless its newest run is running (Mastra's `schedules.run`). */
async function runNow(deps: AutomationsDeps, owner: Owner, id: AutomationId) {
  const { input } = await owned(deps, owner, id)
  // `schedules.run` publishes even with the scheduler stopped.
  if (deps.updating()) throw new Failure('HUB_UPDATING')
  const latest = await deps.runs.latest(input)
  if (latest?.state.kind === 'RUNNING') throw new Failure('AUTOMATION_RUNNING')
  const { claimId } = await stored(deps.mastra.schedules.run(id))
  const runId = AutomationRunId.parse(claimId)
  const { companyId } = owner
  deps.log.info({ companyId, automationId: id, runId }, 'AUTOMATION_RUN_REQUESTED')
  return { runId }
}

/** Deletes the row, its triggers with it, then its runs, which keep its `inputData`; the conversations stay. */
async function remove(deps: AutomationsDeps, owner: Owner, id: AutomationId): Promise<void> {
  const { input } = await owned(deps, owner, id)
  await stored(deps.mastra.schedules.delete(id))
  await deleteRunsOf(deps.mastra, input)
  deps.log.info({ companyId: owner.companyId, automationId: id }, 'AUTOMATION_DELETED')
}

/**
 * The person's automations of the Assistant (step 24.2): each one row of Mastra's schedules, what
 * it is in its `inputData`, with no table of the Hub. Every operation admits the person who may
 * ask now (`askAssistant`), and another's automation is `AUTOMATION_NOT_FOUND` (S10).
 */
export function createAutomations(deps: AutomationsDeps) {
  return Object.freeze({
    create: (owner: Owner, body: CreateAutomation, attemptKey: string) =>
      create(deps, owner, body, attemptKey),
    list: (owner: Owner, projectId: ProjectId | undefined) => list(deps, owner, projectId),
    pause: (owner: Owner, id: AutomationId) => pause(deps, owner, id),
    resume: (owner: Owner, id: AutomationId) => resume(deps, owner, id),
    runNow: (owner: Owner, id: AutomationId) => runNow(deps, owner, id),
    remove: (owner: Owner, id: AutomationId) => remove(deps, owner, id),
    async runs(owner: Owner, id: AutomationId, page: string | undefined) {
      const { input } = await owned(deps, owner, id)
      return deps.runs.page(input, page)
    },
  })
}

export type Automations = ReturnType<typeof createAutomations>
