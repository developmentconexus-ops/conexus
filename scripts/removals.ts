// Defect: a protection whose test stays green when the protection is taken out proves nothing
// (testing T12), and a test the protection names that cannot run proves nothing either (T4, T5).
// Each row of removals.json takes one protection out in a scratch copy of the repository and runs
// its test there. `test.name` is a pattern, as `--test-name-pattern` reads
// it. A row is `caught` when a test:fail event whose own name matches that pattern appears (a test
// that fails because a child process it spawned failed counts); a failure of another test, a hook
// of another suite or a file that cannot load is not a catch. It is `survived`
// when the tests of that name pass, `stale` when its text is absent or repeated, `unreachable` when
// no test of that name ran, `broken-baseline` when its test already fails before the protection is
// taken out. Any row other than `caught` exits 1. The manifest refuses an unknown key at any level
// and a repeated id, `--only` takes one id and `--shard 2/3` runs the second of three slices of the
// rows, so CI can run the slices as parallel jobs.
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
import { z } from 'zod'
import { runCommand } from './command.ts'

const text = z.string().min(1)
const Removals = z
  .array(
    z.strictObject({
      id: text,
      file: text,
      find: text,
      replace: z.string(),
      test: z.strictObject({ cwd: text, file: text, name: text }),
    }),
  )
  .min(1, 'must be a list with at least one row')
  .superRefine((rows, context) => {
    const seen = new Set<string>()
    for (const [index, row] of rows.entries()) {
      if (seen.has(row.id)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: `repeats the id ${row.id}`,
        })
      }
      seen.add(row.id)
    }
  })
type Removal = z.infer<typeof Removals>[number]
type Outcome = 'caught' | 'survived' | 'stale' | 'unreachable' | 'broken-baseline'
type Run = 'failed' | 'passed' | 'none'

const ROW_DEADLINE_MS = 600_000

function loadRemovals(root: string): Removal[] {
  const parsed = Removals.safeParse(
    JSON.parse(readFileSync(join(root, 'scripts/removals.json'), 'utf8')),
  )
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new Error(
      `removals.json ${issue?.path.join('.') ?? ''}: ${issue?.message ?? 'is not a list of { id, file, find, replace, test } rows'}`,
    )
  }
  return parsed.data
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

/** The worktree's source and mail build input, with the installed modules linked. */
function scratchCopy(root: string): string {
  const copy = mkdtempSync(join(tmpdir(), 'conexus-removal-'))
  const listed = runCommand(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root },
  )
  const files = listed.split('\0').filter((file) => file !== '' && existsSync(join(root, file)))
  for (const file of files) cpSync(join(root, file), join(copy, file))
  const renderer = 'apps/server/src/hub/identity/invitation-render.mjs'
  if (existsSync(join(root, renderer))) cpSync(join(root, renderer), join(copy, renderer))
  for (const manifest of files.filter((file) => file.endsWith('package.json'))) {
    const modules = join(dirname(manifest), 'node_modules')
    if (existsSync(join(root, modules))) linkModules(join(root, modules), join(copy, modules))
  }
  return copy
}

async function runTest(copy: string, test: Removal['test']): Promise<Run> {
  const file = join(copy, test.cwd, test.file)
  const stream = run({
    cwd: join(copy, test.cwd),
    files: [file],
    concurrency: 1,
    timeout: ROW_DEADLINE_MS,
    signal: AbortSignal.timeout(ROW_DEADLINE_MS),
    testNamePatterns: [test.name],
  })
  const named = new RegExp(test.name)
  let failed = 0
  let passed = 0
  // A file that cannot load fails under its own name: that is no test run, not a catch. Only a
  // test under the row's name counts; another test or a hook of another suite does not.
  function underRowName(data: { name: string; file?: string }): boolean {
    return data.name !== data.file && named.test(data.name)
  }
  for await (const event of stream) {
    if (event.type === 'test:fail' && underRowName(event.data)) failed++
    if (
      event.type === 'test:pass' &&
      underRowName(event.data) &&
      !event.data.skip &&
      !event.data.todo
    ) {
      passed++
    }
  }
  if (failed > 0) return 'failed'
  return passed > 0 ? 'passed' : 'none'
}

/** Each distinct test runs once, unmutated, in one scratch copy: a test red before the removal catches nothing. */
function baselines(root: string) {
  const known = new Map<string, Promise<Run>>()
  let copy: string | undefined
  return {
    of(test: Removal['test']): Promise<Run> {
      const key = JSON.stringify([test.cwd, test.file, test.name])
      let run = known.get(key)
      if (run === undefined) {
        copy ??= scratchCopy(root)
        run = runTest(copy, test)
        known.set(key, run)
      }
      return run
    },
    dispose(): void {
      if (copy !== undefined) rmSync(copy, { recursive: true, force: true })
    },
  }
}

async function outcomeOf(
  root: string,
  removal: Removal,
  baseline: (test: Removal['test']) => Promise<Run>,
): Promise<Outcome> {
  const copy = scratchCopy(root)
  try {
    const path = join(copy, removal.file)
    const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
    if (text.split(removal.find).length !== 2) return 'stale'
    const before = await baseline(removal.test)
    if (before === 'failed') return 'broken-baseline'
    if (before === 'none') return 'unreachable'
    writeFileSync(
      path,
      text.replace(removal.find, () => removal.replace),
    )
    const after = await runTest(copy, removal.test)
    if (after === 'failed') return 'caught'
    return after === 'passed' ? 'survived' : 'unreachable'
  } finally {
    rmSync(copy, { recursive: true, force: true })
  }
}

const USAGE = 'usage: removals.ts [--only <row id> | --shard <index>/<total>]'

/** `--shard 2/3` is the second of three runs of equal size, each a run of neighbouring rows. */
function shardOf(value: string): { index: number; total: number } {
  const match = /^([1-9]\d*)\/([1-9]\d*)$/.exec(value)
  const index = Number(match?.[1])
  const total = Number(match?.[2])
  if (match === null || index > total) throw new Error(USAGE)
  return { index, total }
}

async function main(): Promise<void> {
  const root = process.cwd()
  const args = process.argv.slice(2)
  const flag = args[0]
  const value = args[1]
  if (
    args.length > 0 &&
    (args.length !== 2 || (flag !== '--only' && flag !== '--shard') || value?.startsWith('--'))
  ) {
    throw new Error(USAGE)
  }
  const all = loadRemovals(root)
  let removals = all
  if (flag === '--only') {
    removals = all.filter((removal) => removal.id === value)
    if (removals.length === 0) throw new Error(`removals.json has no row ${value}`)
  }
  if (flag === '--shard' && value !== undefined) {
    const { index, total } = shardOf(value)
    removals = all.filter((_, row) => Math.floor((row * total) / all.length) === index - 1)
    if (removals.length === 0) throw new Error(`removals.json has no row for shard ${value}`)
  }
  const baseline = baselines(root)
  try {
    for (const removal of removals) {
      const outcome = await outcomeOf(root, removal, baseline.of)
      console.log(`${outcome} ${removal.id}`)
      if (outcome !== 'caught') process.exitCode = 1
    }
  } finally {
    baseline.dispose()
  }
}

await main()
