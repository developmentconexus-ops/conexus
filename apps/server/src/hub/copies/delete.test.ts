import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { CopyId, ProjectId } from '@conexus/hub-api'
import { appLogin, appLoginPassword } from '@conexus/hub-api'
import pg from 'pg'
import { call, codeOf, personOn, plantCompany, post } from '../identity/test-hub.ts'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn, holdPage, TEST_APP_LOGIN_KEY } from './test-copies.ts'
import { enableProposal, grantMatriz, proposalRows, proposed } from './test-proposals.ts'
import { copiesUrl, enabled, firstEnded } from './test-routes.ts'

/** One read as the Projeto's read login, as the edge reaches it: the rows' count, or the SQLSTATE that refused it. */
async function asApp(on: CopiesOn, projectId: ProjectId, text: string) {
  const { readLogin } = appLogin(projectId)
  const url = new URL(on.owner.reveal())
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

function owner(on: CopiesOn, text: string, values: unknown[] = []) {
  return on.hub.test.asOwner(text, values)
}

function apagar(on: CopiesOn, copyId: string, person = on.ana) {
  return call(on.hub, person, 'DELETE', `/api/companies/${on.companyId}/copies/${copyId}`)
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

const RELATIONS = ['copy', 'copy_source', 'copy_run', 'project_copy', 'copy_table_left']

async function rowsOf(on: CopiesOn, copyId: CopyId) {
  const found: Record<string, number> = {}
  for (const table of RELATIONS) {
    const column = table === 'copy' ? 'id' : 'copy_id'
    const [row] = await owner(
      on,
      `select count(*)::int n from copies.${table} where ${column} = $1`,
      [copyId],
    )
    found[table] = Number(row?.n)
  }
  return found
}

test('só ela: a outra cópia, a posição dela e a conexão ficam', async (t) => {
  const on = await copiesOn(t)
  const vendas = await released(on, 'vendas')
  const clientes = await released(on, 'clientes')
  const before = await asApp(on, on.projectId, 'select * from sync.clientes')
  const sourcesBefore = await owner(
    on,
    'select pass, position, watermark from copies.copy_source where copy_id = $1',
    [clientes],
  )
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.vendas'), { rows: 183 })

  const done = await apagar(on, vendas)
  assert.deepEqual([done.statusCode, Object(done.json())], [200, { tablesLeft: [] }])
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.vendas'), { refused: '42P01' })
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.clientes'), before)
  assert.deepEqual(
    await owner(on, 'select pass, position, watermark from copies.copy_source where copy_id = $1', [
      clientes,
    ]),
    sourcesBefore,
  )
  const kept = await call(on.hub, on.ana, 'GET', `${on.connections}/${on.connectionId}`)
  assert.equal(kept.statusCode, 200)
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_DELETED'))
})

test('o que sai: nenhuma linha da cópia, e a proposta fica sem ela', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const proposalId = await proposed(on)
  const made = await enableProposal(on, on.ana, proposalId)
  assert.equal(made.statusCode, 201, made.body)
  const copyId = Object(made.json()).copy.id
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ projectId: on.projectId, copyId },
  })
  assert.equal((await on.copies.projectView(on)).kind, 'COPIES')

  assert.equal((await apagar(on, copyId)).statusCode, 200)
  assert.deepEqual(await rowsOf(on, copyId), {
    ...{ copy: 0, copy_source: 0, copy_run: 0 },
    ...{ project_copy: 0, copy_table_left: 0 },
  })
  assert.deepEqual(
    (await proposalRows(on)).map((row) => [row.state, row.copy_id]),
    [['ACCEPTED', null]],
  )
  const view = await on.copies.projectView(on)
  assert.equal(view.kind, 'COPIES')
  if (view.kind === 'COPIES') assert.deepEqual(view.released, [])
})

test('de novo: a mesma resposta, e a cópia de outra empresa não muda', async (t) => {
  const on = await copiesOn(t)
  const vendas = await released(on, 'vendas')
  const first = await apagar(on, vendas)
  const again = await apagar(on, vendas)
  assert.deepEqual([again.statusCode, Object(again.json())], [200, { tablesLeft: [] }])
  assert.equal(first.statusCode, 200)

  const edu = await personOn(on.hub, { name: 'Edu Lima', email: 'edu@example.test' })
  const otherCompany = await plantCompany(on.hub.test, edu.id, 'Empresa B', 'empresa-b')
  const other = await released(on, 'clientes')
  const strange = await call(
    on.hub,
    edu,
    'DELETE',
    `/api/companies/${otherCompany}/copies/${other}`,
  )
  assert.deepEqual([strange.statusCode, Object(strange.json())], [200, { tablesLeft: [] }])
  assert.equal((await rowsOf(on, other)).copy, 1, 'a cópia da Empresa A fica')
})

test('sem permissão: a recusa do Pausar, e nada muda', async (t) => {
  const on = await copiesOn(t)
  const vendas = await released(on, 'vendas')
  const refused = await apagar(on, vendas, on.carla)
  const pause = await post(on.hub, on.carla, `${copiesUrl(on)}/${vendas}/pause`, {})
  assert.deepEqual([refused.statusCode, codeOf(refused)], [pause.statusCode, codeOf(pause)])
  assert.equal(refused.statusCode, 404)
  assert.equal((await rowsOf(on, vendas)).copy, 1)
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.vendas'), { rows: 183 })
  const unknown = await apagar(on, randomUUID(), on.carla)
  assert.equal(unknown.statusCode, 404)
})

test('rodada em andamento: ela termina INTERRUPTED e não deixa nada', async (t) => {
  const on = await copiesOn(t)
  const vendas = await released(on, 'vendas')
  const held = holdPage(on)
  const running = on.run(vendas)
  await held.arrived
  assert.equal((await apagar(on, vendas)).statusCode, 200)
  held.release()
  assert.deepEqual(await running, { kind: 'ENDED', outcome: { kind: 'INTERRUPTED' } })
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.vendas'), { refused: '42P01' })
  assert.deepEqual(await owner(on, 'select count(*)::int n from copies.copy_run'), [{ n: 0 }])
})

function schedulesOf(on: CopiesOn) {
  return on.hub.mastra.schedules.list()
}

test('agenda: sai com a cópia, pausada ou não', async (t) => {
  const on = await copiesOn(t)
  const active = await enabled(on, 'vendas')
  const paused = await enabled(on, 'clientes')
  await firstEnded(on, active.id)
  await firstEnded(on, paused.id)
  assert.equal(
    (await post(on.hub, on.ana, `${copiesUrl(on)}/${paused.id}/pause`, {})).statusCode,
    200,
  )
  assert.equal((await schedulesOf(on)).length, 2)
  assert.equal((await apagar(on, active.id)).statusCode, 200)
  assert.equal((await schedulesOf(on)).length, 1)
  assert.equal((await apagar(on, paused.id)).statusCode, 200)
  assert.equal((await schedulesOf(on)).length, 0)
})

test('banco calado antes: nada muda, e apagar de novo dá certo', async (t) => {
  const on = await copiesOn(t)
  const vendas = await released(on, 'vendas')
  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'revokeCopy', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  const refused = await apagar(on, vendas)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'COPY_DATABASE_UNAVAILABLE'])
  assert.equal((await rowsOf(on, vendas)).copy, 1)
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.vendas'), { rows: 183 })
  silent.mock.restore()
  const again = await apagar(on, vendas)
  assert.deepEqual([again.statusCode, Object(again.json())], [200, { tablesLeft: [] }])
})

test('banco calado depois: a cópia sai, o app não lê mais e a tabela cai na vez seguinte', async (t) => {
  const on = await copiesOn(t)
  const vendas = await released(on, 'vendas')
  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'dropCopyTable', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  const done = await apagar(on, vendas)
  assert.deepEqual([done.statusCode, Object(done.json())], [200, { tablesLeft: ['vendas'] }])
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.vendas'), { refused: '42501' })
  silent.mock.restore()
  const next = await released(on, 'clientes')
  assert.deepEqual(Object(await apagar(on, next).then((r) => r.json())), { tablesLeft: [] })
  assert.deepEqual(await owner(on, 'select name from copies.copy_table_left'), [])
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.vendas'), { refused: '42P01' })
})

test('religar: o mesmo nome começa vazio e sem a leitura do app', async (t) => {
  const on = await copiesOn(t)
  const vendas = await released(on, 'vendas')
  assert.equal((await apagar(on, vendas)).statusCode, 200)
  const again = await on.enable('vendas')
  assert.notEqual(again, vendas)
  assert.deepEqual(await asApp(on, on.projectId, 'select * from sync.vendas'), { refused: '42501' })
  const [fresh] = await owner(on, 'select rows from copies.copy where id = $1', [again])
  assert.equal(fresh?.rows, null)
})
