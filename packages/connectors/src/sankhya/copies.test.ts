import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sankhya } from './definition.ts'

test('as cinco cópias trazem a descrição do desenho', () => {
  const vendas = sankhya.copy?.models.find((model) => model.id === 'vendas')
  assert.ok(vendas)
  assert.equal(
    vendas.definition.description,
    'Cabeçalho de cada venda e pedido de venda do Sankhya: data, cliente, vendedor, valor e situação. Uma linha por nota.',
  )
  const changed = vendas.definition.columns.find((column) => column.name === 'DTALTER')
  assert.equal(changed?.description, 'Data e hora da última alteração do registro no Sankhya.')
  for (const model of sankhya.copy?.models ?? []) {
    assert.ok(model.definition.description, model.id)
    for (const column of model.definition.columns)
      assert.ok(column.description, `${model.id}.${column.name}`)
  }
})
