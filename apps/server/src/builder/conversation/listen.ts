import type { EventId } from '@conexus/hub-api'
import type { Runs } from '../runs/public.ts'
import { catchUp } from './catch-up.ts'
import type { Live } from './live.ts'
import type { Listener, Said } from './turn-log.ts'
import { onceEach } from './turn-log.ts'

/**
 * A stream of a conversation's events: those the journal kept after `lastEventId`, or the turn in
 * progress first, then each new one until the caller's `signal` or the Hub's `closing` ends it. It
 * listens before it reads the journal, so a message sent once the stream is open loses none of its
 * events; `release` lets go of the session when the stream is over.
 */
export async function listen(
  live: Live,
  input: {
    signal: AbortSignal
    lastEventId: EventId | null
    release: () => Promise<void>
    runs: Runs
    closing: AbortSignal
  },
) {
  const { signal, release } = input
  const waiting: Said[] = []
  // What the turn says while the journal is read joins `waiting` after what the read found; an
  // event both hold, as one kept before the read and told after it, is said once (`onceEach`).
  const early: Said[] = []
  const fresh = onceEach()
  let gathering = true
  let wake: (() => void) | undefined
  const listener: Listener = (said) => {
    if (gathering) early.push(said)
    else waiting.push(...fresh([said]))
    wake?.()
  }
  live.listeners.add(listener)
  try {
    const where = { companyId: live.owner.companyId, conversationId: live.conversationId }
    waiting.push(...fresh(await catchUp(input.runs, where, input.lastEventId)), ...fresh(early))
  } catch (error) {
    live.listeners.delete(listener)
    await release()
    throw error
  } finally {
    gathering = false
  }
  function stop() {
    wake?.()
  }
  const ended = AbortSignal.any([signal, input.closing])
  ended.addEventListener('abort', stop, { once: true })
  async function* drained() {
    try {
      while (!ended.aborted) {
        const next = waiting.shift()
        if (next !== undefined) yield next
        else await new Promise<void>((resolve) => (wake = resolve))
        wake = undefined
      }
    } finally {
      ended.removeEventListener('abort', stop)
      live.listeners.delete(listener)
      await release()
    }
  }
  return drained()
}
