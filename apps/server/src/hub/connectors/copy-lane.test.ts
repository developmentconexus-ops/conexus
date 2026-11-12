import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Connector } from '@conexus/connectors'
import type { CopyId } from '@conexus/hub-api'
import { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import type { StoresOn } from '../copies/test-sources.ts'
import {
  BY_ACCOUNT,
  callsOf,
  ITEMS_COPY,
  ordersCopy,
  STORE_A,
  STORE_B,
  storesOn,
} from '../copies/test-sources.ts'
import { personOn, plantCompany, post } from '../identity/test-hub.ts'
import { linkMercadoLivre, testOf } from './test-connections.ts'

const WAIT = { kind: 'PARTIAL', reason: 'WAIT' }

/**
 * Empresa Teste with Loja A, and Mercearia Lua with Loja B on the same Hub. Two companies' copies
 * never meet in one database here: every act on it answers done, so only the calls are watched.
 */
async function twoCompanies(t: TestContext, catalog?: readonly Connector[]) {
  const on = await storesOn(t, { catalog, stores: [STORE_A], companyDatabase: false })
  const davi = await personOn(on.hub, { name: 'Davi Souza', email: 'davi@example.test' })
  const lua = CompanyId.parse(await plantCompany(on.hub.test, davi.id, 'Mercearia Lua'))
  on.fake.switches.account = STORE_B
  const linked = await linkMercadoLivre(on.hub, davi, lua, {
    connector: 'mercado-livre',
    name: 'Loja Lua',
  })
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  await testOf(on.hub, davi, `/api/companies/${lua}/connections`, connectionId)
  on.stores.set(STORE_B.ref, connectionId)
  const made = await post(on.hub, davi, `/api/companies/${lua}/projects`, { name: 'Pedidos' })
  assert.equal(made.statusCode, 201, made.body)
  const daviId = PersonId.parse(davi.id)
  for (const [companyId, personId] of [
    [on.companyId, on.anaId],
    [lua, daviId],
  ] as const)
    await on.hub.test.database.command({ kind: 'COMPANY', companyId, personId }, (tx) =>
      on.hub.projects.ports.recordDatabaseHost(tx, { companyId, host: `${companyId}.test` }),
    )
  const sql = on.hub.postgres.companyPostgres
  t.mock.method(sql, 'syncAddress', async () => on.owner)
  t.mock.method(sql, 'writePage', async () => ({ kind: 'DONE' as const, value: [] }))
  t.mock.method(sql, 'closePass', async () => ({ kind: 'DONE' as const, rows: 0 }))
  t.mock.method(sql, 'dropForeignRows', async () => ({ kind: 'DONE' as const, value: [] }))
  on.door.seen.length = 0
  return {
    on,
    lua: { companyId: lua, personId: daviId },
    run: (companyId: CompanyId, copyId: CopyId) =>
      on.copies.run({ companyId, copyId }, new AbortController().signal),
  }
}

async function until(holds: () => boolean, what: string) {
  for (let waited = 0; !holds(); waited += 10) {
    assert.ok(waited < 800, what)
    await sleep(10)
  }
}

function holdCalls(on: StoresOn) {
  const held = Promise.withResolvers<void>()
  on.door.held = held
  return () => {
    on.door.held = undefined
    held.resolve()
  }
}

test('uma chamada de cópia por vez por conector', async (t) => {
  const { on, lua, run } = await twoCompanies(t)
  const a = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  const b = await on.planted('pedidos', ordersCopy(false), [STORE_B.ref], lua)
  const release = holdCalls(on)
  const first = run(on.companyId, a)
  await until(() => on.door.open === 1, 'a primeira chamada chega ao dublê')
  const second = run(lua.companyId, b)
  await sleep(300)
  assert.equal(on.door.open, 1, 'a outra empresa espera a vez')
  assert.equal(callsOf(on.door, STORE_B).length, 0)
  release()
  assert.deepEqual(await Promise.all([first, second]), [
    { kind: 'ENDED', outcome: { kind: 'COMPLETE' } },
    { kind: 'ENDED', outcome: { kind: 'COMPLETE' } },
  ])
  assert.equal(on.door.most, 1, 'nunca duas chamadas abertas')
  assert.ok(callsOf(on.door, STORE_A).length > 1 && callsOf(on.door, STORE_B).length > 1)
})

test('uma chamada de cópia por vez por conector: o que conta por conta se sobrepõe', async (t) => {
  const { on, lua, run } = await twoCompanies(t, BY_ACCOUNT)
  const a = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  const b = await on.planted('pedidos', ordersCopy(false), [STORE_B.ref], lua)
  const release = holdCalls(on)
  const both = Promise.all([run(on.companyId, a), run(lua.companyId, b)])
  await until(() => on.door.open === 2, 'as duas contas chamam juntas')
  release()
  assert.deepEqual(await both, [
    { kind: 'ENDED', outcome: { kind: 'COMPLETE' } },
    { kind: 'ENDED', outcome: { kind: 'COMPLETE' } },
  ])
  assert.equal(on.door.most, 2)
})

test('uma chamada de cópia por vez por conector: o prazo passa na fila', async (t) => {
  const { on, lua, run } = await twoCompanies(t)
  const a = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  const b = await on.planted('pedidos', ordersCopy(false), [STORE_B.ref], lua)
  const items = await on.planted('anuncios', ITEMS_COPY, [STORE_B.ref], lua)
  on.door.busy.set(2, null)
  assert.deepEqual(await run(lua.companyId, items), { kind: 'ENDED', outcome: WAIT })
  const [kept] = await on.sourcesOf(items)
  assert.equal(Object(kept?.position).kind, 'CURSOR')
  const asked = on.door.seen.length

  const release = holdCalls(on)
  const first = run(on.companyId, a)
  await until(() => on.door.open === 1, 'a primeira chamada chega ao dublê')
  const second = run(lua.companyId, b)
  await sleep(100)
  assert.deepEqual(await run(lua.companyId, items), { kind: 'ENDED', outcome: WAIT })
  assert.equal(
    on.door.seen.slice(asked).filter((url) => url.pathname.includes('/items/')).length,
    0,
    'sem chamar',
  )
  const [after] = await on.sourcesOf(items)
  assert.deepEqual(
    [after?.position, after?.pass, after?.wait_until],
    [kept?.position, kept?.pass, null],
    'a posição fica, sem wait_until',
  )
  release()
  await Promise.all([first, second])
})
