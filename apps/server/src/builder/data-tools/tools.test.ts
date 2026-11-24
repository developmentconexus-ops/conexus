import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Catalog as CatalogShape } from '@conexus/hub-api'
import { CATALOG, runOn, thrown, world } from './test-world.ts'

const NOT_IN_CATALOG_REASON =
  'No such table in the catalog. Call data_describe with no table to list them.'

test('data_describe sem tabela lista os sistemas com o conector e as leituras, sem tabela nem coluna', async () => {
  const { tools } = world(CATALOG)
  const result = await runOn(tools, 'data_describe', {})
  assert.deepEqual(result, {
    kind: 'CATALOG',
    systems: [
      {
        name: 'Loja A',
        connector: 'erp-falso',
        reads: [{ operation: 'listar', label: 'Listar', summary: 'Lista os itens.' }],
      },
      {
        name: 'Loja B',
        connector: 'erp-falso',
        reads: [{ operation: 'listar', label: 'Listar', summary: 'Lista os itens.' }],
      },
    ],
  })
})

test('o catálogo vazio dá CATALOG com a lista de sistemas vazia', async () => {
  const { tools } = world(CatalogShape.parse({ kind: 'CATALOG', systems: [] }))
  assert.deepEqual(await runOn(tools, 'data_describe', {}), { kind: 'CATALOG', systems: [] })
})

test('sem cópia: data_describe com uma tabela, qualquer uma, dá NOT_IN_CATALOG com a frase e não lê ao vivo', async () => {
  const { tools, reached } = world(CATALOG)
  for (const table of ['vendas', 'sankhya_vendas', 'nao_existe']) {
    const told = await thrown(runOn(tools, 'data_describe', { table }))
    assert.equal(told.kind, 'NOT_IN_CATALOG', table)
    assert.equal(told.reason, NOT_IN_CATALOG_REASON, table)
    assert.equal(told.status, null)
    assert.equal(told.body, null)
  }
  assert.equal(reached.catalog, 3)
})

test('sem cópia: data_query, qualquer consulta, dá NOT_IN_CATALOG e não lê ao vivo', async () => {
  const { tools, reached } = world(CATALOG)
  for (const sql of ['select 1', 'select count(*) from sync.vendas', 'select * from juntas']) {
    const told = await thrown(runOn(tools, 'data_query', { sql }))
    assert.equal(told.kind, 'NOT_IN_CATALOG', sql)
    assert.equal(told.reason, NOT_IN_CATALOG_REASON, sql)
  }
  assert.equal(reached.catalog, 3)
})

test('as descrições dizem que nenhuma tabela é mantida e não falam de cópia, de sync nem de estado de conexão', () => {
  const { tools } = world(CATALOG)
  for (const name of ['data_describe', 'data_query']) {
    const { description } = Object(tools)[name]
    assert.match(description, /NOT_IN_CATALOG/)
    assert.match(description, /No table of the company's data is kept yet|No table is kept yet/)
    assert.doesNotMatch(description, /sync|copy|copied|NOT_GIVEN|UTC offset/i)
  }
})
