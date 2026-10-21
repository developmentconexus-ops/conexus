/** A lease lasts this long past its last renewal; a copy of the program renews it three times in that. */
export const LEASE_MS = 90_000
const RENEW_MS = 30_000

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
