import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CopyDefinitionV2 } from './copy.ts'
import { listPageOf } from './list.ts'
import { RIGHT } from './list-fixture.ts'

const AT = new Date('2026-11-10T12:00:00.000Z')

function cellOf(type: 'date' | 'timestamp', value: string) {
  const definition = CopyDefinitionV2.parse({
    version: 2,
    source: { kind: 'OPERATION', operation: 'things', input: {} },
    description: 'Um dia ou um instante.',
    columns: [
      { name: 'id', type: 'text', path: 'id' },
      { name: 'quando', type, path: 'quando' },
    ],
    key: ['id'],
    changedSince: null,
  })
  const rows = { linhas: [{ id: 'a', quando: value }], temMais: false }
  return listPageOf({ list: RIGHT, definition, position: null, rows, at: AT })
}

test('um dia ou um instante que não existe é MISFIT, nunca uma célula', () => {
  for (const [type, impossible] of [
    ['timestamp', '2026-02-30T10:00:00Z'],
    ['timestamp', '2026-02-10T25:00:00Z'],
    ['date', '2026-02-30'],
    ['date', '2026-02-10T25:00:00Z'],
  ] as const)
    assert.deepEqual(
      cellOf(type, impossible),
      { kind: 'MISFIT', column: 'quando', path: 'quando' },
      `${type} ${impossible}`,
    )
  const day = cellOf('date', '2026-02-28T10:00:00-03:00')
  assert.deepEqual(
    day.kind === 'PAGE' && day.rows,
    [['a', '2026-02-28']],
    'um instante real vira o dia',
  )
})
