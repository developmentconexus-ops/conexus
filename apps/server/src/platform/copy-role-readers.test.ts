import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RoleId } from '@conexus/hub-api'
import {
  countingTransport,
  readLoginOf,
  roleLoginOf,
  testCompanyPostgres,
} from './test-company-postgres.ts'
import type { DatabaseUrl } from './test-role-readers.ts'
import {
  applied,
  asRole,
  asSync,
  asUrl,
  companyOf,
  grantsOf,
  KEY,
  ledgerOf,
  libraryRole,
  loginExists,
  loginOf,
  postgres,
  REFUSED,
  reads,
  seededRole,
  tableOf,
  ticketOf,
} from './test-role-readers.ts'

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

test('a tabela pedida que ainda não existe fica de fora sem erro', async (t) => {
  const { owner, sync } = await companyOf(t)
  const vendas = libraryRole()
  const wanted = [{ roleId: vendas, tables: ['a', 'ainda'] }]
  assert.deepEqual(await asUrl(owner, 'create table public.ainda (id text)'), [[]])
  await applied(owner, wanted)
  assert.deepEqual(await reads(owner, vendas, 'a'), [[]])
  assert.equal((await postgres.ensureCopyTable(sync, tableOf('ainda'))).kind, 'DONE')
  await applied(owner, wanted)
  assert.deepEqual(await reads(owner, vendas, 'ainda'), [[]])
})
