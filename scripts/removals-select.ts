// Defect: a pull request that touches no protection waited for all the removal proofs (testing T12).
// On a pull request a row runs when the diff changes the file it takes the protection out of, the
// test file it runs, or the row itself in removals.json; the founder's rule (2026-10-24, "A"). What
// a row's files import, a shared helper, a lockfile or a migration does not select it: the suites
// run those changes, and every push to main runs every row, as does a pull request carrying the
// `all-removals` label (`pullRequestRunsEverything`).
// The selection is proved in removals-select.test.ts.
import { posix } from 'node:path'

export type Row = { id: string; file: string; test: { cwd: string; file: string } }
export type PullRequest = { title: string; headRef: string; labels: string[] }

/** Why every row runs on this pull request, when one does: the label. */
export function pullRequestRunsEverything(pullRequest: PullRequest): string | undefined {
  return pullRequest.labels.includes('all-removals') ? 'the all-removals label' : undefined
}

/** The rows `changed` (repository paths) affects; `base` holds the rows the pull request started from. */
export function affected<T extends Row>(rows: T[], changed: string[], base: Row[]): T[] {
  const before = new Map(base.map((row) => [row.id, JSON.stringify(row)]))
  const touched = new Set(changed)
  return rows.filter(
    (row) =>
      before.get(row.id) !== JSON.stringify(row) ||
      touched.has(row.file) ||
      touched.has(posix.join(row.test.cwd, row.test.file)),
  )
}
