// Defect: the local check does not fit the machine, so it is skipped or killed, and a killed step
// passes: Biome's and wrangler's launchers answer 0 when the program they start dies by a signal.
// `npm run check:local -- [--unit U<k>] [--card <card.md>] [<test file>...]` runs, one step at a
// time and on the committed work only, the light checks whole, Biome on the files changed since
// origin/main, the typecheck of the projects those files are in and the test files named (delivery
// L29). The full typecheck and the suites are CI's. The typecheck and test commands are read from the
// package.json files, which stay their one owner. A step that fails, dies by a signal or outlives its
// deadline leaves the run red. check-local.test.ts plants each refusal, a failed step and a killed one.
// Revalidate by 2027-05-26, or when Biome or wrangler change how their launcher starts the program,
// or when test-run.ts or a `typecheck` script changes its shape.
import { spawnSync } from 'node:child_process'
import { existsSync, globSync, readFileSync } from 'node:fs'
import { constants } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { runCommand } from './command.ts'

const BASE = 'origin/main'
const STEP_DEADLINE_MS = 20 * 60_000
const TYPECHECKERS: Record<string, string> = {
  tsc: 'node_modules/typescript/bin/tsc',
  wrangler: 'node_modules/wrangler/wrangler-dist/cli.js',
}
const BIOME = `node_modules/@biomejs/cli-${process.platform}-${process.arch}/biome`
const TEST_RUN = /^((?:[A-Z_]+=\S+ )*)node (\S*test-run\.ts)((?: --\S+)*)/

type Step = {
  name: string
  command: string
  args: string[]
  cwd?: string
  env?: Record<string, string>
}

const Manifest = z.looseObject({
  name: z.string(),
  workspaces: z.array(z.string()).default([]),
  scripts: z.record(z.string(), z.string()).default({}),
})

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { unit: { type: 'string' }, card: { type: 'string' }, root: { type: 'string' } },
})
const root = resolve(values.root ?? '.')

function refuse(detail: string): never {
  console.error(`check-local: ${detail}`)
  process.exit(1)
}

function git(...args: string[]): string {
  return runCommand('git', args, { cwd: root, stderr: 'pipe', deadline: 120_000 })
}

function manifest(dir: string): z.infer<typeof Manifest> {
  return Manifest.parse(JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf8')))
}

function workspaces(): string[] {
  const patterns = manifest('.').workspaces.map((pattern) => `${pattern}/package.json`)
  return globSync(patterns, { cwd: root }).map((file) => dirname(file))
}

function npm(name: string, ...args: string[]): Step {
  return { name, command: 'npm', args: ['run', name, '--', ...args] }
}

function lightSteps(changed: string[]): Step[] {
  const card = values.card === undefined ? [] : [values.card]
  const radius = values.unit === undefined ? [] : [npm('radius', values.unit, 'HEAD', ...card)]
  const design = {
    name: 'lint:design',
    command: 'npm',
    args: ['run', 'lint:design', '-w', 'apps/web'],
  }
  return [
    npm('docs'),
    npm('suppressions'),
    npm('second-card'),
    npm('approval', '--base', BASE),
    npm('migrations', '--base', BASE),
    npm('rerun-list'),
    ...radius,
    npm('deps'),
    npm('knip'),
    npm('quality', BASE, '--fast'),
    {
      name: 'biome',
      command: join(root, BIOME),
      args: ['check', '--changed', `--since=${BASE}`, '--no-errors-on-unmatched'],
    },
    ...(changed.some((file) => file.startsWith('apps/web/')) ? [design] : []),
  ]
}

function typecheckStep(dir: string, cwd: string, segment: string): Step {
  const [tool = '', ...args] = segment.split(' ')
  const program = TYPECHECKERS[tool]
  if (program === undefined) return refuse(`${dir}: no way to run \`${segment}\` of its typecheck`)
  return {
    name: `typecheck ${dir} (${tool})`,
    command: process.execPath,
    args: [join(root, program), ...args],
    cwd: join(root, cwd),
  }
}

function typecheckSteps(changed: string[]): Step[] {
  function touched(dir: string): boolean {
    return changed.some((file) => file.startsWith(`${dir}/`))
  }
  return (manifest('.').scripts.typecheck ?? '').split(' && ').flatMap((segment) => {
    if (segment === 'npm run typecheck --workspaces --if-present') {
      return workspaces()
        .filter(touched)
        .flatMap((dir) => {
          const own = manifest(dir).scripts.typecheck?.split(' && ') ?? []
          return own.map((each) => typecheckStep(dir, dir, each))
        })
    }
    const dir = segment.match(/^tsc -p (\S+)\/tsconfig\.json$/)?.[1]
    if (dir === undefined) return refuse(`no project in \`${segment}\` of the root typecheck`)
    return touched(dir) ? [typecheckStep(dir, '.', segment)] : []
  })
}

function testOwner(file: string): [dir: string, script: string] {
  if (file.startsWith('scripts/')) return ['.', 'test:scripts']
  if (file.startsWith('tests/e2e/')) return ['.', 'e2e']
  const dir = workspaces().find((each) => file.startsWith(`${each}/`))
  if (dir === undefined) return refuse(`${file}: no package runs this test file`)
  if (dir !== 'apps/web') return [dir, 'test']
  if (file.endsWith('.tsx')) return [dir, 'test:unit']
  return [dir, file === 'apps/web/sweep.test.ts' ? 'test:sweep' : 'test:browser']
}

function filesAfterScript(dir: string, script: string, files: string[]): Step {
  const args = ['run', script, '-w', dir, '--', ...files]
  return { name: `tests ${dir} (${script})`, command: 'npm', args }
}

function filesInsteadOfScriptFiles(dir: string, script: string, files: string[]): Step[] {
  const { name, scripts } = manifest(dir)
  const [, env = '', runner, options = ''] = scripts[script]?.match(TEST_RUN) ?? []
  if (runner === undefined) return refuse(`${name}: its ${script} script does not run test-run.ts`)
  const cwd = join(root, dir)
  const tests = {
    name: `tests ${dir} (${script})`,
    command: process.execPath,
    args: [runner, ...options.split(' ').filter(Boolean), ...files],
    cwd,
    env: Object.fromEntries(
      [...env.matchAll(/(\w+)=(\S*) /g)].map(([, key = '', value = '']) => [key, value]),
    ),
  }
  // The runner is started directly, so npm's `pre` script, which builds what the tests load, is a step.
  const pre = `pre${script}`
  if (scripts[pre] === undefined) return [tests]
  return [{ name: `${pre} ${dir}`, command: 'npm', args: ['run', pre], cwd }, tests]
}

function testSteps(files: string[]): Step[] {
  const groups = Map.groupBy(files, (file) => testOwner(file).join('\n'))
  return [...groups].flatMap(([owner, group]) => {
    const [dir = '', script = ''] = owner.split('\n')
    const local = group.map((file) => relative(dir, file))
    if (script === 'test:unit') return [filesAfterScript(dir, script, local)]
    return filesInsteadOfScriptFiles(dir, script, local)
  })
}

/** A shell between us and a killed program, as `npm run` has, answers 128 plus the signal. */
function signalOf(status: number | null): string | undefined {
  return Object.entries(constants.signals).find(([, number]) => status === 128 + number)?.[0]
}

function redBecause(step: Step): string | undefined {
  console.log(`\ncheck-local: ${step.name}`)
  const run = spawnSync(step.command, step.args, {
    cwd: step.cwd ?? root,
    env: { ...process.env, ...step.env },
    stdio: 'inherit',
    timeout: STEP_DEADLINE_MS,
    killSignal: 'SIGKILL',
  })
  if (run.error !== undefined) return run.error.message
  const signal = run.signal ?? signalOf(run.status)
  if (signal !== undefined) return `killed by ${signal}`
  return run.status === 0 ? undefined : `exit ${run.status}`
}

const named = positionals.map((file) => relative(root, resolve(root, file)))
const missing = named.filter((file) => !/\.test\.tsx?$/.test(file) || !existsSync(join(root, file)))
if (missing.length > 0) refuse(`not a test file: ${missing.join(', ')}`)
if (values.card !== undefined && values.unit === undefined) refuse('--card needs --unit')
const uncommitted = git('status', '--porcelain', '--untracked-files=normal')
if (uncommitted !== '') {
  refuse(`the checks read the commit to be pushed; commit or move aside:\n${uncommitted}`)
}
git('fetch', '-q', 'origin', 'main')
const changed = git('diff', '--name-only', '--no-renames', '-z', `${BASE}...HEAD`)
  .split('\0')
  .filter(Boolean)
const steps = [...lightSteps(changed), ...typecheckSteps(changed), ...testSteps(named)]
const red = steps.flatMap((step) => {
  const why = redBecause(step)
  return why === undefined ? [] : [`${step.name}: ${why}`]
})
console.log(`\ncheck-local: ${steps.length} steps over ${changed.length} changed files`)
for (const line of red) console.error(`check-local: RED ${line}`)
if (red.length > 0) process.exit(1)
console.log('check-local: green; the full typecheck and the suites are CI’s')
