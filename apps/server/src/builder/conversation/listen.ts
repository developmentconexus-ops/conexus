import type { EventId } from '@conexus/hub-api'
import type { Live } from './live.ts'
import type { Listener, Said } from './turn-log.ts'
import { catchUp } from './turn-log.ts'

/**
 * A stream of a conversation's events: those the turn in progress kept after `lastEventId`, or the
 * turn so far, then each new one until the caller's `signal` or the Hub's `closing` ends it. It
 * listens before it reads the turn, in the same step, so a message sent once the stream is open
 * loses none of its events; `release` lets go of the session when the stream is over.
 */
export function listen(
  live: Live,
  input: {
    signal: AbortSignal
    lastEventId: EventId | null
    release: () => Promise<void>
    closing: AbortSignal
  },
) {
  const { signal, release } = input
  const waiting: Said[] = catchUp(live.turn, input.lastEventId)
  let wake: (() => void) | undefined
  const listener: Listener = (said) => {
    waiting.push(said)
    wake?.()
  }
  live.listeners.add(listener)
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
