import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { CopyId, ProjectId } from '@conexus/hub-api'
import { appLogin, appLoginPassword, ConnectionId } from '@conexus/hub-api'
import pg from 'pg'
import { COPY_WORKFLOW } from '../../builder/copy-clock/public.ts'
import type { CopiesOn } from '../copies/test-copies.ts'
import { copiesOn, TEST_APP_LOGIN_KEY } from '../copies/test-copies.ts'
import { copiesUrl, enabled, firstEnded } from '../copies/test-routes.ts'
import type { StoresOn } from '../copies/test-sources.ts'
import { ordersCopy, STORE_A, STORE_B, storesOn } from '../copies/test-sources.ts'
import { call, codeOf, post } from '../identity/test-hub.ts'
import { CopyName } from './public.ts'
import { linkSankhya, testOf } from './test-connections.ts'

type Owner = CopiesOn['owner']

/** One read as the Projeto's read login, as the edge reaches it: the rows' count, or the SQLSTATE that refused it. */
async function asApp(owner: Owner, projectId: ProjectId, text: string) {
  const { readLogin } = appLogin(projectId)
  const url = new URL(owner.reveal())
  url.username = readLogin
  url.password = await appLoginPassword({ key: TEST_APP_LOGIN_KEY, login: readLogin })
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  try {
    return { rows: (await client.query(text)).rowCount }
  } catch (error) {
    if (error instanceof pg.DatabaseError) return { refused: error.code }
    throw error
  } finally {
    await client.end()
  }
}

function unlink(on: Pick<CopiesOn, 'hub' | 'ana'>, base: string, connectionId: string) {
  return call(on.hub, on.ana, 'DELETE', `${base}/${connectionId}`)
}

async function copiesLeft(on: Pick<CopiesOn, 'hub'>) {
  return (await on.hub.test.asOwner('select name from copies.copy order by name')).map(
    (row) => row.name,
  )
}

/** Turned on, run once and released to the Projeto Pedidos. */
async function released(on: CopiesOn, model: string) {
  const copyId = await on.enable(model)
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ projectId: on.projectId, copyId },
  })
  return copyId
}

/** Another Sankhya connection of the company, linked and tested. */
async function filial(on: CopiesOn) {
  const linked = await linkSankhya(
    on.hub,
    on.ana,
    on.connections,
    on.fake.credential,
    undefined,
    'Filial',
  )
  assert.equal(linked.statusCode, 201, linked.body)
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  await testOf(on.hub, on.ana, on.connections, connectionId)
  return connectionId
}

test('desligar tira as linhas e a leitura do app', async (t) => {
  const on = await copiesOn(t)
  const vendas = await released(on, 'vendas')
  const clientes = await released(on, 'clientes')
  await on.copies.pause({ companyId: on.companyId, personId: on.anaId, copyId: clientes })
  assert.deepEqual(await asApp(on.owner, on.projectId, 'select * from sync.vendas'), { rows: 183 })

  const gone = await unlink(on, on.connections, on.connectionId)
  assert.deepEqual([gone.statusCode, Object(gone.json()).tablesLeft], [200, []])
  assert.deepEqual(await copiesLeft(on), [], 'a cópia de uma conexão acaba com ela, pausada também')
  for (const name of ['vendas', 'clientes'])
    assert.deepEqual(await asApp(on.owner, on.projectId, `select * from sync.${name}`), {
      refused: '42P01',
    })

  const other = await filial(on)
  const again = await on.copies.enable({
    ...{ companyId: on.companyId, personId: on.anaId },
    source: { kind: 'MODEL', connectionId: other, model: CopyName.parse('vendas') },
    interval: '30m',
    attemptKey: randomUUID(),
  })
  assert.notEqual(again, vendas)
  assert.deepEqual(
    await asApp(on.owner, on.projectId, 'select * from sync.vendas'),
    { refused: '42501' },
    'a cópia nova com o mesmo nome começa sem a leitura do app',
  )
  const [empty] = await on.hub.test.asOwner('select rows from copies.copy where id = $1', [again])
  assert.equal(empty?.rows, null, 'e vazia')
})

function schedulesOf(on: CopiesOn) {
  return on.hub.mastra.schedules.list({ workflowId: COPY_WORKFLOW })
}

test('desligar tira a agenda da cópia que acaba, pausada também', async (t) => {
  const on = await copiesOn(t)
  const active = await enabled(on, 'vendas')
  const paused = await enabled(on, 'clientes')
  await firstEnded(on, active.id)
  await firstEnded(on, paused.id)
  const pause = await post(on.hub, on.ana, `${copiesUrl(on)}/${paused.id}/pause`, {})
  assert.equal(pause.statusCode, 200)
  assert.equal((await schedulesOf(on)).length, 2)
  assert.equal((await unlink(on, on.connections, on.connectionId)).statusCode, 200)
  assert.deepEqual(await copiesLeft(on), [])
  assert.equal((await schedulesOf(on)).length, 0)
})

/** Two stores' copy of orders, run once and released to the Projeto Pedidos. */
async function storesCopy(on: StoresOn): Promise<CopyId> {
  const copyId = await on.planted('pedidos', ordersCopy(false), [STORE_A.ref, STORE_B.ref])
  assert.deepEqual(await on.ended(copyId), { kind: 'COMPLETE' })
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ projectId: on.projectId, copyId },
  })
  return copyId
}

test('desligar tira as linhas e a leitura do app: duas contas, uma depois da outra', async (t) => {
  const on = await storesOn(t)
  await storesCopy(on)
  const read = 'select * from sync.pedidos'
  assert.deepEqual(await asApp(on.owner, on.projectId, read), { rows: 240 })
  const a = await unlink(on, on.base, String(on.stores.get(STORE_A.ref)))
  assert.equal(a.statusCode, 200)
  assert.deepEqual(await asApp(on.owner, on.projectId, read), { rows: 120 }, 'sem esperar rodada')
  assert.deepEqual(
    await asApp(
      on.owner,
      on.projectId,
      `select * from sync.pedidos where _account = '${STORE_A.ref}'`,
    ),
    { rows: 0 },
  )
  assert.deepEqual(await copiesLeft(on), ['pedidos'])
  const b = await unlink(on, on.base, String(on.stores.get(STORE_B.ref)))
  assert.deepEqual([b.statusCode, Object(b.json()).tablesLeft], [200, []])
  assert.deepEqual(await copiesLeft(on), [])
  assert.deepEqual(await asApp(on.owner, on.projectId, read), { refused: '42P01' })
})

test('desligar tira as linhas e a leitura do app: o banco da empresa calado antes do Hub', async (t) => {
  const on = await storesOn(t)
  await storesCopy(on)
  const connectionId = String(on.stores.get(STORE_A.ref))
  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'dropAccountRows', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  const refused = await unlink(on, on.base, connectionId)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'COPY_DATABASE_UNAVAILABLE'])
  const still = await call(on.hub, on.ana, 'GET', `${on.base}/${connectionId}`)
  assert.equal(still.statusCode, 200, 'a conexão continua')
  assert.equal(on.fake.revocations().length, 0, 'nada sai do fornecedor')
  assert.deepEqual(await copiesLeft(on), ['pedidos'])
  silent.mock.restore()
  const again = await unlink(on, on.base, connectionId)
  assert.deepEqual([again.statusCode, Object(again.json()).tablesLeft], [200, []])
  assert.deepEqual(await asApp(on.owner, on.projectId, 'select * from sync.pedidos'), {
    rows: 120,
  })
})

test('desligar tira as linhas e a leitura do app: o banco da empresa calado depois do Hub', async (t) => {
  const on = await copiesOn(t)
  await released(on, 'vendas')
  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'dropCopyTable', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  const gone = await unlink(on, on.connections, on.connectionId)
  assert.deepEqual([gone.statusCode, Object(gone.json()).tablesLeft], [200, ['vendas']])
  const missing = await call(on.hub, on.ana, 'GET', `${on.connections}/${on.connectionId}`)
  assert.equal(missing.statusCode, 404, 'a conexão já não existe')
  assert.deepEqual(await copiesLeft(on), [])
  const left = await on.hub.test.asOwner('select name from copies.copy_table_left')
  assert.deepEqual(left, [{ name: 'vendas' }])
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_TABLES_LEFT'))
  silent.mock.restore()

  const other = await filial(on)
  await on.copies.enable({
    ...{ companyId: on.companyId, personId: on.anaId },
    source: { kind: 'MODEL', connectionId: other, model: CopyName.parse('clientes') },
    interval: '30m',
    attemptKey: randomUUID(),
  })
  assert.deepEqual(await on.hub.test.asOwner('select name from copies.copy_table_left'), [])
  assert.deepEqual(await asApp(on.owner, on.projectId, 'select * from sync.vendas'), {
    refused: '42P01',
  })
})
