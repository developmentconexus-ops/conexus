/** A lease lasts this long past its last renewal; a copy of the program renews it three times in that. */
export const LEASE_MS = 90_000
export const RENEW_MS = 30_000

/**
 * Keeps a turn's lease while it runs (data D25): `renew` answers whether the row is still this
 * copy's. A renewal that fails or is refused calls `lost` once and stops. Returns the stop.
 */
export function holdLease(input: {
  renew: () => Promise<boolean>
  lost: () => void
  everyMs?: number
}): () => void {
  let held = true
  async function tick() {
    const ours = await input.renew().then(
      (renewed) => renewed,
      () => false,
    )
    if (ours || !held) return
    held = false
    clearInterval(timer)
    input.lost()
  }
  const timer = setInterval(() => void tick(), input.everyMs ?? RENEW_MS)
  timer.unref()
  return () => {
    held = false
    clearInterval(timer)
  }
}

/**
 * Runs `work` every `everyMs`, one at a time, until the returned stop: the look for the runs a lost
 * copy left (data D25). A failure of `work` goes to `failed` and the next look goes on.
 */
export function repeatEvery(input: {
  everyMs: number
  work: () => Promise<void>
  failed: (error: unknown) => void
}): () => void {
  let busy = false
  const timer = setInterval(() => {
    if (busy) return
    busy = true
    input
      .work()
      .catch(input.failed)
      .finally(() => {
        busy = false
      })
  }, input.everyMs)
  timer.unref()
  return () => clearInterval(timer)
}
