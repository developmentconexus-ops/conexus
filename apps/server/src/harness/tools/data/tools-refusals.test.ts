import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CATALOG, runOn, thrown, world } from './test-world.ts'

test('o catálogo que não responde sai como erro da ferramenta com a sua frase, nas duas ferramentas', async () => {
  const { tools } = world(CATALOG, { catalog: async () => ({ kind: 'CATALOG_UNAVAILABLE' }) })
  for (const [name, input] of [
    ['data_describe', {}],
    ['data_describe', { table: 'vendas' }],
    ['data_query', { sql: 'select 1' }],
  ] as const) {
    const error = await runOn(tools, name, input).then(
      () => assert.fail('a recusa voltou como resultado'),
      (cause: Error) => cause,
    )
    assert.equal(error.name, 'DataRefused')
    const told = JSON.parse(error.message)
    assert.equal(told.kind, 'CATALOG_UNAVAILABLE')
    assert.equal(told.reason, 'The catalog did not answer. Tell the person to try again.')
    assert.equal(told.code, null)
    assert.equal(told.message, null)
  }
})

test('o abortSignal vai ao catálogo de data_describe, com e sem tabela', async () => {
  const { tools, reached } = world(CATALOG)
  const controller = new AbortController()
  const context = { abortSignal: controller.signal }
  await runOn(tools, 'data_describe', {}, context)
  await thrown(runOn(tools, 'data_describe', { table: 'vendas' }, context))
  assert.equal(reached.signals.length, 2)
  assert.ok(reached.signals.every((signal) => signal === controller.signal))
})

test('o abortSignal vai ao catálogo de data_query', async () => {
  const { tools, reached } = world(CATALOG)
  const controller = new AbortController()
  await thrown(runOn(tools, 'data_query', { sql: 'select 1' }, { abortSignal: controller.signal }))
  assert.equal(reached.signals.length, 1)
  assert.ok(reached.signals.every((signal) => signal === controller.signal))
})

test('o SQL vazio ou acima de 4000 caracteres é recusado pelo esquema, e a fonte não é chamada', async () => {
  const { tools, reached } = world(CATALOG)
  for (const sql of ['   ', 'x'.repeat(4001)]) {
    const answer = await runOn(tools, 'data_query', { sql })
    assert.equal(answer.error, true)
    assert.match(String(answer.message), /sql/)
  }
  assert.equal(reached.catalog, 0)
  assert.equal(
    (await thrown(runOn(tools, 'data_query', { sql: 'select 1' }))).kind,
    'NOT_IN_CATALOG',
  )
  assert.equal(reached.catalog, 1)
})

test('a tabela pedida tem no máximo 40 caracteres', async () => {
  const { tools, reached } = world(CATALOG)
  const answer = await runOn(tools, 'data_describe', { table: 'x'.repeat(41) })
  assert.equal(answer.error, true)
  assert.equal(reached.catalog, 0)
})
