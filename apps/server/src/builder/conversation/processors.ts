import type { CheckReport } from '@conexus/app/check'
import { CHECK_LIMITS } from '@conexus/app/check'
import type { MessageList } from '@mastra/core/agent'
import type { OutputProcessor, ProcessOutputStepArgs } from '@mastra/core/processors'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Runs } from '../runs/public.ts'

export const CHECK_TOOL = 'conexus_check'

/** Conexus OS `e0353c36` `harness/tools.ts:28-33`, with the steps of this check (decision 0055). */
const CHECK_DESCRIPTION = [
  "Runs Conexus's own check on the app folder: it checks the packages against the approved ones and installs them, generates the client from the operations, type checks the screens and the server, builds both and opens the app in a browser.",
  'Takes no input and returns one report: `ok` and each step as passed, failed, informed (with its problems: file, line, column, code, message) or skipped after a failed step.',
  'Run it at the end of each step of the work, and fix what a failed step lists before the next one.',
  'A passing report proves the app type checks, builds and opens. It does not prove that an operation returns the right data, that a screen shows the right values or that anything saves: prove those another way.',
].join(' ')

/** What the model reads when the machine could not check: no verdict on the app. */
const PLATFORM_FAILED = {
  error: 'CHECK_PLATFORM_FAILED',
  message: 'The machine could not run the check, which says nothing about the app.',
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

const FailedChecks = z.int().nonnegative().catch(0)

/** The words of a failed check at the end of the turn, which Mastra gives the model before it answers again. */
function feedback(report: CheckReport, failed: number): string {
  return [
    `Conexus checked the app at the end of your turn and the check failed (${failed} of ${CHECK_LIMITS.checks}).`,
    `Fix what it lists and finish again; after ${CHECK_LIMITS.checks} failed checks Conexus saves the code as not built.`,
    `The report, as conexus_check returns it: ${JSON.stringify(report)}`,
  ].join(' ')
}

/**
 * The check at the end of the turn (card of step 14, U4): a step that ends the turn (no tool call)
 * in a turn that changed the app folder is checked; a failure goes back to the model with the
 * report (`abort` with `retry`), and the last failure of `CHECK_LIMITS.checks` lets the turn end,
 * the code kept as not built. A machine that could not check gives no verdict and costs no attempt.
 * The failures are counted in the processor's state, not by `retryCount`, which Mastra 1.78.0 sets
 * back to 0 after any step it did not retry (`agent-*.js`, `nextProcessorRetryCount`), as each step
 * that fixes the app with a tool is.
 */
export function checkGate(runs: Runs): OutputProcessor {
  return {
    id: 'conexus-check-gate',
    async processOutputStep(args: ProcessOutputStepArgs): Promise<MessageList> {
      const { requestContext, messageList, state } = args
      if (requestContext === undefined || (args.toolCalls?.length ?? 0) > 0) return messageList
      if (!(await runs.changed(requestContext))) return messageList
      const checked = await runs.check(requestContext)
      if (!checked.ok) return messageList
      if (checked.value.ok) {
        runs.judged(requestContext, { state: 'passed' })
        return messageList
      }
      const failed = FailedChecks.parse(state.failed) + 1
      state.failed = failed
      if (failed < CHECK_LIMITS.checks) args.abort(feedback(checked.value, failed), { retry: true })
      runs.judged(requestContext, { state: 'failed', code: 'APP_CHECK_FAILED' })
      return messageList
    },
  }
}
