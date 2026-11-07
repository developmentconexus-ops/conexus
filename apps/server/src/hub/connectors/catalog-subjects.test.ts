import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONNECTORS } from '@conexus/connectors'
import { subjectsOf } from './public.ts'

test('o catálogo traz os assuntos do kit com as operações, e marca as da porta de leitura', () => {
  const sankhya = CONNECTORS.find(({ id }) => id === 'sankhya')
  assert.ok(sankhya)
  const subjects = subjectsOf(sankhya)
  const porta = subjects.find(({ id }) => id === 'porta')
  assert.equal(porta?.label, 'Porta de leitura')
  assert.deepEqual(
    porta?.operations.map(({ id, door, effect }) => [id, door, effect]),
    [
      ['consultar', true, 'READ'],
      ['carregar', true, 'READ'],
    ],
  )
  const vendas = subjects.find(({ id }) => id === 'vendas')
  const pedidos = vendas?.operations.find(({ id }) => id === 'pedidos')
  assert.deepEqual([pedidos?.door, pedidos?.effect], [false, 'READ'])
  const every = subjects.flatMap(({ operations }) => operations.map(({ id }) => id))
  const kit = [...Object.values(sankhya.readDoor ?? {}), ...sankhya.operations].map(({ id }) => id)
  assert.deepEqual([...every].sort(), [...kit].sort())
})
