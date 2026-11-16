import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ProjectId, RoleId } from '@conexus/hub-api'
import pg from 'pg'
import { testAppsConfig } from './test-cloudflare.ts'
import {
  countingTransport,
  createCompanyDatabase,
  readLoginOf,
  roleLoginOf,
  syncLoginOf,
  testCompanyPostgres,
} from './test-company-postgres.ts'

const KEY = testAppsConfig().appLoginKey
const postgres = testCompanyPostgres(KEY)

type DatabaseUrl = Awaited<ReturnType<typeof createCompanyDatabase>>
type CopyTable = Parameters<typeof postgres.ensureCopyTable>[1]
type Wanted = Parameters<typeof postgres.reconcileReaders>[2]

/** A role's id as the library makes it, with a capital letter so the login keeps the case. */
function loginOf(roleId: RoleId) {
  return `conexus_role_${roleId}`
}

function libraryRole() {
  return RoleId.parse(randomBytes(16).toString('hex').replace(/^./, 'R'))
}

function seededRole() {
  return RoleId.parse(randomUUID())
}

const ONE_COLUMN = {
  columns: [{ name: 'id', type: 'text' }],
  key: ['id'],
  changedSince: null,
} as const

function tableOf(name: string): CopyTable {
  return { name, definition: ONE_COLUMN, accounts: false, instants: 'OFFSET' }
}

async function asUrl(url: DatabaseUrl, ...texts: string[]) {
  const client = new pg.Client({ connectionString: url.reveal() })
  await client.connect()
  const answers: (unknown[] | { refused: string })[] = []
  try {
    for (const text of texts) {
      try {
        answers.push((await client.query(text)).rows)
      } catch (error) {
        if (!(error instanceof pg.DatabaseError) || error.code === undefined) throw error
        answers.push({ refused: error.code })
      }
    }
    return answers
  } finally {
    await client.end()
  }
}

async function asRole(owner: DatabaseUrl, roleId: RoleId, ...texts: string[]) {
  return asUrl(await roleLoginOf(owner, KEY, roleId), ...texts)
}

function reads(owner: DatabaseUrl, roleId: RoleId, ...names: string[]) {
  return asRole(owner, roleId, ...names.map((name) => `select * from sync.${name}`))
}

async function asSync(owner: DatabaseUrl, text: string) {
  const [answer] = await asUrl(await syncLoginOf(owner, KEY), text)
  return answer
}

async function companyOf(t: TestContext, tables: readonly string[] = ['a', 'b', 'c']) {
  const owner = await createCompanyDatabase(t)
  assert.equal((await postgres.ensureSync(owner)).kind, 'DONE')
  const sync = await syncLoginOf(owner, KEY)
  for (const name of tables) {
    assert.equal((await postgres.ensureCopyTable(sync, tableOf(name))).kind, 'DONE')
  }
  assert.equal((await postgres.ensureReader(owner)).kind, 'DONE')
  return { owner, sync }
}

async function ticketOf(owner: DatabaseUrl): Promise<bigint> {
  const taken = await postgres.takeReadersTicket(owner)
  assert.equal(taken.kind, 'DONE', JSON.stringify(taken))
  return taken.kind === 'DONE' ? BigInt(String(taken.value.at(-1)?.[0]?.ticket)) : 0n
}

async function applied(owner: DatabaseUrl, wanted: Wanted) {
  const done = await postgres.reconcileReaders(owner, await ticketOf(owner), wanted)
  assert.equal(done.kind, 'DONE', JSON.stringify(done))
}

async function grantsOf(owner: DatabaseUrl) {
  const [tables, logins] = await asUrl(
    owner,
    `select c.relname, r.rolname from pg_class c, aclexplode(c.relacl) a
       join pg_roles r on r.oid = a.grantee
      where c.relnamespace = 'sync'::regnamespace and r.rolname like 'conexus\\_role\\_%'
        and a.privilege_type = 'SELECT' order by 1, 2`,
    `select rolname, rolconfig from pg_roles where rolname like 'conexus\\_role\\_%'
        and has_schema_privilege(oid, 'sync', 'USAGE') order by 1`,
  )
  return { tables: Array.isArray(tables) ? tables : [], logins }
}

function ledgerOf(owner: DatabaseUrl) {
  return asSync(owner, 'select single, ticket from sync._readers_applied')
}

async function loginExists(owner: DatabaseUrl, login: string) {
  const [rows] = await asUrl(owner, `select 1 from pg_roles where rolname = '${login}'`)
  return Array.isArray(rows) && rows.length === 1
}

const REFUSED = { refused: '42501' }

test('cada login de papel lê as suas tabelas e é recusado nas outras com 42501', async (t) => {
  const { owner } = await companyOf(t)
  const [vendas, financeiro] = [libraryRole(), seededRole()]
  await applied(owner, [
    { roleId: vendas, tables: ['a', 'b'] },
    { roleId: financeiro, tables: ['c'] },
  ])
  assert.deepEqual(await reads(owner, vendas, 'a', 'b', 'c'), [[], [], REFUSED])
  assert.deepEqual(await reads(owner, financeiro, 'a', 'b', 'c'), [REFUSED, REFUSED, []])
})

test('reconciliar duas vezes deixa o banco igual', async (t) => {
  const { owner } = await companyOf(t)
  const wanted = [
    { roleId: libraryRole(), tables: ['a', 'b'] },
    { roleId: seededRole(), tables: ['c'] },
  ]
  await applied(owner, wanted)
  const first = await grantsOf(owner)
  assert.equal(first.tables.length, 3)
  await applied(owner, wanted)
  assert.deepEqual(await grantsOf(owner), first)
})

test('tirar uma tabela do conjunto recusa a leitura seguinte', async (t) => {
  const { owner } = await companyOf(t)
  const vendas = libraryRole()
  await applied(owner, [{ roleId: vendas, tables: ['a', 'b'] }])
  await applied(owner, [{ roleId: vendas, tables: ['a'] }])
  assert.deepEqual(await reads(owner, vendas, 'a', 'b'), [[], REFUSED])
})

test('um login de papel fora da lista perde tudo e é apagado', async (t) => {
  const { owner } = await companyOf(t)
  const [vendas, saindo] = [libraryRole(), libraryRole()]
  await applied(owner, [
    { roleId: vendas, tables: ['a'] },
    { roleId: saindo, tables: ['b'] },
  ])
  assert.ok(await loginExists(owner, loginOf(saindo)))
  await applied(owner, [{ roleId: vendas, tables: ['a'] }])
  assert.equal(await loginExists(owner, loginOf(saindo)), false)
  assert.deepEqual(await reads(owner, vendas, 'a'), [[]])
})

test('o login de outra empresa no mesmo servidor fica', async (t) => {
  const [one, other] = [await companyOf(t), await companyOf(t)]
  const [vendas, deOutra] = [libraryRole(), libraryRole()]
  await applied(other.owner, [{ roleId: deOutra, tables: ['a'] }])
  await applied(one.owner, [{ roleId: vendas, tables: ['a'] }])
  assert.ok(await loginExists(one.owner, loginOf(deOutra)))
  assert.deepEqual(await reads(other.owner, deOutra, 'a'), [[]])
})

test('o login de um papel não troca de papel, não escreve e não lê a tabela de outro papel', async (t) => {
  const { owner } = await companyOf(t)
  const [vendas, financeiro] = [libraryRole(), libraryRole()]
  await applied(owner, [
    { roleId: vendas, tables: ['a'] },
    { roleId: financeiro, tables: ['b'] },
  ])
  const attacks = await asRole(
    owner,
    vendas,
    'SET ROLE conexus_sync',
    `select set_config('role', 'conexus_sync', true), query_to_xml('select * from sync.b', true, false, '')`,
    `insert into sync.a (id) values ('x')`,
    'select * from sync.b',
  )
  assert.deepEqual(attacks, [REFUSED, REFUSED, { refused: '25006' }, REFUSED])
})

test('o information_schema do login lista só as tabelas dele', async (t) => {
  const { owner } = await companyOf(t)
  const vendas = libraryRole()
  await applied(owner, [{ roleId: vendas, tables: ['a', 'c'] }])
  const sql = `select table_name from information_schema.tables where table_schema = 'sync' order by 1`
  const [listed] = await asRole(owner, vendas, sql)
  assert.deepEqual(listed, [{ table_name: 'a' }, { table_name: 'c' }])
})

test('o id da biblioteca e o uuid cabem; um id que passa de 63 bytes falha sem login', async () => {
  const library = libraryRole()
  for (const roleId of [library, seededRole()]) {
    const given = new URL((await postgres.roleAddress('ep-teste.neon.tech', roleId)).reveal())
    assert.equal(given.username, loginOf(roleId))
  }
  const long = RoleId.parse('x'.repeat(63 - 'conexus_role_'.length + 1))
  const failure = { code: 'INTERNAL_UNEXPECTED', details: { reason: 'COPY_READER_NAME' } }
  await assert.rejects(postgres.roleAddress('ep-teste.neon.tech', long), failure)
  let calls = 0
  const counted = testCompanyPostgres(
    KEY,
    countingTransport(() => calls++),
  )
  const nowhere = await postgres.roleAddress('ep-teste.neon.tech', library)
  await assert.rejects(
    counted.reconcileReaders(nowhere, 1n, [{ roleId: long, tables: ['a'] }]),
    failure,
  )
  assert.equal(calls, 0, 'nenhuma instrução chega ao banco')
})

test('roleAddress entra como o login do papel', async (t) => {
  const { owner } = await companyOf(t)
  const vendas = libraryRole()
  await applied(owner, [{ roleId: vendas, tables: [] }])
  const given = new URL((await postgres.roleAddress('ep-teste.neon.tech', vendas)).reveal())
  assert.equal(given.host, 'ep-teste.neon.tech')
  // The test server is not that host: the same login and password are the ones that sign in at the owner's.
  const local = await roleLoginOf(owner, KEY, vendas)
  const signed = new URL(local.reveal())
  assert.deepEqual([given.username, given.password], [signed.username, signed.password])
  const [rows] = await asUrl(local, 'select current_user')
  assert.deepEqual(rows, [{ current_user: `conexus_role_${vendas}` }])
})

test('a reconciliação mais velha aplicada depois da mais nova não muda nada', async (t) => {
  const { owner } = await companyOf(t)
  const vendas = libraryRole()
  const [older, newer] = [await ticketOf(owner), await ticketOf(owner)]
  const applied = await postgres.reconcileReaders(owner, newer, [{ roleId: vendas, tables: ['a'] }])
  assert.equal(applied.kind, 'DONE')
  const after = { grants: await grantsOf(owner), ledger: await ledgerOf(owner) }
  assert.deepEqual(after.ledger, [{ single: true, ticket: newer.toString() }])
  const late = await postgres.reconcileReaders(owner, older, [{ roleId: vendas, tables: ['b'] }])
  assert.deepEqual(late, { kind: 'SUPERSEDED' })
  assert.deepEqual({ grants: await grantsOf(owner), ledger: await ledgerOf(owner) }, after)
})

test('o mesmo bilhete duas vezes também é abandonado', async (t) => {
  const { owner } = await companyOf(t)
  const vendas = libraryRole()
  const ticket = await ticketOf(owner)
  const first = await postgres.reconcileReaders(owner, ticket, [{ roleId: vendas, tables: ['a'] }])
  assert.equal(first.kind, 'DONE')
  const after = await grantsOf(owner)
  const again = await postgres.reconcileReaders(owner, ticket, [{ roleId: vendas, tables: ['b'] }])
  assert.deepEqual(again, { kind: 'SUPERSEDED' })
  assert.deepEqual(await grantsOf(owner), after)
})

const LEDGER_PROBES = [
  `select table_name from information_schema.tables where table_name = '_readers_applied'`,
  'select * from sync._readers_applied',
  `select nextval('sync.readers_ticket')`,
]

async function assertLedgerHidden(url: DatabaseUrl, who: string) {
  assert.deepEqual(await asUrl(url, ...LEDGER_PROBES), [[], REFUSED, REFUSED], who)
}

test('o livro não aparece para nenhum login de leitura', async (t) => {
  const { owner } = await companyOf(t)
  const vendas = libraryRole()
  await applied(owner, [{ roleId: vendas, tables: ['a'] }])
  const reader = await readLoginOf(owner, KEY)
  await assertLedgerHidden(reader, 'conexus_read')
  await assertLedgerHidden(await roleLoginOf(owner, KEY, vendas), 'o login do papel')
  assert.equal((await postgres.ensureReader(owner)).kind, 'DONE')
  await assertLedgerHidden(reader, 'conexus_read, com ensureReader rodado depois do livro')
  assert.deepEqual(await asSync(owner, 'drop table sync._readers_applied'), [])
  assert.equal((await postgres.ensureSync(owner)).kind, 'DONE')
  await assertLedgerHidden(reader, 'conexus_read, com o livro feito depois dele')
})

test('ensureSync duas vezes cria o livro uma vez', async (t) => {
  const { owner } = await companyOf(t, [])
  assert.equal((await postgres.ensureSync(owner)).kind, 'DONE')
  assert.deepEqual(await ledgerOf(owner), [{ single: true, ticket: '0' }])
  const sql = `select relname, relkind from pg_class where relnamespace = 'sync'::regnamespace order by 1`
  assert.deepEqual(await asSync(owner, sql), [
    { relname: '_readers_applied', relkind: 'r' },
    { relname: '_readers_applied_pkey', relkind: 'i' },
    { relname: 'readers_ticket', relkind: 'S' },
  ])
})

test('duas reconciliações e um grantCopy ao mesmo tempo terminam sem erro', async (t) => {
  const { owner, sync } = await companyOf(t)
  const projectId = ProjectId.parse(randomBytes(16).toString('hex').replace(/^./, 'P'))
  assert.equal((await postgres.ensureApp(owner, projectId)).kind, 'DONE')
  for (let lap = 0; lap < 20; lap++) {
    const vendas = libraryRole()
    const a = [{ roleId: vendas, tables: ['a'] }]
    const b = [{ roleId: vendas, tables: ['a', 'b'] }]
    const [t1, t2] = [await ticketOf(owner), await ticketOf(owner)]
    // The release repeats while both applications run, so one of its GRANTs meets theirs on `a`.
    const [first, second, granted] = await Promise.all([
      postgres.reconcileReaders(owner, t1, a),
      postgres.reconcileReaders(owner, t2, b),
      Array.fromAsync({ length: 5 }, () => postgres.grantCopy(sync, { name: 'a', projectId })),
    ])
    assert.ok(
      second.kind === 'DONE' &&
        ['DONE', 'SUPERSEDED'].includes(first.kind) &&
        granted.every((answer) => answer.kind === 'DONE'),
      `volta ${lap}: ${JSON.stringify([first, second, granted])}`,
    )
    const login = loginOf(vendas)
    const held = (await grantsOf(owner)).tables.filter((row) => JSON.stringify(row).includes(login))
    assert.deepEqual(held, [
      { relname: 'a', rolname: login },
      { relname: 'b', rolname: login },
    ])
  }
})

test('a tabela pedida que ainda não existe fica de fora sem erro', async (t) => {
  const { owner, sync } = await companyOf(t)
  const vendas = libraryRole()
  const wanted = [{ roleId: vendas, tables: ['a', 'ainda'] }]
  await applied(owner, wanted)
  assert.deepEqual(await reads(owner, vendas, 'a'), [[]])
  assert.equal((await postgres.ensureCopyTable(sync, tableOf('ainda'))).kind, 'DONE')
  await applied(owner, wanted)
  assert.deepEqual(await reads(owner, vendas, 'ainda'), [[]])
})
