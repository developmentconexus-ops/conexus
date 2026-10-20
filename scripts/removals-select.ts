// Defect: a pull request that touches no protection waited for all the removal proofs (testing T12).
// A row is affected when the diff touches a file its proof reads: the file it takes the protection
// out of or the test file it runs, or anything either imports, through the import graph that
// dependency-cruiser draws (the same one `npm run deps` enforces), or the row itself in
// removals.json. Where the graph cannot be exact, the selection fails toward running more:
//   - a row deleted from removals.json, because its proof is gone and the protection it named may
//     have been weakened in the same diff, runs every remaining row;
//   - a file the graph does not see but a test reads (a SQL file, a migration, a lockfile, a
//     package.json, a tsconfig, the Node version), a workflow, and the runner itself, run every row.
// The full set also runs on every push to main, and on a pull request that is a step's build or
// carries the `all-removals` label (`runsEverything`). A change outside a row's files that makes
// another layer refuse first shows there.
// The selection is proved in removals-select.test.ts.
import { posix } from 'node:path'

const EVERY_ROW = [
  /^scripts\/(removals|removals-select|test-reporter|log-line)\.ts$/,
  /^\.github\//,
  /(^|\/)package(-lock)?\.json$/,
  /(^|\/)tsconfig[^/]*\.json$/,
  /^\.nvmrc$/,
  /^\.dependency-cruiser\.cjs$/,
  /\.sql$/,
  /^apps\/server\/migrations\//,
]

export type Row = { id: string; file: string; test: { cwd: string; file: string } }
/** Each file with the files it imports directly, as repository paths. */
export type Imports = ReadonlyMap<string, readonly string[]>
export type PullRequest = { title: string; headRef: string; labels: string[] }

/** Why every row runs on this pull request, when one does: its step's build, or the label. */
export function pullRequestRunsEverything(pullRequest: PullRequest): string | undefined {
  if (pullRequest.labels.includes('all-removals')) return 'the all-removals label'
  if (/-build$/.test(pullRequest.headRef)) return 'a step build branch'
  if (/^(feat: )?step \d/i.test(pullRequest.title)) return 'a step build title'
  return undefined
}

/** Why the diff selects every row, when it does. */
export function runsEverything(changed: string[], rows: Row[], base: Row[]): string | undefined {
  const deleted = base.find((row) => !rows.some((current) => current.id === row.id))
  if (deleted !== undefined) return `the row ${deleted.id} was deleted from removals.json`
  const shared = changed.find((file) => EVERY_ROW.some((pattern) => pattern.test(file)))
  return shared === undefined ? undefined : `${shared} is read by every proof`
}

function reach(starts: string[], imports: Imports): Set<string> {
  const seen = new Set(starts)
  const queue = [...starts]
  for (const file of queue) {
    for (const next of imports.get(file) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push(next)
    }
  }
  return seen
}

/** The rows `changed` (repository paths) affects; `base` holds the rows the pull request started from. */
export function affected<T extends Row>(
  rows: T[],
  changed: string[],
  base: Row[],
  imports: Imports,
): T[] {
  if (runsEverything(changed, rows, base) !== undefined) return rows
  const before = new Map(base.map((row) => [row.id, JSON.stringify(row)]))
  return rows.filter((row) => {
    if (before.get(row.id) !== JSON.stringify(row)) return true
    const read = reach([row.file, posix.join(row.test.cwd, row.test.file)], imports)
    return changed.some((file) => read.has(file))
  })
}
