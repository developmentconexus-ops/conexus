// Defect: a protection whose test stays green when the protection is taken out proves nothing
// (testing T12), and a test the protection names that cannot run proves nothing either (T4, T5).
// Each row of removals.json takes one protection out in a scratch copy of the repository and runs
// its test there, child processes included. A row is `caught` when a test of that run fails,
// `survived` when they pass, `stale` when its text is absent or repeated, `unreachable` when no test
// ran. Any row other than `caught` exits 1.
// The refusals are proved by planting each one in removals.test.ts.
// Revalidate by 2027-04-15, or when Node changes `run` from node:test.
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { run } from 'node:test'
import { runCommand } from './command.ts'

type Removal = {
  id: string
  file: string
  find: string
  replace: string
  test: { cwd: string; file: string; name?: string }
}
type Outcome = 'caught' | 'survived' | 'stale' | 'unreachable'

const ROW_DEADLINE_MS = 600_000

function isText(value: unknown): value is string {
  return typeof value === 'string' && value !== ''
}

function removalOf(value: unknown, index: number): Removal {
  const row = Object(value)
  const test = Object(row.test)
  const name: unknown = test.name
  if (
    !isText(row.id) ||
    !isText(row.file) ||
    !isText(row.find) ||
    typeof row.replace !== 'string' ||
    !isText(test.cwd) ||
    !isText(test.file) ||
    (name !== undefined && !isText(name))
  ) {
    throw new Error(`removals.json row ${index} is not { id, file, find, replace, test }`)
  }
  return {
    id: row.id,
    file: row.file,
    find: row.find,
    replace: row.replace,
    test: { cwd: test.cwd, file: test.file, ...(isText(name) ? { name } : {}) },
  }
}

function loadRemovals(root: string): Removal[] {
  const parsed: unknown = JSON.parse(readFileSync(join(root, 'scripts/removals.json'), 'utf8'))
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('removals.json must be a list with at least one row')
  }
  return parsed.map(removalOf)
}

/** Each entry links to the original, except links already there, which keep their relative target. */
function linkModules(from: string, to: string): void {
  mkdirSync(to, { recursive: true })
  for (const name of readdirSync(from)) {
    const source = join(from, name)
    if (lstatSync(source).isSymbolicLink()) symlinkSync(readlinkSync(source), join(to, name))
    else if (name.startsWith('@')) linkModules(source, join(to, name))
    else symlinkSync(source, join(to, name))
  }
}

/** The working tree as git sees it, tracked and new files alike, with the installed modules linked. */
function scratchCopy(root: string): string {
  const copy = mkdtempSync(join(tmpdir(), 'conexus-removal-'))
  const listed = runCommand(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root },
  )
  const files = listed.split('\0').filter((file) => file !== '' && existsSync(join(root, file)))
  for (const file of files) cpSync(join(root, file), join(copy, file))
  for (const manifest of files.filter((file) => file.endsWith('package.json'))) {
    const modules = join(dirname(manifest), 'node_modules')
    if (existsSync(join(root, modules))) linkModules(join(root, modules), join(copy, modules))
  }
  return copy
}

async function testOutcome(copy: string, removal: Removal): Promise<Outcome> {
  const file = join(copy, removal.test.cwd, removal.test.file)
  const stream = run({
    cwd: join(copy, removal.test.cwd),
    files: [file],
    concurrency: 1,
    timeout: ROW_DEADLINE_MS,
    signal: AbortSignal.timeout(ROW_DEADLINE_MS),
    ...(removal.test.name === undefined ? {} : { testNamePatterns: [removal.test.name] }),
  })
  let failed = 0
  let passed = 0
  for await (const event of stream) {
    // A file that cannot load fails under its own name: that is no test run, not a catch.
    if (event.type === 'test:fail' && event.data.name !== event.data.file) failed++
    if (
      event.type === 'test:pass' &&
      event.data.name !== event.data.file &&
      !event.data.skip &&
      !event.data.todo
    ) {
      passed++
    }
  }
  if (failed > 0) return 'caught'
  return passed > 0 ? 'survived' : 'unreachable'
}

async function outcomeOf(root: string, removal: Removal): Promise<Outcome> {
  const copy = scratchCopy(root)
  try {
    const path = join(copy, removal.file)
    const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
    if (text.split(removal.find).length !== 2) return 'stale'
    writeFileSync(
      path,
      text.replace(removal.find, () => removal.replace),
    )
    return await testOutcome(copy, removal)
  } finally {
    rmSync(copy, { recursive: true, force: true })
  }
}

async function main(): Promise<void> {
  const root = process.cwd()
  const args = process.argv.slice(2)
  const only = args.indexOf('--only') === -1 ? undefined : args[args.indexOf('--only') + 1]
  const removals = loadRemovals(root).filter((removal) => only === undefined || removal.id === only)
  if (removals.length === 0) throw new Error(`removals.json has no row ${only}`)
  for (const removal of removals) {
    const outcome = await outcomeOf(root, removal)
    console.log(`${outcome} ${removal.id}`)
    if (outcome !== 'caught') process.exitCode = 1
  }
}

await main()
