import type { RunId } from '@conexus/hub-api'
import type { Scalar } from '../../platform/failure.ts'

/** What one turn cost, counted as the controller says it: a step and its tokens at a time. */
export class TurnTally {
  steps = 0
  tokens = 0
  /** The kind of the first tool that failed, never its arguments (security S41). */
  failedTool: string | undefined

  step(totalTokens: number): void {
    this.steps += 1
    this.tokens += totalTokens
  }

  failed(kind: string): void {
    this.failedTool ??= kind
  }
}

/**
 * The line a turn leaves in the log (card, U10): how long, how many steps and tokens, how it
 * ended, and the tool and the code of its error, field by field. The request's trace id ties it to
 * the request that began the turn. Never a message, a command or a file (security S41, S42).
 */
export function turnLine(input: {
  runId: RunId | undefined
  traceId: string | undefined
  startedAt: string
  tally: TurnTally
  end: string
  errorCode: string | undefined
}): Record<string, Scalar> {
  const { tally } = input
  return {
    ...(input.runId && { runId: input.runId }),
    ...(input.traceId && { traceId: input.traceId }),
    ms: Date.now() - Date.parse(input.startedAt),
    steps: tally.steps,
    tokens: tally.tokens,
    end: input.end,
    ...(tally.failedTool && { failedTool: tally.failedTool }),
    ...(input.errorCode && { errorCode: input.errorCode }),
  }
}
