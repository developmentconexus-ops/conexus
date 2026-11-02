import type { AutomationId, AutomationRun, ConversationId, Next, RunState } from '@conexus/hub-api'
import { AutomationRunId, RunOutcome } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { ScheduleTrigger } from '@mastra/core/storage'
import type { WorkflowState } from '@mastra/core/workflows'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import { conversationIdOf } from '../assistant/public.ts'
import type { AutomationInput } from './run.ts'
import { AUTOMATION_WORKFLOW, triggerOfRows } from './run.ts'

/** Runs per page of the history (code C44). */
const RUNS_PER_PAGE = 20
/** A run has at most two trigger rows (its `published`, and a `failed` when `run.start` threw). */
const ROWS_PER_RUN = 2

/** A page token's text: when the last run shown fired, and its id's ms. */
const Cursor = z
  .string()
  .regex(/^\d{1,15}\.\d{1,15}$/)
  .transform((text) => {
    const [at, ms] = text.split('.').map(Number)
    return { at: at ?? 0, ms: ms ?? 0 }
  })

/** One run as its trigger rows say it: its id, when it was fired and how. */
type Fired = { runId: AutomationRunId; firedAt: number; triggers: ScheduleTrigger[] }

function msOf(runId: AutomationRunId): number {
  return Number(runId.slice(runId.lastIndexOf('_') + 1))
}

/**
 * The page a token names: the last run shown, by when it fired and its id's ms. A token the Hub
 * did not make is `REQUEST_MALFORMED` (code C27).
 */
function cursorOf(page: string | undefined) {
  if (page === undefined) return undefined
  const text = Buffer.from(page, 'base64url').toString('utf8')
  const cursor = Cursor.safeParse(text)
  if (!cursor.success || Buffer.from(text).toString('base64url') !== page) {
    throw new Failure('REQUEST_MALFORMED', { details: { reason: 'PAGE' }, cause: cursor.error })
  }
  return cursor.data
}

function pageAfter(last: Fired): Next {
  const text = `${last.firedAt}.${msOf(last.runId)}`
  return { kind: 'MORE', page: Buffer.from(text).toString('base64url') }
}

/** The trigger rows by run, newest first, a tie broken by the id's ms (Mastra orders by fire only). */
function firedOf(rows: readonly ScheduleTrigger[]): Fired[] {
  const runs = new Map<string, Fired>()
  for (const row of rows) {
    const runId = AutomationRunId.safeParse(row.runId)
    if (!runId.success) continue
    const run = runs.get(runId.data) ?? {
      runId: runId.data,
      firedAt: row.actualFireAt,
      triggers: [],
    }
    run.firedAt = Math.min(run.firedAt, row.actualFireAt)
    run.triggers.push(row)
    runs.set(runId.data, run)
  }
  return [...runs.values()].sort((a, b) => b.firedAt - a.firedAt || msOf(b.runId) - msOf(a.runId))
}

/**
 * How a run stands, from Mastra's run and its trigger rows (the card's map): a run that ended
 * gives its outcome; one still `running` from before this process started was cut, since one Hub
 * runs at a time, and names the conversation it `opened`, if any; one not started yet, or whose
 * publish failed, has only its rows (and is cut too if its process died before creating it).
 */
function stateOf(
  fired: Fired,
  run: WorkflowState | null,
  bootedAt: number,
  opened: ConversationId | null,
): RunState {
  if (run === null) {
    if (fired.triggers.some((each) => each.outcome === 'failed')) {
      return { kind: 'FAILED', code: 'SCHEDULE_PUBLISH_FAILED', conversationId: null }
    }
    // Published by a process that died before it created the run: nothing will ever start it.
    return fired.firedAt < bootedAt
      ? { kind: 'FAILED', code: 'INTERRUPTED', conversationId: null }
      : { kind: 'RUNNING', conversationId: null }
  }
  switch (run.status) {
    case 'success':
      return RunOutcome.parse(run.result)
    case 'running':
    case 'pending':
    case 'waiting':
      return run.createdAt.getTime() < bootedAt
        ? { kind: 'FAILED', code: 'INTERRUPTED', conversationId: opened }
        : { kind: 'RUNNING', conversationId: opened }
    case 'failed':
    case 'tripwire':
    case 'suspended':
    case 'canceled':
    case 'bailed':
    case 'paused':
    case 'skipped': {
      const conversed = z.object({ outcome: RunOutcome }).safeParse(stepOutput(run, 'converse'))
      return conversed.success
        ? conversed.data.outcome
        : { kind: 'FAILED', code: 'INTERNAL_UNEXPECTED', conversationId: null }
    }
    default:
      return run.status satisfies never
  }
}

function stepOutput(run: WorkflowState, step: string): unknown {
  const result = run.steps?.[step]
  return Array.isArray(result) ? undefined : result?.output
}

/** The automation's runs, from Mastra's trigger log and runs (step 24.2, the history). */
export function automationRuns(deps: { mastra: Mastra; bootedAt: number }) {
  async function storeOf<Name extends 'schedules' | 'memory'>(name: Name) {
    const store = await deps.mastra.getStorage()?.getStore(name)
    if (store === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'MASTRA_STORE_MISSING', name },
      })
    }
    return store
  }

  async function triggersOf(id: AutomationId, toActualFireAt: number | undefined, limit: number) {
    return (await storeOf('schedules')).listTriggers(id, {
      limit,
      ...(toActualFireAt === undefined ? {} : { toActualFireAt }),
    })
  }

  /** The conversation of a run not ended, once its `converse` opened it; none before. */
  async function openedOf(input: AutomationInput, runId: AutomationRunId) {
    const threadId = conversationIdOf(input, runId)
    const thread = await (await storeOf('memory')).getThreadById({ threadId })
    return thread === null ? null : threadId
  }

  async function shown(input: AutomationInput, fired: Fired): Promise<AutomationRun> {
    const workflow = deps.mastra.getWorkflow(AUTOMATION_WORKFLOW)
    const run = await workflow.getWorkflowRunById(fired.runId, { fields: ['result', 'steps'] })
    const ongoing =
      run?.status === 'running' || run?.status === 'pending' || run?.status === 'waiting'
    const opened = ongoing ? await openedOf(input, fired.runId) : null
    return {
      runId: fired.runId,
      firedAt: new Date(fired.firedAt).toISOString(),
      trigger: triggerOfRows(fired.triggers),
      state: stateOf(fired, run, deps.bootedAt, opened),
    }
  }

  return {
    /** A page of the runs, newest first (code C44): the token names the last run shown. */
    async page(input: AutomationInput, page: string | undefined) {
      const cursor = cursorOf(page)
      const limit = (RUNS_PER_PAGE + 1) * ROWS_PER_RUN
      // The cursor's own ms is fetched again (the bound is exclusive), so a tie after it is kept.
      const rows = await triggersOf(input.automationId, cursor && cursor.at + 1, limit)
      const later = firedOf(rows).filter(
        (each) =>
          cursor === undefined ||
          each.firedAt < cursor.at ||
          (each.firedAt === cursor.at && msOf(each.runId) < cursor.ms),
      )
      // Past the limit the oldest run may have lost its first row: it waits for the next page.
      const whole = rows.length < limit ? later : later.slice(0, -1)
      const runs = whole.slice(0, RUNS_PER_PAGE)
      const last = runs.at(-1)
      const more = later.length > runs.length && last !== undefined
      const next: Next = more ? pageAfter(last) : { kind: 'END' }
      return { runs: await Promise.all(runs.map((each) => shown(input, each))), next }
    },

    /** The newest run of the automation, or `undefined` before the first. */
    async latest(input: AutomationInput): Promise<AutomationRun | undefined> {
      const [newest] = firedOf(await triggersOf(input.automationId, undefined, ROWS_PER_RUN))
      return newest === undefined ? undefined : shown(input, newest)
    },
  }
}

export type AutomationRuns = ReturnType<typeof automationRuns>
