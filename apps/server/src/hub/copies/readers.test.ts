import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import { RoleId } from '@conexus/hub-api'
import pg from 'pg'
import { testAppsConfig } from '../../platform/test-cloudflare.ts'
import { readLoginOf, roleLoginOf } from '../../platform/test-company-postgres.ts'
import { call, post } from '../identity/test-hub.ts'
import { SANKHYA_READS } from '../identity/test-kit.ts'
import type { CopiesOn } from './test-copies.ts'
import { copiesOn, errorOf } from './test-copies.ts'
import { enableProposal, grantMatriz, proposed } from './test-proposals.ts'

const KEY = testAppsConfig().appLoginKey

async function roleOn(on: CopiesOn, label: string, connectors: object = { sankhya: ['pedidos'] }) {
  const made = await post(on.hub, on.ana, `/api/companies/${on.companyId}/roles`, {
    label,
    connectors,
  })
  assert.equal(made.statusCode, 201, made.body)
  const role = String(Object(made.json()).role.role)
  const [row] = await on.hub.test.asOwner(
    'select id from auth.organization_role where company_id = $1 and role = $2',
    [on.companyId, role],
  )
  return { role, id: RoleId.parse(row?.id) }
}

async function mark(on: CopiesOn, copyId: CopyId, roleId: RoleId) {
  await on.hub.test.asOwner(
    `insert into copies.copy_reader (company_id, copy_id, role_id, granted_by, granted_at)
      values ($1, $2, $3, $4, now())`,
    [on.companyId, copyId, roleId, on.ana.id],
  )
}

async function unmark(on: CopiesOn, copyId: CopyId, roleId: RoleId) {
  await on.hub.test.asOwner('delete from copies.copy_reader where copy_id = $1 and role_id = $2', [
    copyId,
    roleId,
  ])
}

async function readersOf(on: CopiesOn, copyId: string) {
  return on.hub.test.asOwner('select role_id from copies.copy_reader where copy_id = $1', [copyId])
}

async function asRole(on: CopiesOn, roleId: RoleId, table: string) {
  const client = new pg.Client({
    connectionString: (await roleLoginOf(on.owner, KEY, roleId)).reveal(),
  })
  await client.connect()
  try {
    return { rows: (await client.query(`select * from sync.${table}`)).rowCount }
  } catch (error) {
    if (error instanceof pg.DatabaseError) return { refused: error.code }
    throw error
  } finally {
    await client.end()
  }
}

async function roleLoginsOf(on: CopiesOn) {
  const client = new pg.Client({ connectionString: on.owner.reveal() })
  await client.connect()
  try {
    const found = await client.query(
      `select rolname from pg_roles where rolname like 'conexus\\_role\\_%'
        and has_schema_privilege(oid, 'sync', 'USAGE') order by 1`,
    )
    return found.rows.map((row) => String(row.rolname))
  } finally {
    await client.end()
  }
}

async function ended(on: CopiesOn, copyId: CopyId) {
  const end = await on.run(copyId)
  assert.equal(end.kind, 'ENDED', JSON.stringify(end))
  return end
}

function logged(on: CopiesOn, message: string) {
  return on.hub.lines.filter((line) => line.message === message).map((line) => line.fields)
}

function holdNext(t: TestContext, on: CopiesOn, act: 'reconcileReaders' | 'takeReadersTicket') {
  const postgres = on.hub.postgres.companyPostgres
  const real = postgres[act]
  const arrived = Promise.withResolvers<void>()
  const released = Promise.withResolvers<void>()
  let held = false
  t.mock.method(postgres, act, async (...input: Parameters<typeof real>) => {
    if (!held) {
      held = true
      arrived.resolve()
      await released.promise
    }
    return Reflect.apply(real, postgres, input)
  })
  return { arrived: arrived.promise, release: () => released.resolve() }
}

test('a cópia ligada nasce sem linha em copy_reader', async (t) => {
  const on = await copiesOn(t)
  await roleOn(on, 'Vendas', { sankhya: [...SANKHYA_READS] })
  const copyId = await on.enable('vendas')
  assert.deepEqual(await readersOf(on, copyId), [])
})

test('a proposta aceita nasce sem linha em copy_reader', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const made = await enableProposal(on, on.ana, await proposed(on))
  assert.equal(made.statusCode, 201, made.body)
  assert.deepEqual(await readersOf(on, Object(made.json()).copy.id), [])
})

test('a cópia nova recusa o papel com 42501 até a marca, e depois da marca o papel lê', async (t) => {
  const on = await copiesOn(t)
  const vendas = await roleOn(on, 'Vendas')
  const copyId = await on.enable('vendas')
  await ended(on, copyId)
  assert.deepEqual(await asRole(on, vendas.id, 'sankhya_vendas'), { refused: '42501' })
  await mark(on, copyId, vendas.id)
  await ended(on, copyId)
  assert.deepEqual(await asRole(on, vendas.id, 'sankhya_vendas'), { rows: 183 })
})

test('a tabela marcada para um papel não vai para outro', async (t) => {
  const on = await copiesOn(t)
  const [vendas, atendente] = [await roleOn(on, 'Vendas'), await roleOn(on, 'Atendente')]
  const copyId = await on.enable('vendas')
  await mark(on, copyId, vendas.id)
  await ended(on, copyId)
  assert.deepEqual(await asRole(on, vendas.id, 'sankhya_vendas'), { rows: 183 })
  assert.deepEqual(await asRole(on, atendente.id, 'sankhya_vendas'), { refused: '42501' })
})

test('apagar o papel apaga a marca e a rodada seguinte apaga o login', async (t) => {
  const on = await copiesOn(t)
  const vendas = await roleOn(on, 'Vendas')
  const copyId = await on.enable('vendas')
  await mark(on, copyId, vendas.id)
  await ended(on, copyId)
  const login = `conexus_role_${vendas.id}`
  assert.ok((await roleLoginsOf(on)).includes(login))
  const url = `/api/companies/${on.companyId}/roles/${vendas.role}`
  const gone = await call(on.hub, on.ana, 'DELETE', url)
  assert.ok(gone.statusCode < 300, gone.body)
  assert.deepEqual(await readersOf(on, copyId), [])
  await ended(on, copyId)
  assert.equal((await roleLoginsOf(on)).includes(login), false)
})

test('a reconciliação mais velha aplicada depois da mais nova não muda nada', async (t) => {
  const on = await copiesOn(t)
  const financeiro = await roleOn(on, 'Financeiro')
  const copyId = await on.enable('clientes')
  await mark(on, copyId, financeiro.id)
  const r1Apply = holdNext(t, on, 'reconcileReaders')
  const r1 = on.run(copyId)
  await r1Apply.arrived
  await unmark(on, copyId, financeiro.id)
  await ended(on, copyId)
  r1Apply.release()
  assert.equal((await r1).kind, 'ENDED')
  assert.equal(logged(on, 'COPY_READERS_SUPERSEDED').length, 1)
  assert.deepEqual(await asRole(on, financeiro.id, 'sankhya_clientes'), { refused: '42501' })
  await mark(on, copyId, financeiro.id)
  await ended(on, copyId)
  assert.deepEqual(await asRole(on, financeiro.id, 'sankhya_clientes'), { rows: 56 })
  const r3Ticket = holdNext(t, on, 'takeReadersTicket')
  const r3 = on.run(copyId)
  await r3Ticket.arrived
  await unmark(on, copyId, financeiro.id)
  const applications = t.mock.method(on.hub.postgres.companyPostgres, 'reconcileReaders')
  await ended(on, copyId)
  r3Ticket.release()
  assert.equal((await r3).kind, 'ENDED')
  const given = applications.mock.calls.map(
    (one) => one.arguments[2].find(({ roleId }) => roleId === financeiro.id)?.tables,
  )
  assert.deepEqual(given, [[], []], 'nenhuma aplicação depois de tirar devolve clientes')
  assert.deepEqual(await asRole(on, financeiro.id, 'sankhya_clientes'), { refused: '42501' })
})

test('o Hub mudou entre a leitura e a aplicação: uma segunda volta com bilhete novo', async (t) => {
  const on = await copiesOn(t)
  const vendas = await roleOn(on, 'Vendas')
  const copyId = await on.enable('vendas')
  await ended(on, copyId)
  const tickets = t.mock.method(on.hub.postgres.companyPostgres, 'takeReadersTicket')
  const apply = holdNext(t, on, 'reconcileReaders')
  const run = on.run(copyId)
  await apply.arrived
  await mark(on, copyId, vendas.id)
  apply.release()
  assert.equal((await run).kind, 'ENDED')
  assert.equal(tickets.mock.callCount(), 2)
  assert.deepEqual(await asRole(on, vendas.id, 'sankhya_vendas'), { rows: 183 })
})

test('a falha da reconciliação no fim da rodada só loga', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  const before = await ended(on, copyId)
  const postgres = on.hub.postgres.companyPostgres
  const silent = t.mock.method(postgres, 'reconcileReaders', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  assert.deepEqual(await ended(on, copyId), before)
  assert.deepEqual(logged(on, 'COPY_READERS_FAILED'), [
    { companyId: on.companyId, code: 'NO_ANSWER' },
  ])
  silent.mock.restore()
  t.mock.method(on.hub.neon.neon, 'ownerConnection', async () => ({ kind: 'NO_ANSWER' as const }))
  const down = await ended(on, copyId)
  assert.deepEqual(down.outcome, errorOf('COPY_DATABASE_UNAVAILABLE'))
  assert.deepEqual(logged(on, 'COPY_READERS_FAILED').at(-1), {
    companyId: on.companyId,
    reason: 'NO_OWNER',
  })
})

test('o nome longo demais diz COPY_READER_NAME', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await ended(on, copyId)
  const long = 'x'.repeat(51)
  await on.hub.test.asOwner(
    `insert into auth.organization_role (id, company_id, role, permission, label, created_at)
      values ($1, $2, 'longo', '{}', 'Longo', now())`,
    [long, on.companyId],
  )
  await assert.rejects(on.run(copyId), { code: 'INTERNAL_UNEXPECTED' })
  assert.deepEqual(logged(on, 'COPY_READER_NAME'), [{ companyId: on.companyId }])
  assert.equal((await roleLoginsOf(on)).includes(`conexus_role_${long}`), false)
})

test('dono e administrador leem por conexus_read e não ganham login de papel', async (t) => {
  const on = await copiesOn(t)
  const atendente = await roleOn(on, 'Atendente')
  const copyId = await on.enable('vendas')
  await ended(on, copyId)
  const rows = await on.hub.test.asOwner(
    'select id from auth.organization_role where company_id = $1 order by id',
    [on.companyId],
  )
  assert.equal(rows.length, 3, 'o desenvolvedor, o membro e o Atendente')
  assert.deepEqual(
    await roleLoginsOf(on),
    rows.map((row) => `conexus_role_${String(row.id)}`).sort(),
  )
  assert.deepEqual(await asRole(on, atendente.id, 'sankhya_vendas'), { refused: '42501' })
  const reader = new pg.Client({ connectionString: (await readLoginOf(on.owner, KEY)).reveal() })
  await reader.connect()
  try {
    assert.equal((await reader.query('select * from sync.sankhya_vendas')).rowCount, 183)
  } finally {
    await reader.end()
  }
})
