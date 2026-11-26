import assert from 'node:assert/strict'
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
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'check-local.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const BIOME = `node_modules/@biomejs/cli-${process.platform}-${process.arch}/biome`
const TOOL = `const { appendFileSync } = require('node:fs')
const { relative, join } = require('node:path')
const [name, ...args] = process.argv.slice(2)
const at = relative(__dirname, process.cwd()) || '.'
appendFileSync(join(__dirname, 'calls.log'), [name, at, ...args].join(' ') + '\\n')
if (process.env.FAILED_TOOL === name) process.exit(2)
if (process.env.KILLED_TOOL === name) process.kill(process.pid, process.env.KILL_SIGNAL)
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

function plant(root: string, files: Record<string, string>): void {
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

function repository(changed: string[], rewritten: Record<string, string> = {}): string {
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
        JSON.stringify({ name: `@planted/${dir.split('/')[1]}`, scripts }),
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

function check(root: string, args: string[] = [], env: Record<string, string> = {}) {
  const run = spawnSync('node', [SCRIPT, '--root', root, ...args], {
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, npm_config_update_notifier: 'false', ...env },
  })
  const log = join(root, 'calls.log')
  const calls = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []
  return { status: run.status, stderr: run.stderr, calls }
}

const LIGHT = [
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

test('os passos leves rodam inteiros e o typecheck só nos projetos do que mudou', () => {
  const run = check(repository(['apps/web/src/a.ts', 'scripts/a.ts']))
  assert.equal(run.status, 0, run.stderr)
  assert.deepEqual(run.calls, [
    ...LIGHT,
    'lint:design apps/web',
    'tsc . -p scripts/tsconfig.json',
    'tsc apps/web -p tsconfig.json',
  ])
})

test('uma mudança só de documentos não roda typecheck', () => {
  const run = check(repository(['docs/a.md']))
  assert.equal(run.status, 0, run.stderr)
  assert.deepEqual(run.calls, LIGHT)
})

test('a unidade nomeada leva o raio do commit', () => {
  const run = check(repository([]), ['--unit', 'U3', '--card', 'a.md'])
  assert.equal(run.status, 0, run.stderr)
  assert.equal(run.calls[6], 'radius . U3 HEAD a.md')
})

test('cada teste nomeado roda com o comando e as opções do seu pacote', () => {
  const tests = [
    'apps/server/src/a.test.ts',
    'apps/web/src/b.test.tsx',
    'apps/web/src/c.test.ts',
    'scripts/d.test.ts',
    'tests/e2e/f.test.ts',
  ]
  const run = check(repository(tests), tests)
  assert.equal(run.status, 0, run.stderr)
  const typechecked = run.calls.findLastIndex((call) => call.startsWith('tsc '))
  assert.deepEqual(run.calls.slice(typechecked + 1), [
    'build apps/server',
    'test-run apps/server 3000 --test-concurrency=1 src/a.test.ts',
    'vitest apps/web src/b.test.tsx',
    'test-run apps/web - --test-concurrency=2 src/c.test.ts',
    'test-run . - --test-timeout=1000 scripts/d.test.ts',
    'pree2e .',
    'test-run . - --test-concurrency=1 tests/e2e/f.test.ts',
  ])
})

const KILLED: [tool: string, signal: string, changed: string, step: string][] = [
  ['knip', 'SIGKILL', 'docs/a.md', 'knip'],
  ['biome', 'SIGTERM', 'docs/a.md', 'biome'],
  ['biome', 'SIGKILL', 'docs/a.md', 'biome'],
  ['tsc', 'SIGTERM', 'apps/web/src/a.ts', 'typecheck apps/web (tsc)'],
  ['wrangler', 'SIGKILL', 'apps/edge/src/a.ts', 'typecheck apps/edge (wrangler)'],
]
for (const [killed, signal, changed, step] of KILLED) {
  test(`um passo morto por sinal é vermelho: ${killed}, ${signal}`, () => {
    const env = { KILLED_TOOL: killed, KILL_SIGNAL: signal }
    const run = check(repository([changed]), [], env)
    assert.equal(run.status, 1, run.stderr)
    assert.ok(run.stderr.includes(`check-local: RED ${step}: killed by ${signal}`), run.stderr)
  })
}

test('um passo que sai com erro é vermelho, e os outros ainda rodam', () => {
  const run = check(repository(['docs/a.md']), [], { FAILED_TOOL: 'docs' })
  assert.equal(run.status, 1)
  assert.ok(run.stderr.includes('check-local: RED docs: exit 2'), run.stderr)
  assert.deepEqual(run.calls, LIGHT)
})

test('trabalho sem commit é recusado antes de qualquer passo', () => {
  const root = repository([])
  plant(root, { 'apps/web/src/solto.ts': 'export const solto = 1\n' })
  const run = check(root)
  assert.equal(run.status, 1)
  assert.match(run.stderr, /commit or move aside:\n\?\? apps\/web\/src\//)
  assert.deepEqual(run.calls, [])
})

test('um arquivo nomeado que não é um teste existente é recusado', () => {
  const run = check(repository([]), ['apps/web/src/sumiu.test.ts'])
  assert.equal(run.status, 1)
  assert.match(run.stderr, /not a test file: apps\/web\/src\/sumiu\.test\.ts/)
  assert.deepEqual(run.calls, [])
})

const ROOT_WITH_OPAQUE_TYPECHECK = JSON.stringify({
  name: 'planted',
  workspaces: ['apps/*'],
  scripts: { typecheck: 'node typecheck.js' },
})
const ESLINT_TYPECHECK = JSON.stringify({
  name: '@planted/web',
  scripts: { typecheck: 'eslint .' },
})

const REFUSED: [what: string, repo: () => string, args: string[], why: RegExp][] = [
  ['--card sem --unit', () => repository([]), ['--card', 'a.md'], /--card needs --unit/],
  [
    'um teste fora de todo pacote',
    () => repository(['solto/a.test.ts']),
    ['solto/a.test.ts'],
    /solto\/a\.test\.ts: no package runs this test file/,
  ],
  [
    'um pacote cujo teste não roda test-run.ts',
    () => repository(['apps/edge/a.test.ts']),
    ['apps/edge/a.test.ts'],
    /@planted\/edge: its test script does not run test-run\.ts/,
  ],
  [
    'uma ferramenta de typecheck desconhecida',
    () => repository(['apps/web/src/a.ts'], { 'apps/web/package.json': ESLINT_TYPECHECK }),
    [],
    /apps\/web: no way to run `eslint \.`/,
  ],
  [
    'um passo do typecheck da raiz sem projeto',
    () => repository([], { 'package.json': ROOT_WITH_OPAQUE_TYPECHECK }),
    [],
    /no project in `node typecheck\.js`/,
  ],
]
for (const [what, repo, args, why] of REFUSED) {
  test(`é recusado antes de qualquer passo: ${what}`, () => {
    const run = check(repo(), args)
    assert.equal(run.status, 1)
    assert.match(run.stderr, why)
    assert.deepEqual(run.calls, [])
  })
}
