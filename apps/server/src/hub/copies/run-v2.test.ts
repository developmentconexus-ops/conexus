import assert from 'node:assert/strict'
import { test } from 'node:test'
import { phraseOf } from '@conexus/hub-api'
import { call } from '../identity/test-hub.ts'
import { asSync } from './test-copies.ts'
import {
  BY_ACCOUNT,
  CEILED,
  callsOf,
  ITEMS_COPY,
  ordersCopy,
  STORE_A,
  STORE_B,
  storesOn,
  tableOf,
} from './test-sources.ts'

const ORDERS = 120

test('a passada de uma leitura de lista', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(true), [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  const first = await tableOf(on, 'pedidos')
  assert.equal(first.length, ORDERS)
  assert.ok(
    first.every(
      ([account, name, , pass]) => account === STORE_A.ref && name === 'Loja A' && pass === 0,
    ),
  )
  assert.equal(callsOf(on.door, STORE_A).length, 3, '120 pedidos em páginas de 50')
  const [source] = await on.sourcesOf(copyId)
  assert.equal(source?.pass, 1)
  assert.equal(source?.position, null)
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  assert.equal((await tableOf(on, 'pedidos')).length, ORDERS, 'nenhuma linha duplica nem sai')
})

test('a primeira passada sem filtro', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(true), [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  const changedFrom = 'order.date_last_updated.from'
  assert.ok(callsOf(on.door, STORE_A).every((url) => !url.searchParams.has(changedFrom)))
  const [{ watermark } = {}] = await on.sourcesOf(copyId)
  assert.ok(watermark instanceof Date, 'a marca é a hora em que a passada começou')
  on.door.seen.length = 0
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  const since = new Date(watermark.getTime() - 86_400_000).toISOString()
  assert.ok(
    callsOf(on.door, STORE_A).every((url) => url.searchParams.get(changedFrom) === since),
    'a marca menos um dia',
  )
})

test('a passada de uma leitura de lista: a célula que não cabe no tipo termina em erro', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const misfit = { ...ordersCopy(true) }
  misfit.columns = misfit.columns.map((column) =>
    column.name === 'status' ? { ...column, type: 'bigint' } : column,
  )
  const copyId = await on.planted('pedidos', misfit, [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'ERROR', code: 'COPY_SOURCE_UNREADABLE' })
  const [source] = await on.sourcesOf(copyId)
  assert.deepEqual([source?.position, source?.watermark, source?.pass], [null, null, 0])
  assert.deepEqual(await tableOf(on, 'pedidos'), [])
})

const WAIT = { kind: 'PARTIAL', reason: 'WAIT' }

test('o fornecedor pede para esperar', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  on.door.busy.set(2, '60')
  assert.deepEqual(await on.ended(copyId), WAIT)
  const [waiting] = await on.sourcesOf(copyId)
  assert.deepEqual(waiting?.position, { kind: 'OFFSET', offset: 50 }, 'a posição fica')
  assert.equal(waiting?.watermark, null, 'a marca não anda')
  const until = waiting?.wait_until
  assert.ok(until instanceof Date && until.getTime() > Date.now() + 50_000, 'a hora dita')
  assert.equal((await tableOf(on, 'pedidos')).length, 50, 'nada é apagado')

  const asked = on.door.seen.length
  assert.deepEqual(await on.ended(copyId), WAIT)
  assert.equal(on.door.seen.length, asked, 'antes da hora, nenhuma chamada')

  await on.hub.test.asOwner(
    `update copies.copy_source set wait_until = now() - interval '1 second' where copy_id = $1`,
    [copyId],
  )
  on.door.busy.set(asked + 2, null)
  assert.deepEqual(await on.ended(copyId), WAIT)
  const [again] = await on.sourcesOf(copyId)
  assert.deepEqual(again?.position, { kind: 'OFFSET', offset: 100 }, 'continuou da posição')
  assert.equal(again?.wait_until, null, 'sem Retry-After, a próxima pode chamar')
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  const rows = await tableOf(on, 'pedidos')
  assert.equal(rows.length, ORDERS)
  assert.equal(new Set(rows.map((row) => row[2])).size, ORDERS, 'sem repetição')
  assert.equal(on.door.seen.length, asked + 3)
})

test('o fornecedor pede para esperar: o limite do aplicativo vale para todas as contas', async (t) => {
  const on = await storesOn(t)
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref, STORE_B.ref])
  on.door.busy.set(1, '60')
  assert.deepEqual(await on.ended(copyId), WAIT)
  assert.equal(callsOf(on.door, STORE_B).length, 0, 'a segunda conta não é chamada')
  assert.deepEqual(await tableOf(on, 'pedidos'), [])
})

test('o fornecedor pede para esperar: o limite de uma conta não diz nada da outra', async (t) => {
  const on = await storesOn(t, { catalog: BY_ACCOUNT })
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref, STORE_B.ref])
  on.door.busy.set(1, '60')
  assert.deepEqual(await on.ended(copyId), WAIT)
  assert.equal(callsOf(on.door, STORE_B).length, 3, 'a segunda conta lê as suas páginas')
  const rows = await tableOf(on, 'pedidos')
  assert.equal(rows.length, ORDERS)
  assert.ok(rows.every(([account]) => account === STORE_B.ref))
  const [a, b] = await on.sourcesOf(copyId)
  assert.deepEqual([a?.pass, a?.wait_until instanceof Date, b?.pass], [0, true, 1])
})

test('o cursor vencido recomeça', async (t) => {
  let ahead = 0
  const on = await storesOn(t, { stores: [STORE_A], now: () => new Date(Date.now() + ahead) })
  const copyId = await on.planted('anuncios', ITEMS_COPY, [STORE_A.ref])
  on.door.busy.set(3, null)
  assert.deepEqual(await on.ended(copyId), WAIT)
  const [held] = await on.sourcesOf(copyId)
  assert.equal(Object(held?.position).kind, 'CURSOR')

  ahead = 60_000
  let asked = on.door.seen.length
  on.door.busy.set(asked + 2, null)
  assert.deepEqual(await on.ended(copyId), WAIT)
  assert.ok(on.door.seen[asked]?.searchParams.has('scroll_id'), 'dentro da validade, continua')
  assert.ok(!on.hub.lines.some((line) => line.message === 'COPY_PASS_RESTARTED'))

  ahead += 6 * 60_000
  asked = on.door.seen.length
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  const restart = on.door.seen[asked]
  assert.equal(restart?.searchParams.get('search_type'), 'scan')
  assert.ok(!restart?.searchParams.has('scroll_id'), 'recomeça do começo')
  const restarted = on.hub.lines.find((line) => line.message === 'COPY_PASS_RESTARTED')
  assert.equal(restarted?.fields.pass, 0, 'o mesmo número de passada')
  const rows = await tableOf(on, 'anuncios')
  assert.equal(rows.length, 1300, 'a passada fecha certa')
  assert.ok(rows.every((row) => row[3] === 0))
  assert.equal((await on.sourcesOf(copyId))[0]?.pass, 1)
})

test('o teto da leitura', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A], catalog: CEILED })
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'ERROR', code: 'COPY_SOURCE_CEILING' })
  const [source] = await on.sourcesOf(copyId)
  assert.deepEqual(source?.position, { kind: 'OFFSET', offset: 50 }, 'a posição guardada')
  assert.equal(source?.watermark, null)
  assert.equal((await tableOf(on, 'pedidos')).length, 50, 'nada sai')
  const listed = await call(on.hub, on.ana, 'GET', `/api/companies/${on.companyId}/copies`)
  const [copy] = Object(listed.json()).copies
  assert.deepEqual(copy?.run?.outcome, { kind: 'ERROR', code: 'COPY_SOURCE_CEILING' })
  assert.equal(
    phraseOf('COPY_SOURCE_CEILING'),
    'A leitura chegou ao máximo de linhas que o sistema entrega.',
  )
})

test('duas contas numa tabela', async (t) => {
  const on = await storesOn(t)
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref, STORE_B.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  const rows = await tableOf(on, 'pedidos')
  assert.equal(rows.length, 2 * ORDERS, 'o mesmo id em duas contas dá duas linhas')
  const sources = await on.sourcesOf(copyId)
  assert.deepEqual(
    sources.map((source) => [source.account_ref, source.pass, source.position]),
    [
      [STORE_A.ref, 1, null],
      [STORE_B.ref, 1, null],
    ],
  )

  const alone = await on.planted('pedidos_a', ordersCopy(false), [STORE_A.ref])
  await assert.rejects(
    on.hub.test.asOwner(
      `insert into copies.copy_source (company_id, copy_id, connector_id, connection_id, account_ref, created_at)
       select company_id, $1, connector_id, id, $3, now() from connectors.connection where id = $2`,
      [alone, on.stores.get(STORE_B.ref), STORE_A.ref],
    ),
    (error: unknown) => Object(error).constraint === 'copy_source_copy_id_account_ref_key',
  )

  await asSync(on.owner, (client) =>
    client.query(
      `insert into sync.pedidos (id, status, _account, _account_name, _pass)
       values (9, 'sumiu', $1, 'Loja A', 0), (9, 'sumiu', $2, 'Loja B', 0)`,
      [STORE_A.ref, STORE_B.ref],
    ),
  )
  on.door.busy.set(on.door.seen.length + 4, '60')
  assert.deepEqual(await on.ended(copyId), WAIT)
  const after = await tableOf(on, 'pedidos')
  function of(ref: string) {
    return after.filter(([account]) => account === ref).map((row) => row[2])
  }
  assert.equal(of(STORE_A.ref).length, ORDERS, 'a passada de A apaga o que ela não gravou')
  assert.ok(!of(STORE_A.ref).includes('9'))
  assert.equal(of(STORE_B.ref).length, ORDERS + 1, 'as linhas de B ficam')
})

test('o nome da conta segue a conexão', async (t) => {
  const on = await storesOn(t, { stores: [STORE_A] })
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  await on.hub.test.asOwner(`update connectors.connection set name = 'Loja Centro' where id = $1`, [
    on.stores.get(STORE_A.ref),
  ])
  assert.ok((await tableOf(on, 'pedidos')).every((row) => row[1] === 'Loja A'))
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  assert.ok((await tableOf(on, 'pedidos')).every((row) => row[1] === 'Loja Centro'))
})

test('a conta desligada', async (t) => {
  const on = await storesOn(t)
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref, STORE_B.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  function unlink(ref: string) {
    return call(on.hub, on.ana, 'DELETE', `${on.base}/${on.stores.get(ref)}`)
  }
  const b = await unlink(STORE_B.ref)
  assert.deepEqual([b.statusCode, Object(b.json()).tablesLeft], [200, []])
  assert.deepEqual(
    (await on.sourcesOf(copyId)).map((source) => source.account_ref),
    [STORE_A.ref],
    'só a fonte da conexão sai',
  )
  const left = await tableOf(on, 'pedidos')
  assert.ok(left.length === ORDERS && left.every(([account]) => account === STORE_A.ref))

  await asSync(on.owner, (client) =>
    client.query(
      `insert into sync.pedidos (id, status, _account, _account_name, _pass) values (9, 'tarde', $1, 'Loja B', 0)`,
      [STORE_B.ref],
    ),
  )
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  const netted = await tableOf(on, 'pedidos')
  assert.ok(netted.length === ORDERS && netted.every(([account]) => account === STORE_A.ref))

  const a = await unlink(STORE_A.ref)
  assert.deepEqual([a.statusCode, Object(a.json()).tablesLeft], [200, []])
  assert.deepEqual(
    await on.hub.test.asOwner('select count(*)::int as n from copies.copy where id = $1', [copyId]),
    [{ n: 0 }],
    'a última conexão encerra a cópia na hora, sem horário nem rodada',
  )
  assert.deepEqual(
    await on.hub.test.asOwner(
      'select count(*)::int as n from copies.copy c where not exists (select 1 from copies.copy_source s where s.copy_id = c.id)',
    ),
    [{ n: 0 }],
    'nenhuma cópia sem fonte',
  )
  const [gone] = await asSync(
    on.owner,
    async (client) => (await client.query(`select to_regclass('sync.pedidos') as found`)).rows,
  )
  assert.equal(gone?.found, null, 'a tabela saiu')
})

test('o registro não leva dado', async (t) => {
  let ahead = 0
  const on = await storesOn(t, { stores: [STORE_A], now: () => new Date(Date.now() + ahead) })
  const items = await on.planted('anuncios', ITEMS_COPY, [STORE_A.ref])
  on.door.busy.set(2, '30')
  assert.deepEqual(await on.ended(items), WAIT)
  await on.hub.test.asOwner('update copies.copy_source set wait_until = null where copy_id = $1', [
    items,
  ])
  ahead = 10 * 60_000
  on.door.busy.set(on.door.seen.length + 2, null)
  assert.deepEqual(await on.ended(items), WAIT)
  const orders = await on.planted('pedidos', ordersCopy(true), [STORE_A.ref])
  assert.deepEqual(await on.ended(orders), { kind: 'COMPLETE' })
  assert.deepEqual(await on.ended(orders), { kind: 'COMPLETE' })
  const copyLines = on.hub.lines.filter((line) => line.message.startsWith('COPY_'))
  assert.deepEqual([...new Set(copyLines.map((line) => line.message))].sort(), [
    'COPY_PASS_RESTARTED',
    'COPY_RUN_ENDED',
  ])
  const allowed = new Set(
    ['companyId', 'copyId', 'runId', 'connectionId', 'pass', 'outcome', 'reason'].concat([
      'pages',
      'read',
      'written',
      'ms',
    ]),
  )
  for (const line of copyLines)
    for (const field of Object.keys(line.fields))
      assert.ok(allowed.has(field), `${line.message} ${field}`)
  const said = JSON.stringify(on.hub.lines)
  for (const data of [
    'items-',
    'scroll_id',
    'scan',
    'MLB1000000',
    'changedFrom',
    'paid',
    '2026-09-10',
  ])
    assert.ok(!said.includes(data), `o registro não diz ${data}`)
  assert.ok(
    on.hub.lines.some((line) => line.message === 'CONNECTOR_CALLED' && line.fields.by === 'copy'),
  )
})
