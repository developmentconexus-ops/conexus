import { useMutationState } from '@tanstack/react-query'

const WHILE_RUNNING = 5_000
/** How long after the person's own request a screen reads on: the Hub may open the run after the first re-read. */
const AFTER_REQUEST = 30_000

/**
 * The `refetchInterval` of a read that follows a run: every 5 s while `isRunning` says one is open,
 * and for a bounded time after a write of `ownWrites` sent from this browser (web W12).
 */
export function useFollowRun<Data>(
  ownWrites: ReadonlySet<unknown>,
  isRunning: (data: Data | undefined) => boolean,
) {
  const sent = useMutationState({
    filters: {
      predicate: (one) => ownWrites.has(one.options.mutationKey?.[0]),
    },
    select: (one) => one.state.submittedAt,
  })
  const lastSent = Math.max(0, ...sent)
  return (query: { state: { data: Data | undefined } }) =>
    isRunning(query.state.data) || Date.now() - lastSent < AFTER_REQUEST ? WHILE_RUNNING : false
}
