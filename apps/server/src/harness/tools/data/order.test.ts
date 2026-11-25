import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dataOrder } from '../public.ts'
import { CATALOG, world } from './test-world.ts'

test('sem cópia: o que o modelo lê das ferramentas e da ordem não fala de sync nem de tabela copiada', () => {
  const { tools } = world(CATALOG)
  const served = [
    Object(tools).data_describe.description,
    Object(tools).data_query.description,
    dataOrder(),
  ]
  for (const text of served) {
    assert.equal(typeof text, 'string')
    assert.doesNotMatch(text, /sync|copy|copied/i)
    assert.match(text, /NOT_IN_CATALOG/)
  }
})
