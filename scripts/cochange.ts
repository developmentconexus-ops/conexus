// Lists the files and folders that change together in git history, so a study or a review sees
// the links the code does not show. It reports; it never fails a pull request.
import { resolve } from 'node:path'
import { option } from './cli.ts'
import { runCommand } from './command.ts'

const MIN_COMMITS = 5
const MIN_PERCENT = 50
const MAX_FILES = 25
const TEST_FILE = /(?:\.test\.|\.spec\.|(?:^|\/)(?:tests?|__tests__)\/)/

type Counts = { each: Map<string, number>; pairs: Map<string, number> }

function integerOption(name: string, fallback: number): number {
  const raw = option(name)
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) {
    console.error(`cochange: ${name} must be a positive integer`)
    process.exit(2)
  }
  return value
}

const root = resolve(option('--root') ?? '.')
const folders = option('--folders')?.split(',').filter(Boolean)
const base = option('--base')
const head = option('--head') ?? 'HEAD'
const since = option('--since')
const minCommits = integerOption('--min-commits', MIN_COMMITS)
const minPercent = integerOption('--min-percent', MIN_PERCENT)
const maxFiles = integerOption('--max-files', MAX_FILES)

if ((folders === undefined) === (base === undefined)) {
  console.error(
    'usage: cochange.ts (--folders a,b | --base <ref> [--head <ref>]) [--since <date>] [--min-commits N] [--min-percent N] [--max-files N] [--root <dir>]',
  )
  process.exit(2)
}

function git(...args: string[]): string {
  return runCommand('git', ['-c', 'core.quotepath=off', ...args], { cwd: root })
}

function folderOf(file: string): string {
  const slash = file.lastIndexOf('/')
  return slash === -1 ? '.' : file.slice(0, slash)
}

const changed =
  base === undefined
    ? undefined
    : new Set(git('diff', '--name-only', `${base}...${head}`).split('\n').filter(Boolean))
const scope = folders ?? []
const history = base ?? head

function commitsOf(): string[][] {
  const log = git(
    'log',
    '--no-merges',
    '--name-only',
    '--format=tformat:@@',
    ...(since === undefined ? [] : [`--since=${since}`]),
    history,
    '--',
    ...(scope.length === 0 ? ['.'] : scope),
  )
  return log
    .split('@@')
    .map((block) => block.split('\n').filter((file) => file !== '' && !TEST_FILE.test(file)))
    .filter((files) => files.length > 0)
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function count(commits: string[][], subjectOf: (file: string) => string, limit: number): Counts {
  const each = new Map<string, number>()
  const pairs = new Map<string, number>()
  for (const files of commits) {
    const subjects = [...new Set(files.map(subjectOf))].sort()
    for (const subject of subjects) bump(each, subject)
    if (files.length > limit) continue
    for (const [i, first] of subjects.entries()) {
      for (const second of subjects.slice(i + 1)) bump(pairs, `${first}\t${second}`)
    }
  }
  return { each, pairs }
}

type Row = { together: number; percent: number; first: string; second: string }

function rowsOf({ each, pairs }: Counts, keep: (first: string, second: string) => boolean): Row[] {
  const rows: Row[] = []
  for (const [key, together] of pairs) {
    const [first = '', second = ''] = key.split('\t')
    if (together < minCommits || !keep(first, second)) continue
    const smaller = Math.min(each.get(first) ?? 0, each.get(second) ?? 0)
    const percent = Math.round((together / smaller) * 100)
    if (percent >= minPercent) rows.push({ together, percent, first, second })
  }
  return rows.sort((a, b) => b.percent - a.percent || b.together - a.together)
}

function print(title: string, rows: Row[]) {
  console.log(`\n${title}`)
  if (rows.length === 0) console.log('  none')
  for (const row of rows) {
    console.log(`  ${row.percent}%  ${row.together} commits  ${row.first}  +  ${row.second}`)
  }
}

const commits = commitsOf()
function touches(file: string): boolean {
  return changed === undefined || changed.has(file)
}
const byFolder = rowsOf(count(commits, folderOf, Number.POSITIVE_INFINITY), (first, second) =>
  changed === undefined
    ? true
    : [...changed].some((f) => folderOf(f) === first || folderOf(f) === second),
)
const byFile = rowsOf(
  count(commits, (file) => file, maxFiles),
  (first, second) => {
    if (folderOf(first) === folderOf(second)) return false
    return touches(first) || touches(second)
  },
)

console.log(
  `cochange: ${commits.length} commits without tests in ${scope.length === 0 ? `the history up to ${history}` : scope.join(', ')}; a pair needs ${minCommits} commits together and ${minPercent}% of the commits of the one that changes less`,
)
print('Folders that change together', byFolder)
print(
  `Files of different folders that change together (commits of up to ${maxFiles} files)`,
  byFile,
)
