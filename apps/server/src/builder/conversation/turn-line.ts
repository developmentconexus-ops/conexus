import type { RunId, TurnFailureCode } from '@conexus/hub-api'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import type { Scalar } from '../../platform/failure.ts'

/** The code of a model's finish that is not a call failure: a refusal, or an answer cut at its limit. */
export const FINISHES: Readonly<Record<string, TurnFailureCode>> = {
  'content-filter': 'MODEL_REFUSED',
  tripwire: 'MODEL_REFUSED',
  length: 'MODEL_ANSWER_CUT',
}

/** What one turn cost, counted as the controller says it: a step and its tokens at a time. */
export class TurnTally {
  steps = 0
  tokens = 0
  /** The most input tokens one step sent: how full the model's window came. */
  maxInputTokens = 0
  cachedInputTokens = 0
  /** The model's finish when the controller says it was not a normal one (`length`, `other`, …). */
  finishReason: string | undefined
  /** The kind of the first tool that failed, never its arguments (security S41). */
  failedTool: string | undefined
  /** How many times the end of the turn judged it (`conexusCheck`), once the run settled. */
  rounds: number | undefined

  heard(event: AgentControllerEvent): void {
    if (event.type === 'usage_update') {
      this.steps += 1
      this.tokens += event.usage.totalTokens
      this.maxInputTokens = Math.max(this.maxInputTokens, event.usage.promptTokens)
      this.cachedInputTokens += event.usage.cachedInputTokens ?? 0
    } else if (event.type === 'error' && event.finishReason !== undefined) {
      this.finishReason = event.finishReason
    }
  }

  failed(kind: string): void {
    this.failedTool ??= kind
  }
}

/**
 * The line a turn leaves in the log (cards of steps 14, U10, and 14.2, criterion 17): how long, how
 * many steps and tokens, the fullest step and the cached input, how it ended and how the model
 * finished, the rounds of its end, and the tool and the code of its error, field by field. Never a
 * message, a command or a file (security S41, S42).
 */
export function turnLine(input: {
  runId: RunId | undefined
  startedAt: string
  tally: TurnTally
  end: string
  errorCode: string | undefined
}): Record<string, Scalar> {
  const { tally } = input
  return {
    ...(input.runId && { runId: input.runId }),
    ms: Date.now() - Date.parse(input.startedAt),
    steps: tally.steps,
    tokens: tally.tokens,
    maxInputTokens: tally.maxInputTokens,
    cachedInputTokens: tally.cachedInputTokens,
    end: input.end,
    ...(tally.finishReason && { finishReason: tally.finishReason }),
    ...(tally.rounds !== undefined && { rounds: tally.rounds }),
    ...(tally.failedTool && { failedTool: tally.failedTool }),
    ...(input.errorCode && { errorCode: input.errorCode }),
  }
}
