import { CHECK_LIMITS } from '@conexus/app/check'
import { BUILDER_TOOL } from '@conexus/hub-api'
import { createScorer } from '@mastra/core/evals'
import { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { TaskItemSnapshot } from '@mastra/core/tools'
import { createTool, summarizeTaskCheck, TASK_STATE_TYPE } from '@mastra/core/tools'
import { z } from 'zod'
import { turnIn } from '../../harness/model-accounts/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { controllerIn } from '../controller-context/public.ts'
import type { BuilderCheck, Runs } from '../runs/public.ts'
import { conversationIn } from '../runs/public.ts'

/** Conexus OS `e0353c36` `harness/tools.ts:28-33`, with the steps of this check (decision 0055). */
const CHECK_DESCRIPTION = [
  "Runs Conexus's own check on the app folder: it installs the packages from the lockfile, checks that each operation's input and output fit in JSON and generates the client from them, type checks the screens and the server, builds both and opens the app in a browser inside the machine.",
  'The browser opens the entry screen of the app as the Projeto publishes it, on an empty test database and with no connector connected, and the check reports the page errors and the failed requests to the app.',
  'Takes no input and returns one result with a `kind`: MACHINE_FAILED (a step failed, so the browser did not run), CONFERENCE_REFUSED (the app did not start or its migrations were refused), NO_ADDRESS (the Projeto has no address to open, so only the steps ran) or SEEN (the browser opened the entry screen: its report is `browser`, CLEAN or DIRTY with the problems, and `shot`, the screenshot you can read with `mastra_workspace_read_file`). `machine` is the report of the steps: `ok` and each step as passed, failed, informed (with its problems: file, line, column, code, message) or skipped after a failed step.',
  'Run it at the end of each step of the work, and fix what a failed step or a DIRTY report lists before the next one.',
  'If the check could not run, the tool fails with CHECK_PLATFORM_FAILED: it says nothing about the app, so do not change the app because of it.',
  'A passing result proves the app type checks, builds and that its entry screen opens with no page error and no failed request. It does not prove that an operation returns the right data, that another screen opens or that anything saves: prove those another way.',
].join(' ')

/** What `conexus_check` throws when the machine or the browser could not check: no verdict on the app. */
class CheckPlatformRefused extends Error {
  override readonly name = 'CheckPlatformRefused'
}

/** `conexus_check`: the same check as the end of the turn, by the same path (`Runs.check`). */
export function checkTool(runs: Runs) {
  return createTool({
    id: BUILDER_TOOL.check,
    description: CHECK_DESCRIPTION,
    inputSchema: z.object({}),
    execute: async (_input, { requestContext }) => {
      const checked = await runs.check(requestContext)
      if (!checked.ok) throw new CheckPlatformRefused('CHECK_PLATFORM_FAILED')
      return checked.value
    },
  })
}

/** Whether the app passed: the browser saw a clean screen, or the Projeto has no address and the machine's verdict stands. */
function passedBy(check: BuilderCheck): boolean {
  switch (check.kind) {
    case 'MACHINE_FAILED':
    case 'CONFERENCE_REFUSED':
      return false
    case 'NO_ADDRESS':
      return true
    case 'SEEN':
      return check.browser.kind === 'CLEAN'
    default:
      return check satisfies never
  }
}

/** The words of a failed check at the end of the turn, which Mastra gives the model before it answers again. */
function feedback(check: BuilderCheck, failed: number): string {
  return [
    `Conexus checked the app at the end of your turn and the check failed (${failed} of ${CHECK_LIMITS.checks}).`,
    `Fix what it lists and finish again; after ${CHECK_LIMITS.checks} failed checks Conexus saves the code as not built.`,
    'A DIRTY browser report lists the page errors and the failed requests of the entry screen; read its screenshot, `shot`, with mastra_workspace_read_file to see what the screen showed.',
    `The check, as conexus_check returns it: ${JSON.stringify(check)}`,
  ].join(' ')
}

/** The words of a turn that ended with tasks open (card of step 14.2, criterion 15). */
function unfinished(open: TaskItemSnapshot[]): string {
  const count = open.length === 1 ? '1 tarefa aberta' : `${open.length} tarefas abertas`
  const names = open.map((task) => task.content).join('; ')
  return `${count}: ${names}. Termine cada uma, ou marque-a como feita com task_complete, antes de encerrar.`
}

/** The thread's open tasks, from the store `task_check` reads (Mastra's `threadState`, `task-tools.ts:385-391`). */
async function openTasks(
  storage: MastraCompositeStore,
  requestContext: RequestContext,
): Promise<TaskItemSnapshot[]> {
  const { threadId } = controllerIn(requestContext)
  if (threadId === undefined) return []
  const store = await storage.getStore('threadState')
  const tasks = await store?.getState<TaskItemSnapshot[]>({ threadId, type: TASK_STATE_TYPE })
  return summarizeTaskCheck(Array.isArray(tasks) ? tasks : []).incompleteTasks
}

type Verdict = { score: 0 | 1; reason: string }
const FINISHED: Verdict = { score: 1, reason: 'Conexus has nothing more to ask of this turn.' }

/**
 * What the end of the turn is worth (cards of steps 14, U4, and 14.2, U3): a turn that ends (no
 * tool call, an empty one included) with tasks open scores 0 with them; one that changed the app
 * folder is checked, and a failure scores 0 with the report. Mastra gives the reason to the model
 * and calls it again (`isTaskComplete`). Open-task ends and checks each count up to
 * `CHECK_LIMITS.checks` on their own, so open tasks never use up the check's turns, and the last
 * lets the turn end, its version kept as unfinished or not built. A machine that could not check
 * costs no attempt; the turn ends, its version kept as unchecked. Each round is told to the run,
 * for the turn's line. The rounds are the run's, not Mastra's iteration, which counts every step.
 */
async function judge(
  deps: { runs: Runs; storage: MastraCompositeStore },
  requestContext: RequestContext,
): Promise<Verdict> {
  const { runs } = deps
  // The queue ended the turn (a failed call): Mastra's in-process engine still scores that step, and a model call now would find no account.
  if (turnIn(requestContext)?.outcome !== undefined) return FINISHED
  const open = await openTasks(deps.storage, requestContext)
  if (open.length === 0 && !(await runs.changed(requestContext))) return FINISHED
  const kind = open.length > 0 ? 'open' : 'check'
  const round = runs.round(requestContext, kind)
  if (round === 0) return FINISHED
  const last = round >= CHECK_LIMITS.checks
  if (kind === 'open') {
    if (!last) return { score: 0, reason: unfinished(open) }
    runs.judged(requestContext, { state: 'unfinished', open: open.length })
    return FINISHED
  }
  const checked = await runs.check(requestContext)
  if (!checked.ok) {
    runs.judged(requestContext, { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' })
    return FINISHED
  }
  if (passedBy(checked.value)) {
    runs.judged(requestContext, { state: 'passed' })
    return FINISHED
  }
  if (!last) return { score: 0, reason: feedback(checked.value, round) }
  runs.judged(requestContext, { state: 'failed', code: 'APP_CHECK_FAILED' })
  return FINISHED
}

/** The end of the turn as Mastra's `isTaskComplete` scores it, by code (Mastra Code `agent/goal` is a model's judge). */
export function conexusCheck(deps: { runs: Runs; storage: MastraCompositeStore; log: FailureLog }) {
  return createScorer({
    id: 'conexus-check',
    name: 'Conferência do app',
    description: "Open tasks and Conexus's check of the app at the end of the turn.",
  })
    .preprocess(async ({ run }) => {
      const requestContext = new RequestContext<unknown>(Object.entries(run.requestContext ?? {}))
      // Mastra scores a throw 0 and calls the model again, with no cap; a machine that fails here is one that could not check.
      return judge(deps, requestContext).catch((cause: unknown) => {
        const conversationId = conversationIn(requestContext)
        const about = {
          ...(run.runId === undefined ? {} : { runId: run.runId }),
          ...(conversationId === undefined ? {} : { conversationId }),
        }
        logFailure(
          deps.log,
          new Failure('INTERNAL_UNEXPECTED', { cause }),
          about,
          'CHECK_JUDGE_FAILED',
        )
        deps.runs.judged(requestContext, { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' })
        return FINISHED
      })
    })
    .generateScore(({ results }) => results.preprocessStepResult.score)
    .generateReason(({ results }) => results.preprocessStepResult.reason)
}
