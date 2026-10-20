import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Imports, Row } from './removals-select.ts'
import { affected, pullRequestRunsEverything, runsEverything } from './removals-select.ts'

const ROWS: Row[] = [
  { id: 'a', file: 'apps/server/src/a.ts', test: { cwd: 'apps/server', file: 'src/a.test.ts' } },
  { id: 'b', file: 'apps/server/src/b.ts', test: { cwd: 'apps/server', file: 'src/b.test.ts' } },
  { id: 'c', file: 'scripts/c.ts', test: { cwd: '.', file: 'scripts/c.test.ts' } },
]
const NONE: Imports = new Map()
const IMPORTS: Imports = new Map([
  ['apps/server/src/a.test.ts', ['apps/server/src/fixture.ts', 'apps/server/src/a.ts']],
  ['apps/server/src/b.ts', ['apps/server/src/shared.ts']],
  ['apps/server/src/shared.ts', ['apps/server/src/deep.ts']],
  ['apps/server/src/fixture.ts', ['apps/server/src/fixture-helper.ts']],
])

function ids(rows: Row[]): string[] {
  return rows.map((row) => row.id)
}

test('um diff sem proteção não afeta linha', () => {
  assert.deepEqual(affected(ROWS, ['docs/index.md', 'apps/web/src/app.tsx'], ROWS, IMPORTS), [])
})

test('o arquivo da proteção afeta a linha dela', () => {
  assert.deepEqual(ids(affected(ROWS, ['apps/server/src/b.ts'], ROWS, NONE)), ['b'])
})

test('o arquivo do teste afeta a linha dele, com o cwd da linha', () => {
  assert.deepEqual(ids(affected(ROWS, ['apps/server/src/a.test.ts'], ROWS, NONE)), ['a'])
  assert.deepEqual(ids(affected(ROWS, ['scripts/c.test.ts'], ROWS, NONE)), ['c'])
})

test('um arquivo de teste de outra pasta de mesmo nome não afeta', () => {
  const changed = ['src/a.test.ts', 'apps/web/src/a.test.ts']
  assert.deepEqual(affected(ROWS, changed, ROWS, NONE), [])
})

test('o que o teste importa, mesmo de longe, afeta a linha dele', () => {
  const fixture = affected(ROWS, ['apps/server/src/fixture.ts'], ROWS, IMPORTS)
  assert.deepEqual(ids(fixture), ['a'])
  assert.deepEqual(ids(affected(ROWS, ['apps/server/src/fixture-helper.ts'], ROWS, IMPORTS)), ['a'])
})

test('o que a proteção importa, mesmo de longe, afeta a linha dela', () => {
  assert.deepEqual(ids(affected(ROWS, ['apps/server/src/deep.ts'], ROWS, IMPORTS)), ['b'])
})

test('uma linha nova ou mudada em removals.json afeta só ela', () => {
  const base: Row[] = [
    { id: 'a', file: 'apps/server/src/a.ts', test: { cwd: 'apps/server', file: 'src/a.test.ts' } },
    {
      id: 'b',
      file: 'apps/server/src/old.ts',
      test: { cwd: 'apps/server', file: 'src/b.test.ts' },
    },
    { id: 'c', file: 'scripts/c.ts', test: { cwd: '.', file: 'scripts/c.test.ts' } },
  ]
  assert.deepEqual(ids(affected(ROWS, ['scripts/removals.json'], base, NONE)), ['b'])
  assert.deepEqual(ids(affected(ROWS, ['scripts/removals.json'], base.slice(0, 2), NONE)), [
    'b',
    'c',
  ])
})

test('uma linha tirada de removals.json roda todas as que restam', () => {
  const rest = ROWS.slice(0, 2)
  assert.equal(
    runsEverything(['scripts/removals.json'], rest, ROWS),
    'the row c was deleted from removals.json',
  )
  assert.deepEqual(ids(affected(rest, ['scripts/removals.json'], ROWS, NONE)), ['a', 'b'])
})

test('o que todo teste lê sem o grafo roda todas as linhas', () => {
  for (const file of [
    'scripts/removals.ts',
    'scripts/removals-select.ts',
    'scripts/test-reporter.ts',
    '.github/workflows/ci.yml',
    'package-lock.json',
    'apps/server/package.json',
    'apps/server/tsconfig.json',
    '.nvmrc',
    'apps/server/database-grants.sql',
    'apps/server/migrations/0001_x.sql',
  ]) {
    assert.deepEqual(ids(affected(ROWS, [file], ROWS, NONE)), ['a', 'b', 'c'], file)
  }
})

test('sem linhas de partida, todas são novas', () => {
  assert.deepEqual(ids(affected(ROWS, [], [], NONE)), ['a', 'b', 'c'])
})

test('um pull request de etapa roda todas as linhas: o rótulo, a ramificação ou o título', () => {
  const plain = { title: 'fix: a thing', headRef: 'feat/conexus-x', labels: ['bug'] }
  assert.equal(pullRequestRunsEverything(plain), undefined)
  assert.ok(pullRequestRunsEverything({ ...plain, labels: ['all-removals'] }))
  assert.ok(pullRequestRunsEverything({ ...plain, headRef: 'feat/conexus-e121-build' }))
  assert.ok(pullRequestRunsEverything({ ...plain, title: 'feat: step 12.2, A casa' }))
  assert.ok(pullRequestRunsEverything({ ...plain, title: 'Step 10: Recusar um app' }))
  assert.equal(pullRequestRunsEverything({ ...plain, title: 'docs: step 12.3 card' }), undefined)
})
