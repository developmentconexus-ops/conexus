import assert from 'node:assert/strict'
import { test } from 'node:test'
import { roleKit } from './public.ts'

test('o kit dos papéis: cada conector vira o recurso connector_<id>, com a porta de leitura do Sankhya entre as operações', () => {
  const kit = roleKit()
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
