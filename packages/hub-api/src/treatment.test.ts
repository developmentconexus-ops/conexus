import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TreatedTable } from './treatment.ts'

const TREATED = {
  layer: 'tratado',
  name: 'sankhya_notas',
  label: 'Notas e pedidos',
  connectionId: '00000000-0000-4000-8000-0000000000a1',
  description: 'Notas.',
  columns: [
    { name: 'nunota', type: 'bigint', description: null },
    { name: 'dtneg', type: null, description: null },
  ],
  readBy: [],
  lastRun: null,
}

test('a tabela tratada traz o rótulo e o tipo de cada coluna, que pode faltar; sem eles, não passa', () => {
  const parsed = TreatedTable.parse(TREATED)
  assert.ok(parsed.layer === 'tratado')
  assert.equal(parsed.label, 'Notas e pedidos')
  assert.deepEqual(
    parsed.columns.map((column) => column.type),
    ['bigint', null],
  )
  const { label: _label, ...unlabelled } = TREATED
  assert.equal(TreatedTable.safeParse(unlabelled).success, false)
  const untyped = { ...TREATED, columns: [{ name: 'nunota', description: null }] }
  assert.equal(TreatedTable.safeParse(untyped).success, false)
})
