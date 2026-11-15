import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { test } from 'node:test'
import { appLogin, appLoginPassword, ProjectId } from '@conexus/hub-api'
import pg from 'pg'
import { testAppsConfig } from './test-cloudflare.ts'
import {
  createCompanyDatabase,
  readLoginOf,
  syncLoginOf,
  testCompanyPostgres,
  withPassword,
} from './test-company-postgres.ts'

const KEY = testAppsConfig().appLoginKey
const postgres = testCompanyPostgres(KEY)
const signal = new AbortController().signal

type CopyTable = Parameters<typeof postgres.ensureCopyTable>[1]
type DatabaseUrl = Awaited<ReturnType<typeof readLoginOf>>

function tableOf(name: string): CopyTable {
  return {
    name,
    definition: { columns: [{ name: 'id', type: 'text' }], key: ['id'], changedSince: null },
    accounts: false,
    instants: 'OFFSET',
  }
}

async function withClient<T>(url: DatabaseUrl, act: (client: pg.Client) => Promise<T>) {
  const client = new pg.Client({ connectionString: url.reveal() })
  await client.connect()
  try {
    return await act(client)
  } finally {
    await client.end()
  }
}

async function refusedAs(client: pg.Client, text: string) {
  try {
    await client.query(text)
  } catch (error) {
    if (error instanceof pg.DatabaseError) return error.code
    throw error
  }
  return undefined
}

async function readerOf(t: Parameters<typeof createCompanyDatabase>[0]) {
  const owner = await createCompanyDatabase(t)
  assert.equal((await postgres.ensureSync(owner)).kind, 'DONE')
  const sync = await syncLoginOf(owner, KEY)
  assert.equal((await postgres.ensureCopyTable(sync, tableOf('antes'))).kind, 'DONE')
  assert.equal((await postgres.ensureReader(owner)).kind, 'DONE')
  return { owner, sync, reader: await readLoginOf(owner, KEY) }
}

test('o login de leitura lê sync e só sync', async (t) => {
  const { owner, sync, reader } = await readerOf(t)
  const projectId = ProjectId.parse(randomBytes(16).toString('hex').replace(/^./, 'P'))
  assert.equal((await postgres.ensureApp(owner, projectId)).kind, 'DONE')
  const { schema, migrateLogin } = appLogin(projectId)
  await withClient(owner, async (client) => {
    await client.query('begin')
    await client.query(`set local role "${migrateLogin}"`)
    await client.query(`create table "${schema}".x (id text)`)
    await client.query('commit')
  })
  assert.equal((await postgres.ensureCopyTable(sync, tableOf('depois'))).kind, 'DONE')
  for (const name of ['antes', 'depois']) {
    const read = await postgres.readCopies(
      reader,
      [{ text: `select count(*) as n from sync.${name}` }],
      signal,
    )
    assert.equal(read.kind, 'ROWS', `lê a tabela feita ${name} do login`)
  }
  const catalog = await postgres.readCopies(
    reader,
    [{ text: 'select table_name from information_schema.tables' }],
    signal,
  )
  assert.equal(catalog.kind, 'ROWS')
  const outside = await postgres.readCopies(
    reader,
    [{ text: `select * from "${schema}".x` }],
    signal,
  )
  assert.deepEqual(outside, { kind: 'REFUSED', sqlstate: '42501' })
})

test('o login de leitura não escreve', async (t) => {
  const { reader } = await readerOf(t)
  await withClient(reader, async (client) => {
    assert.equal(await refusedAs(client, 'delete from sync.antes'), '25006')
    await client.query('begin transaction read write')
    assert.equal(await refusedAs(client, 'delete from sync.antes'), '42501')
  })
})

test('criar duas vezes não muda nada', async (t) => {
  const { owner, reader } = await readerOf(t)
  assert.equal((await postgres.ensureReader(owner)).kind, 'DONE')
  const read = await postgres.readCopies(reader, [{ text: 'select * from sync.antes' }], signal)
  assert.equal(read.kind, 'ROWS')
  const roles = await withClient(owner, (client) =>
    client.query('select 1 from pg_roles where rolname = $1', ['conexus_read']),
  )
  assert.equal(roles.rowCount, 1)
})

test('o endereço do login de leitura: o host da empresa, o login e a senha derivada', async () => {
  const url = new URL((await postgres.readerAddress('ep-teste.neon.tech')).reveal())
  assert.deepEqual(
    [url.protocol, url.username, url.host, url.pathname, url.search],
    ['postgresql:', 'conexus_read', 'ep-teste.neon.tech', '/neondb', '?sslmode=require'],
  )
  assert.equal(url.password, await appLoginPassword({ key: KEY.reveal(), login: 'conexus_read' }))
})

test('a senha errada é NO_LOGIN', async (t) => {
  const { reader } = await readerOf(t)
  const wrong = await postgres.readCopies(
    withPassword(reader, 'senha-errada'),
    [{ text: 'select 1' }],
    signal,
  )
  assert.deepEqual(wrong, { kind: 'NO_LOGIN' })
})

test('uma resposta maior que o teto é TOO_LARGE', async (t) => {
  const { reader } = await readerOf(t)
  const big = await postgres.readCopies(reader, [{ text: `select repeat('x', 2000000)` }], signal)
  assert.deepEqual(big, { kind: 'TOO_LARGE' })
})

test('a consulta que passa do prazo do login é TIMEOUT', async (t) => {
  const { reader } = await readerOf(t)
  const slow = await postgres.readCopies(reader, [{ text: 'select pg_sleep(6)' }], signal)
  assert.deepEqual(slow, { kind: 'TIMEOUT' })
})
