import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { Runs, Settled } from '../runs/public.ts'
import type { EndParts, TurnEnds } from './end.ts'
import { busyIn } from './turn-of.ts'

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
 * the Projeto busy read on the run's error (`turnOf`), and its machine's steps.
 */
export function builderEnds(runs: Pick<Runs, 'finish' | 'onPhase'>): TurnEnds {
  return {
    async finish(input) {
      const settled = await runs.finish({
        ...{ conversationId: input.conversationId, reason: input.reason },
        saved: (each) => input.told(endOf(each)),
      })
      return settled === 'gone' ? settled : endOf(settled)
    },
    refusal(error) {
      const busy = busyIn(error)
      if (busy === undefined) return undefined
      return busy.person === undefined
        ? { code: 'RUN_BUSY' }
        : { code: 'RUN_BUSY', person: busy.person }
    },
    onPhase: (...args) => runs.onPhase(...args),
  }
}
