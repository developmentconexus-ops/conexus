import assert from 'node:assert/strict'
import { test } from 'node:test'
import { operationLabel, roleKit } from './public.ts'

test('o kit dos papéis: cada conector vira o recurso connector_<id>, com a porta de leitura do Sankhya entre as operações', () => {
  const kit = roleKit().connectors
  assert.deepEqual(
    kit.map(({ id, resource }) => [id, resource]),
    [
      ['sankhya', 'connector_sankhya'],
      ['mercado-livre', 'connector_mercado-livre'],
    ],
  )
  const sankhya = new Set(
    kit.find(({ id }) => id === 'sankhya')?.operations.map(({ id }) => String(id)),
  )
  for (const door of ['consultar', 'carregar', 'pedidos', 'contasAReceber'])
    assert.ok(sankhya.has(door), door)
})

test('o kit dos papéis traz as escritas do conector, com a classe write e o rótulo do kit', () => {
  const sankhya = roleKit().connectors.find(({ id }) => id === 'sankhya')
  assert.deepEqual(
    sankhya?.operations.filter((operation) => operation.class === 'write'),
    [{ id: 'lancarPedido', class: 'write' }],
  )
  assert.equal(operationLabel('sankhya', 'lancarPedido'), 'Lançar pedido')
})

test('um conector sem escritas não ganha nenhuma operação a mais no kit dos papéis', () => {
  const operations = roleKit().connectors.find(({ id }) => id === 'mercado-livre')?.operations ?? []
  assert.ok(operations.length > 0)
  assert.ok(
    operations.every((operation) => operation.class !== 'write' && operation.id !== undefined),
  )
})
