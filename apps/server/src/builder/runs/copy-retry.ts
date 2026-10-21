const FIRST_MS = 30_000
const LONGEST_MS = 600_000

/**
 * The retry of the copies the bucket did not take (card, the clocks): a timer runs only while one
 * is pending, from `FIRST_MS` doubling to `LONGEST_MS`. `attempt` answers whether any is still pending.
 */
export function createCopyRetry(attempt: () => Promise<boolean>) {
  let active = false
  let timer: NodeJS.Timeout | undefined
  let wait = FIRST_MS
  async function tick() {
    const pending = await attempt().then(
      (left) => left,
      () => true,
    )
    wait = pending ? Math.min(wait * 2, LONGEST_MS) : FIRST_MS
    active = pending
    if (pending) arm()
  }
  function arm() {
    timer = setTimeout(() => void tick(), wait)
    timer.unref()
  }
  return {
    /** A copy is pending: starts the timer if it does not run. */
    kick() {
      if (active) return
      active = true
      arm()
    },
    stop() {
      active = false
      clearTimeout(timer)
    },
  }
}
