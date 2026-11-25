import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { EndParts, TurnEnds } from '../../harness/turn/public.ts'
import type { Settled } from './runs/context.ts'
import type { Runs } from './runs/runs.ts'
import type { Refusals } from './turn-of.ts'

/** The Builder's settled turn as the parts of our message and what the end keeps of it. */
function endOf(settled: Settled): EndParts {
  const parts: MastraMessagePart[] = []
  if (settled.kind === 'saved') parts.push({ type: 'data-conexus-version', data: settled.version })
  if (settled.preview !== undefined)
    parts.push({ type: 'data-conexus-preview', data: settled.preview })
  return {
    ...{ parts, rounds: settled.rounds, again: settled.preview?.state === 'sending' },
    ...(settled.kind === 'failed' && { failure: settled.code }),
  }
}

/**
 * The Builder's end of a turn: its Projeto settled by `Runs.finish` (a version and its Preview),
 * the Projeto busy as `turnOf` recorded it, and its machine's steps.
 */
export function builderEnds(runs: Pick<Runs, 'finish' | 'onPhase'>, refusals: Refusals): TurnEnds {
  return {
    async finish(input) {
      const settled = await runs.finish({
        ...{ conversationId: input.conversationId, reason: input.reason },
        saved: (each) => input.told(endOf(each)),
      })
      return settled === 'gone' ? settled : endOf(settled)
    },
    refusal(conversationId) {
      const refused = refusals.read(conversationId)
      if (refused === undefined) return undefined
      return refused.person === undefined
        ? { code: refused.code }
        : { code: refused.code, person: refused.person }
    },
    onPhase: (...args) => runs.onPhase(...args),
  }
}
