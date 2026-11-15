import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ordersCopy, STORE_A, STORE_B, storesOn } from '../copies/test-sources.ts'
import { call, codeOf, personOn, plantCompany } from '../identity/test-hub.ts'

test('as cópias que o Desligar apaga', async (t) => {
  const on = await storesOn(t)
  const both = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref, STORE_B.ref])
  const alone = await on.planted('pedidos_a', ordersCopy(true), [STORE_A.ref])
  assert.deepEqual(await on.ended(both), { kind: 'COMPLETE' })
  assert.deepEqual(await on.ended(alone), { kind: 'COMPLETE' })
  function path(ref: string) {
    return `${on.base}/${on.stores.get(ref)}/copies`
  }

  const listed = await call(on.hub, on.ana, 'GET', path(STORE_A.ref))
  assert.equal(listed.statusCode, 200, listed.body)
  assert.deepEqual(Object(listed.json()).copies, [
    { copyId: both, name: 'pedidos', mode: { kind: 'WHOLE' }, last: false, rows: 120 },
    { copyId: alone, name: 'pedidos_a', mode: { kind: 'CHANGES' }, last: true, rows: 120 },
  ])
  const ofB = await call(on.hub, on.ana, 'GET', path(STORE_B.ref))
  assert.deepEqual(
    Object(ofB.json()).copies.map((copy: { name: string; last: boolean }) => [
      copy.name,
      copy.last,
    ]),
    [['pedidos', false]],
  )

  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'accountRows', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  const quiet = await call(on.hub, on.ana, 'GET', path(STORE_A.ref))
  assert.deepEqual(
    Object(quiet.json()).copies.map((copy: { rows: number | null }) => copy.rows),
    [null, 120],
    'a contagem de quem segue vem nula; a da última fonte é a da cópia',
  )
  silent.mock.restore()

  const carla = await call(on.hub, on.carla, 'GET', path(STORE_A.ref))
  assert.deepEqual([carla.statusCode, codeOf(carla)], [404, 'NOT_FOUND'], 'sem manageConnections')
  const davi = await personOn(on.hub, { name: 'Davi Souza', email: 'davi@example.test' })
  const other = await plantCompany(on.hub.test, davi.id, 'Mercearia Lua')
  const elsewhere = await call(
    on.hub,
    davi,
    'GET',
    `/api/companies/${other}/connections/${on.stores.get(STORE_A.ref)}/copies`,
  )
  assert.deepEqual(
    [elsewhere.statusCode, codeOf(elsewhere)],
    [404, 'CONNECTION_NOT_FOUND'],
    'uma conexão de outra empresa',
  )
})

test('as cópias que o Desligar apaga: uma conexão sem cópia', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const listed = await call(
    on.hub,
    on.ana,
    'GET',
    `${on.base}/${on.stores.get(STORE_A.ref)}/copies`,
  )
  assert.deepEqual([listed.statusCode, Object(listed.json()).copies], [200, []])
})
