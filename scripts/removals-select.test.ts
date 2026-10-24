import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Row } from './removals-select.ts'
import { affected, pullRequestRunsEverything } from './removals-select.ts'

const ROWS: Row[] = [
  { id: 'a', file: 'apps/server/src/a.ts', test: { cwd: 'apps/server', file: 'src/a.test.ts' } },
  { id: 'b', file: 'apps/server/src/b.ts', test: { cwd: 'apps/server', file: 'src/b.test.ts' } },
  { id: 'c', file: 'scripts/c.ts', test: { cwd: '.', file: 'scripts/c.test.ts' } },
]

function ids(rows: Row[]): string[] {
  return rows.map((row) => row.id)
}

test('um diff sem proteção não afeta linha', () => {
  assert.deepEqual(affected(ROWS, ['docs/index.md', 'apps/web/src/app.tsx'], ROWS), [])
})

test('o arquivo da proteção afeta a linha dela', () => {
  assert.deepEqual(ids(affected(ROWS, ['apps/server/src/b.ts'], ROWS)), ['b'])
})

test('o arquivo do teste afeta a linha dele, com o cwd da linha', () => {
  assert.deepEqual(ids(affected(ROWS, ['apps/server/src/a.test.ts'], ROWS)), ['a'])
  assert.deepEqual(ids(affected(ROWS, ['scripts/c.test.ts'], ROWS)), ['c'])
})

test('um arquivo de teste de outra pasta de mesmo nome não afeta', () => {
  const changed = ['src/a.test.ts', 'apps/web/src/a.test.ts']
  assert.deepEqual(affected(ROWS, changed, ROWS), [])
})

test('o que todo teste lê, um ajudante, o lockfile ou uma migração, não afeta linha', () => {
  for (const file of [
    'apps/server/src/platform/test-database.ts',
    'package-lock.json',
    'apps/server/package.json',
    '.github/workflows/ci.yml',
    'apps/server/migrations/0001_x/migration.sql',
  ]) {
    assert.deepEqual(affected(ROWS, [file], ROWS), [], file)
  }
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
  assert.deepEqual(ids(affected(ROWS, ['scripts/removals.json'], base)), ['b'])
  assert.deepEqual(ids(affected(ROWS, ['scripts/removals.json'], base.slice(0, 2))), ['b', 'c'])
})

test('uma linha tirada de removals.json não roda as que restam', () => {
  assert.deepEqual(affected(ROWS.slice(0, 2), ['scripts/removals.json'], ROWS), [])
})

test('sem linhas de partida, todas são novas', () => {
  assert.deepEqual(ids(affected(ROWS, [], [])), ['a', 'b', 'c'])
})

test('só o rótulo all-removals faz um pull request rodar todas as linhas', () => {
  const plain = { title: 'feat: step 12.2, A casa', headRef: 'feat/conexus-e121-build', labels: [] }
  assert.equal(pullRequestRunsEverything(plain), undefined)
  assert.equal(
    pullRequestRunsEverything({ ...plain, labels: ['bug', 'all-removals'] }),
    'the all-removals label',
  )
})
