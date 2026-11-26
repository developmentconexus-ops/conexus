import { execFileSync, spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after } from 'node:test'

export const SCRIPT = resolve(import.meta.dirname, 'check-local.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const BIOME = `node_modules/@biomejs/cli-${process.platform}-${process.arch}/biome`
const TOOL = `const { spawn } = require('node:child_process')
const { appendFileSync, readFileSync, writeFileSync } = require('node:fs')
const { relative, join } = require('node:path')
const [name, ...args] = process.argv.slice(2)
const at = relative(__dirname, process.cwd()) || '.'
const log = join(__dirname, 'calls.log')
appendFileSync(log, [name, at, ...args].join(' ') + '\\n')
const runs = readFileSync(log, 'utf8').split('\\n').filter((line) => line.startsWith(name + ' '))
function leaveGrandchild() {
  const idle = ['-e', 'setTimeout(() => {}, 60000)']
  const pipelessGrandchild = spawn(process.execPath, idle, { stdio: 'ignore' })
  writeFileSync(join(__dirname, 'planted.pids'), process.pid + ' ' + pipelessGrandchild.pid)
}
if (process.env.FAILED_TOOL === name) process.exit(2)
if (process.env.ORPHANING_TOOL === name) {
  leaveGrandchild()
  process.kill(process.pid, 'SIGABRT')
}
if (process.env.KILLED_TOOL === name && runs.length <= Number(process.env.KILL_TIMES ?? 2)) {
  process.kill(process.pid, process.env.KILL_SIGNAL)
}
if (process.env.HUNG_TOOL === name) {
  leaveGrandchild()
  setTimeout(() => {
    writeFileSync(join(__dirname, 'outlived'), '')
    process.exit()
  }, 30000)
}
`
const DECOY_LAUNCHER = '#!/bin/sh\nexit 0\n'

function tool(name: string, depth = 0): string {
  return `node ${'../'.repeat(depth)}tool.cjs ${name}`
}

function program(root: string, name: string): string {
  const recorder = JSON.stringify(join(root, 'tool.cjs'))
  return `process.argv.splice(2, 0, '${name}')\nrequire(${recorder})\n`
}

const ROOT_SCRIPTS = Object.fromEntries(
  [
    'docs',
    'suppressions',
    'second-card',
    'approval',
    'migrations',
    'rerun-list',
    'radius',
    'deps',
    'knip',
    'quality',
  ].map((name) => [name, tool(name)]),
)

const PACKAGES: Record<string, Record<string, string>> = {
  'apps/web': {
    typecheck: 'tsc -p tsconfig.json',
    'lint:design': tool('lint:design', 2),
    'test:unit': tool('vitest', 2),
    'test:browser': 'node ../../scripts/test-run.ts --test-concurrency=2 a.test.ts',
  },
  'apps/server': {
    pretest: 'npm run build',
    build: tool('build', 2),
    typecheck: 'tsc -p tsconfig.json',
    test: 'LEASE=3000 node ../../scripts/test-run.ts --test-concurrency=1 $(node shards.ts)',
  },
  'apps/edge': { typecheck: 'wrangler types --check && tsc -p tsconfig.json' },
}

const DECLARED: Record<string, Record<string, Record<string, string>>> = {
  'apps/server': { dependencies: { '@planted/edge': '*' } },
  'apps/web': { devDependencies: { '@planted/server': '*' } },
}

export function plant(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), content)
    if (content.startsWith('#!')) chmodSync(join(root, path), 0o755)
  }
}

function git(cwd: string, ...args: string[]): void {
  const identity = ['-c', 'user.name=t', '-c', 'user.email=t@t.invalid']
  execFileSync('git', [...identity, ...args], { cwd, stdio: 'ignore', timeout: 30_000 })
}

export function repository(changed: string[], rewritten: Record<string, string> = {}): string {
  const scratch = mkdtempSync(join(tmpdir(), 'conexus-check-local-'))
  dirs.push(scratch)
  const root = join(scratch, 'repo')
  const manifest = {
    name: 'planted',
    workspaces: ['apps/*'],
    scripts: {
      ...ROOT_SCRIPTS,
      typecheck: 'tsc -p scripts/tsconfig.json && npm run typecheck --workspaces --if-present',
      'test:scripts': 'node scripts/test-run.ts --test-timeout=1000 scripts/*.test.ts',
      pree2e: tool('pree2e'),
      e2e: 'node scripts/test-run.ts --test-concurrency=1 tests/e2e/*.test.ts',
    },
  }
  plant(root, {
    '.gitignore': 'calls.log\n',
    'package.json': JSON.stringify(manifest),
    ...Object.fromEntries(
      Object.entries(PACKAGES).map(([dir, scripts]) => [
        `${dir}/package.json`,
        JSON.stringify({ name: `@planted/${dir.split('/')[1]}`, scripts, ...DECLARED[dir] }),
      ]),
    ),
    'tool.cjs': TOOL,
    'scripts/package.json': '{ "type": "module" }',
    'scripts/test-run.ts': `import { appendFileSync } from 'node:fs'
import { join, relative } from 'node:path'
const root = join(import.meta.dirname, '..')
const call = ['test-run', relative(root, process.cwd()) || '.', process.env.LEASE ?? '-', ...process.argv.slice(2)]
appendFileSync(join(root, 'calls.log'), call.join(' ') + '\\n')
`,
    'node_modules/typescript/bin/tsc': program(root, 'tsc'),
    'node_modules/wrangler/wrangler-dist/cli.js': program(root, 'wrangler'),
    'node_modules/.bin/wrangler': DECOY_LAUNCHER,
    'node_modules/.bin/biome': DECOY_LAUNCHER,
    'node_modules/@biomejs/biome/bin/biome': DECOY_LAUNCHER,
    [BIOME]: `#!/bin/sh\necho "biome . $*" >> calls.log\nif [ "$KILLED_TOOL" = biome ]; then kill -s "\${KILL_SIGNAL#SIG}" $$; fi\n`,
  })
  git(scratch, 'init', '-q', '--bare', '-b', 'main', 'origin.git')
  git(root, 'init', '-q', '-b', 'main')
  git(root, 'add', '-A')
  git(root, 'commit', '-q', '-m', 'base')
  git(root, 'remote', 'add', 'origin', join(scratch, 'origin.git'))
  git(root, 'push', '-q', 'origin', 'main')
  plant(root, Object.fromEntries(changed.map((file) => [file, 'export const changed = 1\n'])))
  plant(root, rewritten)
  git(root, 'add', '-A')
  git(root, 'commit', '-q', '--allow-empty', '-m', 'work')
  return root
}

export function check(root: string, args: string[] = [], env: Record<string, string> = {}) {
  const run = spawnSync('node', [SCRIPT, '--root', root, ...args], {
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, npm_config_update_notifier: 'false', ...env },
  })
  const log = join(root, 'calls.log')
  const calls = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []
  return { status: run.status, stderr: run.stderr, calls }
}

export const LIGHT = [
  'docs .',
  'suppressions .',
  'second-card .',
  'approval . --base origin/main',
  'migrations . --base origin/main',
  'rerun-list .',
  'deps .',
  'knip .',
  'quality . origin/main --fast',
  'biome . check --changed --since=origin/main --no-errors-on-unmatched',
]
