import type { CheckReport } from '@conexus/app/check'
import { CHECK_LIMITS } from '@conexus/app/check'
import { BUILDER_TOOL } from '@conexus/hub-api'
import { createScorer } from '@mastra/core/evals'
import type { OutputProcessor } from '@mastra/core/processors'
import { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { TaskItemSnapshot } from '@mastra/core/tools'
import { createTool, summarizeTaskCheck, TASK_STATE_TYPE } from '@mastra/core/tools'
import { z } from 'zod'
import { turnIn } from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'

/** Conexus OS `e0353c36` `harness/tools.ts:28-33`, with the steps of this check (decision 0055). */
const CHECK_DESCRIPTION = [
  "Runs Conexus's own check on the app folder: it installs the packages from the lockfile, checks that each operation's input and output fit in JSON and generates the client from them, type checks the screens and the server, builds both and opens the app in a browser.",
  'Takes no input and returns one report: `ok` and each step as passed, failed, informed (with its problems: file, line, column, code, message) or skipped after a failed step.',
  'Run it at the end of each step of the work, and fix what a failed step lists before the next one.',
  'A passing report proves the app type checks, builds and opens. It does not prove that an operation returns the right data, that a screen shows the right values or that anything saves: prove those another way.',
].join(' ')

/** What the model reads when the machine could not check: no verdict on the app. */
const PLATFORM_FAILED = {
  error: 'CHECK_PLATFORM_FAILED',
  message: 'The machine could not run the check, which says nothing about the app.',
  isError: true,
} as const

/** `conexus_check`: the same check as the end of the turn, by the same path (`Runs.check`). */
export function checkTool(runs: Runs) {
  return createTool({
    id: BUILDER_TOOL.check,
    description: CHECK_DESCRIPTION,
    inputSchema: z.object({}),
    execute: async (_input, { requestContext }) => {
      const checked = await runs.check(requestContext)
      return checked.ok ? checked.value : PLATFORM_FAILED
    },
  })
}

const ControllerThread = z.object({ threadId: z.string() })

/** The words of a failed check at the end of the turn, which Mastra gives the model before it answers again. */
function feedback(report: CheckReport, failed: number): string {
  return [
    `Conexus checked the app at the end of your turn and the check failed (${failed} of ${CHECK_LIMITS.checks}).`,
    `Fix what it lists and finish again; after ${CHECK_LIMITS.checks} failed checks Conexus saves the code as not built.`,
    `The report, as conexus_check returns it: ${JSON.stringify(report)}`,
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
  const controller = ControllerThread.safeParse(requestContext.get('controller'))
  if (!controller.success) return []
  const store = await storage.getStore('threadState')
  const { threadId } = controller.data
  const tasks = await store?.getState<TaskItemSnapshot[]>({ threadId, type: TASK_STATE_TYPE })
  return summarizeTaskCheck(Array.isArray(tasks) ? tasks : []).incompleteTasks
}

type Verdict = { score: 0 | 1; reason: string }
const FINISHED: Verdict = { score: 1, reason: 'Conexus has nothing more to ask of this turn.' }

/**
 * What the end of the turn is worth (cards of steps 14, U4, and 14.2, U3): a turn that ends (no
 * tool call, an empty one included) with tasks open scores 0 with them; one that changed the app
 * folder is checked, and a failure scores 0 with the report. Mastra gives the reason to the model
 * and calls it again (`isTaskComplete`). Both count in `CHECK_LIMITS.checks`, and the last lets the
 * turn end, its version kept as unfinished or not built. A machine that could not check costs no
 * attempt; the turn ends, its version kept as unchecked. Each round is told to the run, for the
 * turn's line. The rounds are the run's, not Mastra's iteration, which counts every step.
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
  const round = runs.round(requestContext)
  if (round === 0) return FINISHED
  const last = round >= CHECK_LIMITS.checks
  if (open.length > 0) {
    if (!last) return { score: 0, reason: unfinished(open) }
    runs.judged(requestContext, { state: 'unfinished', open: open.length })
    return FINISHED
  }
  const checked = await runs.check(requestContext)
  if (!checked.ok) {
    runs.judged(requestContext, { state: 'unchecked', code: checked.error })
    return FINISHED
  }
  if (checked.value.ok) {
    runs.judged(requestContext, { state: 'passed' })
    return FINISHED
  }
  if (!last) return { score: 0, reason: feedback(checked.value, round) }
  runs.judged(requestContext, { state: 'failed', code: 'APP_CHECK_FAILED' })
  return FINISHED
}

/** The end of the turn as Mastra's `isTaskComplete` scores it, by code (Mastra Code `agent/goal` is a model's judge). */
export function conexusCheck(deps: { runs: Runs; storage: MastraCompositeStore }) {
  return createScorer({
    id: 'conexus-check',
    name: 'Conferência do app',
    description: "Open tasks and Conexus's check of the app at the end of the turn.",
  })
    .preprocess(async ({ run }) => {
      const requestContext = new RequestContext<unknown>(Object.entries(run.requestContext ?? {}))
      // Mastra scores a throw 0 and calls the model again, with no cap; a machine that fails here is one that could not check.
      return judge(deps, requestContext).catch(() => {
        deps.runs.judged(requestContext, { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' })
        return FINISHED
      })
    })
    .generateScore(({ results }) => results.preprocessStepResult.score)
    .generateReason(({ results }) => results.preprocessStepResult.reason)
}

/**
 * Mastra saves a workspace tool's `data-workspace-metadata` chunk under the run's first message id,
 * over the sealed row a task signal left behind (Mastra issue #21940), and the row loses its
 * reasoning, text and tool parts. Nothing reads the chunk, so it is only streamed.
 */
export const workspaceMetadataLive: OutputProcessor = {
  id: 'conexus-workspace-metadata-live',
  processDataParts: true,
  async processOutputStream({ part }) {
    return part.type === 'data-workspace-metadata' ? { ...part, transient: true } : part
  },
}
