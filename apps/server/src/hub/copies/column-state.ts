import { z } from 'zod'

export const ColumnState = z.record(
  z.string(),
  z.object({ seenAt: z.iso.datetime(), inactiveSince: z.iso.datetime().nullable() }),
)
export type ColumnState = z.infer<typeof ColumnState>

/** What a run saw of the columns: those that came, whether every source read all, and the rows read. */
export type Seen = { present: Set<string>; whole: boolean; rows: number }

/**
 * The state after a COMPLETE run (C5): a column that came is active; one seen before and absent
 * from a whole read with rows is inactive since the run began.
 */
export function nextColumnState(a: {
  previous: ColumnState
  columns: readonly string[]
  seen: Seen
  began: Date
}): ColumnState {
  const { previous, columns, seen, began } = a
  const at = began.toISOString()
  const next: ColumnState = {}
  for (const name of columns) {
    const before = previous[name]
    if (seen.present.has(name)) next[name] = { seenAt: at, inactiveSince: null }
    else if (seen.whole && seen.rows > 0 && before !== undefined) {
      next[name] = { ...before, inactiveSince: before.inactiveSince ?? at }
    } else if (before !== undefined) next[name] = before
  }
  return next
}
