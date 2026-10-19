import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { appLogin, appLoginPassword, ProjectId } from '@conexus/hub-api'
import { neonConfig } from '@neondatabase/serverless'
import pg from 'pg'
import { createCompanyPostgres, neonTransport } from './company-postgres.ts'
import { testAppsConfig } from './test-cloudflare.ts'
import {
  appLoginTimeoutsOf,
  appTablesOf,
  createCompanyDatabase,
  pgTransport,
} from './test-company-postgres.ts'
import { unreachableDatabaseUrl } from './test-database.ts'

const KEY = testAppsConfig().appLoginKey
const MIGRATION = {
  id: '001_recado',
  statements: [
    'CREATE TABLE recado (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, texto text NOT NULL)',
  ],
}
type Owner = Awaited<ReturnType<typeof createCompanyDatabase>>
const postgres = createCompanyPostgres({ transport: pgTransport, appLoginKey: KEY })

function projectId(): ProjectId {
  return ProjectId.parse(randomBytes(16).toString('hex').replace(/^./, 'P'))
}

/** Runs one statement as one of the app's logins, with the password derived from the key. */
async function asLogin(owner: Owner, login: string, text: string) {
  const url = new URL(owner.reveal())
  url.username = login
  url.password = await appLoginPassword({ key: KEY.reveal(), login })
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  try {
    return (await client.query(text)).rows
  } catch (error) {
    return { refused: error instanceof pg.DatabaseError ? error.code : 'unknown' }
  } finally {
    await client.end()
  }
}

test('banco do app: logins por SQL, nenhum superusuário; repetido após corte acha tudo e não migra duas vezes', async (t) => {
  const owner = await createCompanyDatabase(t)
  const id = projectId()
  const { runLogin, migrateLogin } = appLogin(id)
  // A cut after the first login: the next run finds it and makes the rest.
  const cut = await appLoginPassword({ key: KEY.reveal(), login: migrateLogin })
  await pgTransport(
    owner,
    [{ text: `CREATE ROLE "${migrateLogin}" LOGIN PASSWORD '${cut}'` }],
    AbortSignal.timeout(5_000),
  )
  assert.equal((await postgres.ensureApp(owner, id)).kind, 'DONE')
  assert.equal((await postgres.ensureApp(owner, id)).kind, 'DONE')
  const roles = await asLogin(
    owner,
    runLogin,
    `select rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls from pg_roles
      where rolname in ('${runLogin}', '${migrateLogin}') order by rolname`,
  )
  assert.deepEqual(roles, [
    {
      rolname: migrateLogin,
      rolsuper: false,
      rolcreaterole: false,
      rolcreatedb: false,
      rolbypassrls: false,
    },
    {
      rolname: runLogin,
      rolsuper: false,
      rolcreaterole: false,
      rolcreatedb: false,
      rolbypassrls: false,
    },
  ])
  assert.deepEqual(await appLoginTimeoutsOf(owner, id), {
    run: ['statement_timeout=5000', 'transaction_timeout=6000'],
    migrate: [],
  })
  const migrations = [MIGRATION]
  assert.deepEqual(await postgres.migrate(owner, id, migrations), { kind: 'DONE', applied: 1 })
  assert.deepEqual(await postgres.migrate(owner, id, migrations), { kind: 'DONE', applied: 0 })
  assert.deepEqual(
    await asLogin(owner, runLogin, "insert into recado (texto) values ('oi') returning id"),
    [{ id: '1' }],
  )
  assert.deepEqual(await asLogin(owner, runLogin, 'select id from conexus_migration'), {
    refused: '42501',
  })
  const changed = [{ ...MIGRATION, statements: ['CREATE TABLE recado (texto text)'] }]
  assert.deepEqual(await postgres.migrate(owner, id, changed), {
    kind: 'CHANGED',
    id: MIGRATION.id,
  })
  const broken = [
    MIGRATION,
    { id: '002_extra', statements: ['CREATE TABLE extra (v text)'] },
    { id: '003_quebrada', statements: ['INSERT INTO nada VALUES (1)'] },
  ]
  assert.deepEqual(await postgres.migrate(owner, id, broken), { kind: 'REFUSED', code: '42P01' })
  assert.deepEqual(await appTablesOf(owner, id), {
    tables: ['conexus_migration', 'recado'],
    ledger: [MIGRATION.id],
  })
  // Voltar to a version without a later migration: the repair finds nothing to do, not a change.
  const later = [MIGRATION, { id: '002_extra', statements: ['CREATE TABLE extra (v text)'] }]
  assert.deepEqual(await postgres.migrate(owner, id, later), { kind: 'DONE', applied: 1 })
  assert.deepEqual(await postgres.migrate(owner, id, migrations), { kind: 'DONE', applied: 0 })
})

test('banco do app: o login de execução corta uma instrução de 6 s com 57014; o de migração não tem prazo', async (t) => {
  const owner = await createCompanyDatabase(t)
  const id = projectId()
  assert.equal((await postgres.ensureApp(owner, id)).kind, 'DONE')
  const { runLogin, migrateLogin } = appLogin(id)
  assert.deepEqual(await asLogin(owner, runLogin, 'select pg_sleep(6)'), { refused: '57014' })
  assert.deepEqual(await asLogin(owner, migrateLogin, 'show statement_timeout'), [
    { statement_timeout: '0' },
  ])
})

test('banco do app: os logins de um app não leem nem gravam no esquema de outro', async (t) => {
  const owner = await createCompanyDatabase(t)
  const [one, two] = [projectId(), projectId()]
  for (const id of [one, two]) {
    assert.equal((await postgres.ensureApp(owner, id)).kind, 'DONE')
    assert.deepEqual(await postgres.migrate(owner, id, [MIGRATION]), { kind: 'DONE', applied: 1 })
  }
  const other = `"${appLogin(two).schema}".recado`
  for (const login of [appLogin(one).runLogin, appLogin(one).migrateLogin]) {
    for (const text of [
      `select * from ${other}`,
      `insert into ${other} (texto) values ('ataque')`,
      `create table "${appLogin(two).schema}".plantada (v text)`,
      `set role "${appLogin(two).runLogin}"`,
    ]) {
      assert.deepEqual(await asLogin(owner, login, text), { refused: '42501' }, `${login}: ${text}`)
    }
  }
  assert.deepEqual((await postgres.dropApp(owner, one)).kind, 'DONE')
  assert.deepEqual((await postgres.dropApp(owner, one)).kind, 'DONE')
  assert.deepEqual(await appTablesOf(owner, one), { tables: [], ledger: [] })
  assert.deepEqual((await appTablesOf(owner, two)).tables, ['conexus_migration', 'recado'])
})

// Neon's HTTP proxy at its door (T14): the program's transport reads a reply only up to its cap.

async function proxyAt(t: TestContext, answer: (response: ServerResponse) => void) {
  const server = createServer((request, response) => {
    request.resume()
    request.on('end', () => answer(response))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  neonConfig.fetchEndpoint = `http://127.0.0.1:${address.port}/sql`
}

const ONE_ROW = {
  results: [
    {
      command: 'SELECT',
      rowCount: 1,
      fields: [{ name: 'n', dataTypeID: 25 }],
      rows: [['um']],
      rowAsArray: true,
    },
  ],
}

test('transporte do Neon: a resposta sem tamanho declarado que passa de 1 MiB é silêncio; a pequena chega', async (t) => {
  let big = false
  await proxyAt(t, (response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    if (!big) return response.end(JSON.stringify(ONE_ROW))
    const row = JSON.stringify({ ...ONE_ROW.results[0], rows: [['x'.repeat(64 * 1024)]] })
    response.write('{"results":[')
    for (let i = 0; i < 40; i++) response.write(`${i === 0 ? '' : ','}${row}`)
    response.end(']}')
  })
  const owner = await unreachableDatabaseUrl()
  const statements = [{ text: 'SELECT 1' }]
  const signal = AbortSignal.timeout(10_000)
  assert.deepEqual(await neonTransport(owner, statements, signal), {
    kind: 'DONE',
    value: [[{ n: 'um' }]],
  })
  big = true
  assert.deepEqual(await neonTransport(owner, statements, signal), { kind: 'NO_ANSWER' })
})
