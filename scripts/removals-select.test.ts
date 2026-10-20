import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Row } from './removals-select.ts'
import { affected } from './removals-select.ts'

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
  assert.deepEqual(affected(ROWS, ['src/a.test.ts', 'apps/web/src/a.test.ts'], ROWS), [])
})

test('uma linha nova ou mudada em removals.json afeta só ela', () => {
  const base: Row[] = [
    { id: 'a', file: 'apps/server/src/a.ts', test: { cwd: 'apps/server', file: 'src/a.test.ts' } },
    {
      id: 'b',
      file: 'apps/server/src/old.ts',
      test: { cwd: 'apps/server', file: 'src/b.test.ts' },
    },
  ]
  assert.deepEqual(ids(affected(ROWS, ['scripts/removals.json'], base)), ['b', 'c'])
})

test('uma linha tirada de removals.json não afeta linha', () => {
  assert.deepEqual(affected(ROWS.slice(0, 2), ['scripts/removals.json'], ROWS), [])
})

test('mudar o próprio executor afeta todas as linhas', () => {
  assert.deepEqual(ids(affected(ROWS, ['scripts/removals.ts'], ROWS)), ['a', 'b', 'c'])
  assert.deepEqual(ids(affected(ROWS, ['scripts/removals-select.ts'], ROWS)), ['a', 'b', 'c'])
})

test('sem linhas de partida, todas são novas', () => {
  assert.deepEqual(ids(affected(ROWS, [], [])), ['a', 'b', 'c'])
})
