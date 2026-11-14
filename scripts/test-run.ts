// Defect: a test that failed once and passed the next time turns a pull request red with no defect
// to fix, and costs a whole run by hand (the CI study: 186 runs went green only on a rerun).
// `node scripts/test-run.ts <options> <files>` is `node --test <options> <files>`; on CI it also
// reruns once the tests that failed, and nothing else, with Node's own `--test-rerun-failures`.
// A test that passes the second time is flaky: scripts/flaky-report.ts shows it in the job summary and
// keeps its issue. The second run is skipped when a failed test is one of the classes testing T4
// forbids rerunning (scripts/rerun-exempt.ts), when a test file itself failed, or when the run failed
// with no test failing (a reporter rule, a timeout, a crash). Options come first and use the
// `--name=value` form, so what follows them is the list of files the second run narrows to.
// The refusals and the rerun are proved in test-run.test.ts.
// Revalidate by 2027-05-14, or when Node changes `--test-rerun-failures`.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { z } from 'zod'
import { reportFlaky } from './flaky-report.ts'
import { neverRerun } from './rerun-exempt.ts'
import { flakyTests } from './rerun-state.ts'

const Failure = z.object({ file: z.string(), name: z.string() })

function runNodeTest(args: string[], env: Record<string, string>): number {
  const run = spawnSync(process.execPath, ['--test', ...args], {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })
  return run.status ?? 1
}

function failuresIn(path: string): z.infer<typeof Failure>[] {
  return existsSync(path)
    ? readFileSync(path, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => Failure.parse(JSON.parse(line)))
    : []
}

const args = process.argv.slice(2)
const split = args.findIndex((arg) => !arg.startsWith('-'))
const options = split === -1 ? args : args.slice(0, split)
const files = split === -1 ? [] : args.slice(split)
if (files.some((file) => file.startsWith('-'))) {
  console.error(
    `test-run: options come before the files: ${files.filter((file) => file.startsWith('-')).join(' ')}`,
  )
  process.exit(2)
}

if (process.env.CI !== 'true') process.exit(runNodeTest([...options, ...files], {}))

const dir = mkdtempSync(join(tmpdir(), 'conexus-rerun-'))
const state = join(dir, 'state.json')
const failuresFile = join(dir, 'failures.jsonl')
const first = runNodeTest([`--test-rerun-failures=${state}`, ...options, ...files], {
  CONEXUS_FAILURES_FILE: failuresFile,
})
if (first === 0) process.exit(0)

const failures = failuresIn(failuresFile)
const refused = failures.filter((failure) => neverRerun(failure) || failure.name === failure.file)
if (failures.length === 0 || refused.length > 0) {
  const why =
    failures.length === 0
      ? 'the run failed with no test failing'
      : `a test of a class T4 forbids rerunning failed: ${refused.map((failure) => `${failure.file} › ${failure.name}`).join('; ')}`
  console.error(`test-run: no second run, ${why}`)
  process.exit(first)
}

const failedFiles = [...new Set(failures.map((failure) => failure.file))]
console.error(
  `test-run: second run of the ${failures.length} test(s) that failed, in ${failedFiles.join(', ')}`,
)
const second = runNodeTest([`--test-rerun-failures=${state}`, ...options, ...failedFiles], {
  CONEXUS_FAILURES_FILE: join(dir, 'second-failures.jsonl'),
  CONEXUS_TEST_ATTEMPT: '2',
})
const flaky = flakyTests(readFileSync(state, 'utf8'))
if (flaky.length > 0) reportFlaky(flaky)
process.exit(second)
