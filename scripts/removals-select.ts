// Defect: a pull request that touches no protection waited for all the removal proofs (testing T12).
// A row is affected when the diff touches the file it takes the protection out of, the test file it
// runs, or the row itself in removals.json. A change to the runner itself affects every row. The
// full set runs on every push to main and, by label, before a step's review: a change outside a
// row's two files that makes another layer refuse first shows there.
// The selection is proved in removals-select.test.ts.
import { posix } from 'node:path'

const MACHINERY = new Set(['scripts/removals.ts', 'scripts/removals-select.ts'])

export type Row = { id: string; file: string; test: { cwd: string; file: string } }

/** The rows `changed` (repository paths) affects; `base` holds the rows the pull request started from. */
export function affected<T extends Row>(rows: T[], changed: string[], base: Row[]): T[] {
  if (changed.some((file) => MACHINERY.has(file))) return rows
  const touched = new Set(changed)
  const before = new Map(base.map((row) => [row.id, JSON.stringify(row)]))
  return rows.filter(
    (row) =>
      touched.has(row.file) ||
      touched.has(posix.join(row.test.cwd, row.test.file)) ||
      before.get(row.id) !== JSON.stringify(row),
  )
}
