import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dataOrder } from './public.ts'
import { CATALOG, world } from './test-world.ts'

const GENERIC_EXAMPLE = 'sync.pedidos'
const CONCRETE_TABLE = /sync\.(?!<name>)[A-Za-z_][A-Za-z0-9_]*/g

test('o que o modelo lê das ferramentas e da ordem nunca dá a uma tabela um nome concreto', () => {
  const { tools } = world(CATALOG)
  const served = [
    Object(tools).data_describe.description,
    Object(tools).data_query.description,
    dataOrder(),
  ]
  for (const text of served) {
    assert.equal(typeof text, 'string')
    assert.deepEqual(
      (text.match(CONCRETE_TABLE) ?? []).filter((each: string) => each !== GENERIC_EXAMPLE),
      [],
    )
    assert.ok(text.includes('sync.<name>') || text.includes('`sync.` followed by'))
  }
})
