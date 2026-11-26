import assert from 'node:assert/strict'
import { test } from 'node:test'
import { check, LIGHT, plant, repository } from './check-local-harness.ts'

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

const DEPENDENTS: [field: string, changed: string, typechecked: string[]][] = [
  [
    'dependencies',
    'apps/edge/src/a.ts',
    [
      'tsc apps/edge -p tsconfig.json',
      'tsc apps/server -p tsconfig.json',
      'wrangler apps/edge types --check',
    ],
  ],
  [
    'devDependencies',
    'apps/server/src/a.ts',
    ['tsc apps/server -p tsconfig.json', 'tsc apps/web -p tsconfig.json'],
  ],
]
for (const [field, changed, typechecked] of DEPENDENTS) {
  test(`o typecheck inclui quem declara o que mudou em ${field}, só os diretos`, () => {
    const run = check(repository([changed]))
    assert.equal(run.status, 0, run.stderr)
    const ran = run.calls.filter((call) => /^(tsc|wrangler) /.test(call))
    assert.deepEqual(ran.toSorted(), typechecked)
  })
}

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
