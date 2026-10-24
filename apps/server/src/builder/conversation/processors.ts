import type { CheckReport } from '@conexus/app/check'
import { CHECK_LIMITS } from '@conexus/app/check'
import type { MessageList } from '@mastra/core/agent'
import type { OutputProcessor, ProcessOutputStepArgs } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { TaskItemSnapshot } from '@mastra/core/tools'
import { createTool, summarizeTaskCheck, TASK_STATE_TYPE } from '@mastra/core/tools'
import { z } from 'zod'
import type { Runs } from '../runs/public.ts'

export const CHECK_TOOL = 'conexus_check'

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
    id: CHECK_TOOL,
    description: CHECK_DESCRIPTION,
    inputSchema: z.object({}),
    execute: async (_input, { requestContext }) => {
      const checked = await runs.check(requestContext)
      return checked.ok ? checked.value : PLATFORM_FAILED
    },
  })
}

const FailedEnds = z.int().nonnegative().catch(0)
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

/**
 * The end of the turn (cards of steps 14, U4, and 14.2, U4): a step that ends the turn (no tool
 * call, an empty one included) with tasks open goes back to the model with them; one in a turn that
 * changed the app folder is checked, and a failure goes back with the report (`abort` with `retry`).
 * Both count in `CHECK_LIMITS.checks`, and the last lets the turn end, its version kept as
 * unfinished or not built. A machine that could not check costs no attempt; the turn ends, its
 * version kept as unchecked. Each round is told to the run, for the turn's line.
 * The failures are counted in the processor's state, not by `retryCount`, which Mastra 1.78.0 sets
 * back to 0 after any step it did not retry (`agent-*.js`, `nextProcessorRetryCount`), as each step
 * that fixes the app with a tool is.
 */
export function checkGate(deps: { runs: Runs; storage: MastraCompositeStore }): OutputProcessor {
  const { runs } = deps
  return {
    id: 'conexus-check-gate',
    async processOutputStep(args: ProcessOutputStepArgs): Promise<MessageList> {
      const { requestContext, messageList, state } = args
      if (requestContext === undefined || (args.toolCalls?.length ?? 0) > 0) return messageList
      const open = await openTasks(deps.storage, requestContext)
      if (open.length === 0 && !(await runs.changed(requestContext))) return messageList
      const round = FailedEnds.parse(state.rounds) + 1
      state.rounds = round
      runs.rounded(requestContext, round)
      const failed = FailedEnds.parse(state.failed) + 1
      if (open.length > 0) {
        state.failed = failed
        if (failed < CHECK_LIMITS.checks) args.abort(unfinished(open), { retry: true })
        runs.judged(requestContext, { state: 'unfinished', open: open.length })
        return messageList
      }
      const checked = await runs.check(requestContext)
      if (!checked.ok) {
        runs.judged(requestContext, { state: 'unchecked', code: checked.error })
        return messageList
      }
      if (checked.value.ok) {
        runs.judged(requestContext, { state: 'passed' })
        return messageList
      }
      state.failed = failed
      if (failed < CHECK_LIMITS.checks) args.abort(feedback(checked.value, failed), { retry: true })
      runs.judged(requestContext, { state: 'failed', code: 'APP_CHECK_FAILED' })
      return messageList
    },
  }
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
