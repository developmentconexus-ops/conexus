import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Catalog, PersonId } from '@conexus/hub-api'
import { readerAt } from '../access/test-principal.ts'
import { personOn } from '../identity/test-hub.ts'
import type { CompanyOn } from './test-company.ts'
import { companyOn } from './test-company.ts'

function inCompany(on: CompanyOn, personId = on.anaId) {
  return on.hub.data(readerAt({ companyId: on.companyId, personId, place: { kind: 'COMPANY' } }), {
    thread: null,
  })
}

test('sem cópia: Descrever devolve as ligações e as leituras ao vivo, e Consultar e ler tabela dão NOT_IN_CATALOG', async (t) => {
  const on = await companyOn(t)
  const data = inCompany(on)
  const described = await data.describe()
  assert.deepEqual(Object.keys(described).sort(), ['kind', 'systems'])
  const [system, ...others] = Catalog.parse(described).systems
  assert.deepEqual(others, [])
  assert.equal(system?.connection, on.connectionId)
  assert.ok(system && system.reads.length > 0, 'the live reads')
  const refused = { kind: 'NOT_IN_CATALOG' }
  for (const sql of ['select 1', 'select * from sync.sankhya_vendas', 'select 1; select 2'])
    assert.deepEqual(await data.read({ kind: 'QUERY', sql }), refused, sql)
  for (const table of ['sankhya_vendas', 'pedidos'])
    assert.deepEqual(await data.read({ kind: 'TABLE', table }), refused, table)
})

test('quem não é da empresa é recusado antes de qualquer resposta', async (t) => {
  const on = await companyOn(t)
  const stranger = await personOn(on.hub, { name: 'Zé Fora', email: 'ze@example.test' })
  await assert.rejects(
    () => inCompany(on, PersonId.parse(stranger.id)).read({ kind: 'QUERY', sql: 'select 1' }),
    (error: unknown) => Object(error).code === 'NOT_FOUND',
  )
})
