import type { ConversationId, FailureCode, RunTrigger } from '@conexus/hub-api'
import {
  AutomationFailureCode,
  AutomationId,
  AutomationRunId,
  CompanyId,
  ConnectionId,
  PersonId,
  ProjectId,
  RunOutcome,
} from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'
import type { Notify } from '../../hub/notifications/public.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Assistant } from '../assistant/public.ts'
import { conversationIdOf } from '../assistant/public.ts'

/**
 * Stored contract: every schedule row names this workflow, and Mastra deletes a row whose target
 * is missing after 3 ticks (`NM:scheduler-3IjINScC.js:146-186`): renaming it deletes every
 * automation within 30 s.
 */
export const AUTOMATION_WORKFLOW = 'conexus-automation-run'
/** A turn nobody watches at 07:00 has no Parar: past this it is aborted, `INTERRUPTED` (code C57). */
export const AUTOMATION_TURN_MS = 15 * 60_000

const Place = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('COMPANY') }),
  z.object({ kind: z.literal('PROJECT'), projectId: ProjectId }),
])

/**
 * What the automation is, the schedule row's `inputData`, parsed when a run starts (code C27).
 * Its `version` lets a later target (an agent, a workflow) join it.
 */
export const AutomationInput = z.object({
  version: z.literal(1),
  automationId: AutomationId,
  companyId: CompanyId,
  personId: PersonId,
  place: Place,
  name: z.string().min(1).max(80),
  prompt: z.string().min(1).max(4000),
  connections: z.array(ConnectionId).max(50),
})
export type AutomationInput = z.infer<typeof AutomationInput>

const Checked = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('GO'), input: AutomationInput }),
  z.object({ kind: z.literal('ENDED'), input: AutomationInput.nullable(), outcome: RunOutcome }),
])
const Conversed = z.object({ input: AutomationInput.nullable(), outcome: RunOutcome })

type Deps = {
  assistant: Pick<Assistant, 'admit' | 'open' | 'turnEnd' | 'asked'>
  notify: Notify
  updating: () => boolean
  turnMs: number
  log: FailureLog
}

function failed(code: FailureCode, conversationId: ConversationId | null): RunOutcome {
  const known = AutomationFailureCode.safeParse(code)
  return {
    kind: 'FAILED',
    code: known.success ? known.data : 'INTERNAL_UNEXPECTED',
    conversationId,
  }
}

/**
 * Whether the owner may still ask the Assistant in the company (a refusal is `NOT_FOUND`, S10), or
 * the failure that kept the Hub from knowing: that one ends the run, it never throws.
 */
async function mayAsk(
  deps: Deps,
  input: AutomationInput,
): Promise<{ kind: 'MAY' } | { kind: 'MAY_NOT' } | { kind: 'UNKNOWN'; failure: Failure }> {
  try {
    await deps.assistant.admit(input, { kind: 'COMPANY' })
    return { kind: 'MAY' }
  } catch (error) {
    if (error instanceof Failure && error.code === 'NOT_FOUND') return { kind: 'MAY_NOT' }
    return { kind: 'UNKNOWN', failure: databaseFailure(error) }
  }
}

/**
 * The run's question in a new conversation of the owner, and how its turn ended; never throws: a
 * failure before the turn has no conversation, one after it keeps the conversation's id.
 */
async function conversed(
  deps: Deps,
  input: AutomationInput,
  runId: AutomationRunId,
): Promise<RunOutcome> {
  const { companyId, automationId } = input
  const fields = { companyId, automationId, runId }
  let opened: ConversationId | null = null
  function ended(outcome: RunOutcome): RunOutcome {
    if (outcome.kind === 'FAILED') {
      deps.log.error({ ...fields, code: outcome.code }, 'AUTOMATION_RUN_FAILED')
    }
    return outcome
  }
  try {
    if (deps.updating()) return ended(failed('INTERRUPTED', null))
    const id = conversationIdOf(input, runId)
    const { session } = await deps.assistant.open({
      ...{ owner: input, place: input.place, id, connections: input.connections },
      automation: { automationId, name: input.name },
    })
    opened = id
    deps.log.info({ ...fields, conversationId: id }, 'AUTOMATION_CONVERSATION_OPENED')
    // A repeated step (the run restarted) finds its question already asked: never twice.
    if (await deps.assistant.asked(input, id)) return ended(failed('INTERRUPTED', id))
    const heard = deps.assistant.turnEnd(session)
    const budget = AbortSignal.timeout(deps.turnMs)
    function stop(): void {
      session.abort()
    }
    budget.addEventListener('abort', stop, { once: true })
    try {
      await session.sendMessage({ content: input.prompt })
      const turn = await heard.ended
      return ended(
        turn.kind === 'DONE' ? { kind: 'DONE', conversationId: id } : failed(turn.code, id),
      )
    } finally {
      heard.stop()
      budget.removeEventListener('abort', stop)
    }
  } catch (error) {
    const failure = databaseFailure(error)
    logFailure(deps.log, failure, fields)
    return ended(failed(failure.code, opened))
  }
}

/**
 * How a run was fired, from its trigger rows (the one owner, read by the history too): Mastra
 * writes a manual run's row after publishing it, in an empty `catch`
 * (`NM:schedules-BfNkiF4x.js:690-699`), so a run without a row is a manual run.
 */
export function triggerOfRows(rows: readonly { triggerKind?: string | null }[]): RunTrigger {
  const kinds = rows.map((each) => each.triggerKind)
  return rows.length > 0 && !kinds.includes('manual') ? 'SCHEDULED' : 'MANUAL'
}

/** The trigger rows of a run: the step gets only the row's `inputData`, and both kinds of `runId` look alike. */
async function triggerOf(mastra: Mastra, input: AutomationInput, runId: AutomationRunId) {
  const store = await mastra.getStorage()?.getStore('schedules')
  if (store === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MASTRA_SCHEDULES_MISSING' } })
  }
  const firedAt = Number(runId.slice(runId.lastIndexOf('_') + 1))
  const rows = await store.listTriggers(input.automationId, {
    fromActualFireAt: firedAt,
    limit: 10,
  })
  return triggerOfRows(rows.filter((each) => each.runId === runId))
}

/**
 * An automation's run (step 24.2), the target of each of its schedule rows: `check` reads the row
 * and admits the owner, pausing the automation of one who may no longer ask; `converse` asks the
 * question in a new conversation of the Assistant and waits for its turn; `notify` tells the owner
 * and gives the run's outcome as the workflow's result.
 */
export function automationRun(deps: Deps) {
  const check = createStep({
    id: 'check',
    inputSchema: z.unknown(),
    outputSchema: Checked,
    async execute({ inputData, runId, mastra }): Promise<z.infer<typeof Checked>> {
      const read = AutomationInput.safeParse(inputData)
      if (!read.success) {
        const failure = new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'AUTOMATION_INPUT', runId },
          cause: read.error,
        })
        logFailure(deps.log, failure)
        return { kind: 'ENDED', input: null, outcome: failed(failure.code, null) }
      }
      const input = read.data
      const fields = { companyId: input.companyId, automationId: input.automationId, runId }
      const asking = await mayAsk(deps, input)
      if (asking.kind === 'UNKNOWN') {
        logFailure(deps.log, asking.failure, fields)
        return { kind: 'ENDED', input, outcome: failed(asking.failure.code, null) }
      }
      if (asking.kind === 'MAY_NOT') {
        await mastra.schedules.pause(input.automationId)
        deps.log.info(fields, 'AUTOMATION_PAUSED')
        const outcome = { kind: 'SKIPPED', reason: 'OWNER_CANNOT_ASK' } as const
        return { kind: 'ENDED', input, outcome }
      }
      deps.log.info(fields, 'AUTOMATION_FIRED')
      return { kind: 'GO', input }
    },
  })
  const converse = createStep({
    id: 'converse',
    inputSchema: Checked,
    outputSchema: Conversed,
    async execute({ inputData, runId }): Promise<z.infer<typeof Conversed>> {
      if (inputData.kind === 'ENDED') return inputData
      const { input } = inputData
      return { input, outcome: await conversed(deps, input, AutomationRunId.parse(runId)) }
    },
  })
  const notify = createStep({
    id: 'notify',
    inputSchema: Conversed,
    outputSchema: RunOutcome,
    async execute({ inputData, runId, mastra }): Promise<RunOutcome> {
      const { input, outcome } = inputData
      if (input === null) return outcome
      const id = AutomationRunId.parse(runId)
      const trigger = await triggerOf(mastra, input, id)
      await deps.notify.automationRan({
        ...{ companyId: input.companyId, personId: input.personId },
        ...{ automationId: input.automationId, name: input.name },
        projectId: input.place.kind === 'PROJECT' ? input.place.projectId : null,
        ...{ runId: id, trigger, outcome },
      })
      return outcome
    },
  })
  return createWorkflow({
    id: AUTOMATION_WORKFLOW,
    inputSchema: z.unknown(),
    outputSchema: RunOutcome,
  })
    .then(check)
    .then(converse)
    .then(notify)
    .commit()
}
