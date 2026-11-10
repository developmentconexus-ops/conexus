import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appLogin, appLoginPassword, PersonId, ProjectId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import pg from 'pg'
import { folder, readyForVersions, send } from '../apps/test-versions.ts'
import { call, post } from '../identity/test-hub.ts'
import type { CopiesOn } from './test-copies.ts'

type DatabaseUrl = CopiesOn['owner']

import { copiesOn, TEST_APP_LOGIN_KEY } from './test-copies.ts'

/** One statement as one of the app's logins, as the edge reaches it: the rows' count, or the SQLSTATE that refused it. */
async function asApp(owner: DatabaseUrl, login: string, text: string) {
  const url = new URL(owner.reveal())
  url.username = login
  url.password = await appLoginPassword({ key: TEST_APP_LOGIN_KEY, login })
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

async function releasesOf(on: CopiesOn) {
  const result = await on.hub.test.database.read(
    { kind: 'COMPANY', companyId: on.companyId, personId: null },
    (tx) => tx.execute(sql`select project_id, copy_id from copies.project_copy`),
  )
  return result.rows.length
}

/** The app's logins with their oids: a login made again has another. */
async function loginsOf(owner: DatabaseUrl, projectId: ProjectId) {
  const { runLogin, readLogin, migrateLogin } = appLogin(projectId)
  const client = new pg.Client({ connectionString: owner.reveal() })
  await client.connect()
  try {
    const found = await client.query(
      'select rolname, oid::text from pg_roles where rolname = any($1) order by 1',
      [[runLogin, readLogin, migrateLogin]],
    )
    return found.rows.map((row) => `${row.rolname} ${row.oid}`)
  } finally {
    await client.end()
  }
}

function release(on: CopiesOn, copyId: Parameters<CopiesOn['run']>[0]) {
  return { companyId: on.companyId, personId: on.anaId, projectId: on.projectId, copyId }
}

async function refusedWith(code: string, act: () => Promise<unknown>) {
  await assert.rejects(act, (error: unknown) => Object(error).code === code)
}

test('liberar e tirar', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  const { runLogin, readLogin } = appLogin(on.projectId)
  await on.copies.grant(release(on, copyId))
  assert.equal(await releasesOf(on), 1)
  assert.equal((await asApp(on.owner, readLogin, 'select * from sync.vendas')).rows, 183)
  assert.equal((await asApp(on.owner, runLogin, 'select * from sync.vendas')).rows, 183)
  assert.deepEqual(
    await asApp(on.owner, runLogin, 'delete from sync.vendas'),
    { refused: '42501' },
    'o login de execução não escreve na cópia',
  )
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_GRANTED'))
  await on.copies.grant(release(on, copyId))
  assert.equal(await releasesOf(on), 1, 'liberar de novo não muda nada')

  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'revokeCopy', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  await refusedWith('COPY_DATABASE_UNAVAILABLE', () => on.copies.revoke(release(on, copyId)))
  assert.equal(await releasesOf(on), 1, 'o REVOKE vem antes de apagar a linha')
  silent.mock.restore()
  await on.copies.revoke(release(on, copyId))
  assert.equal(await releasesOf(on), 0)
  assert.deepEqual(await asApp(on.owner, readLogin, 'select * from sync.vendas'), {
    refused: '42501',
  })
  await refusedWith('NOT_FOUND', () =>
    on.copies.grant({ ...release(on, copyId), personId: PersonId.parse(on.carla.id) }),
  )
})

async function listedGrants(on: CopiesOn) {
  const response = await call(on.hub, on.ana, 'GET', `${on.projects}/${on.projectId}/copies`)
  assert.equal(response.statusCode, 200, response.body)
  return Object(response.json()).copies.map((one: { copy: { name: string }; granted: boolean }) => [
    one.copy.name,
    one.granted,
  ])
}

test('liberar: o GRANT que falha desfaz a linha, e a lista diz não liberada', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'grantCopy', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  const put = await call(on.hub, on.ana, 'PUT', `${on.projects}/${on.projectId}/copies/${copyId}`)
  assert.deepEqual([put.statusCode, Object(put.json()).code], [503, 'COPY_DATABASE_UNAVAILABLE'])
  assert.equal(await releasesOf(on), 0, 'a linha que este ato fez foi desfeita')
  assert.deepEqual(await listedGrants(on), [['vendas', false]])
  silent.mock.restore()
  await on.copies.grant(release(on, copyId))
  assert.deepEqual(await listedGrants(on), [['vendas', true]])
  t.mock.method(on.hub.postgres.companyPostgres, 'grantCopy', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  await refusedWith('COPY_DATABASE_UNAVAILABLE', () => on.copies.grant(release(on, copyId)))
  assert.deepEqual(await listedGrants(on), [['vendas', true]], 'a liberação de antes fica')
})

/** As the Hub's owner: the release's row can no longer be deleted, as when the Hub's database falls between the two acts. */
async function refuseDeletes(on: CopiesOn) {
  const client = new pg.Client({ connectionString: on.hub.test.ownerUrl.reveal() })
  await client.connect()
  try {
    await client.query(
      "create function copies.refuse_delete() returns trigger language plpgsql as $$ begin raise exception 'refused'; end $$",
    )
    await client.query(
      'create trigger refuse_delete before delete on copies.project_copy for each row execute function copies.refuse_delete()',
    )
  } finally {
    await client.end()
  }
}

test('liberar: o apagar que também falha registra e responde o mesmo 503', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  await refuseDeletes(on)
  t.mock.method(on.hub.postgres.companyPostgres, 'grantCopy', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  await refusedWith('COPY_DATABASE_UNAVAILABLE', () => on.copies.grant(release(on, copyId)))
  assert.equal(await releasesOf(on), 1, 'a linha fica para a reparação')
  const lines = on.hub.lines.map(({ message }) => message)
  assert.ok(lines.includes('COPY_GRANT_FAILED'), 'o GRANT que falhou')
  assert.ok(lines.includes('COPY_RELEASE_UNDO_FAILED'), 'o apagar que falhou')
})

test('liberar a um Projeto sem app', async (t) => {
  const on = await copiesOn(t)
  await readyForVersions(t, on.hub, on.ana, on.companyId)
  const copyId = await on.enable('clientes')
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  assert.deepEqual(await loginsOf(on.owner, on.projectId), [], 'o Projeto ainda não tem app')
  on.hub.neon.script('ownerConnection', 'NO_ANSWER')
  await refusedWith('COPY_DATABASE_UNAVAILABLE', () => on.copies.grant(release(on, copyId)))
  assert.equal(await releasesOf(on), 0, 'a linha desfeita: a lista não diz liberada')
  await on.copies.grant(release(on, copyId))
  assert.equal(await releasesOf(on), 1)
  const made = await loginsOf(on.owner, on.projectId)
  assert.equal(made.length, 3, 'o esquema e os logins pelo dono de hoje')
  const { readLogin } = appLogin(on.projectId)
  const read = await asApp(on.owner, readLogin, 'select * from sync.clientes')
  assert.ok((read.rows ?? 0) > 0, 'o login de leitura do Projeto lê a cópia')

  const subject = { t, hub: on.hub, projects: on.projects, projectId: on.projectId }
  const sent = await send(subject, on.ana, folder())
  assert.equal(sent.preview?.state, 'ready', 'o primeiro envio acha os logins')
  assert.deepEqual(await loginsOf(on.owner, on.projectId), made, 'e não os recria')
  assert.deepEqual(await asApp(on.owner, readLogin, 'select * from sync.clientes'), read)
})

test('apagar o Projeto com a cópia liberada', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  const made = await post(on.hub, on.ana, on.projects, { name: 'Estoque' })
  assert.equal(made.statusCode, 201, made.body)
  const other = ProjectId.parse(Object(made.json()).project.id)
  await on.copies.grant(release(on, copyId))
  await on.copies.grant({ ...release(on, copyId), projectId: other })
  assert.equal(await releasesOf(on), 2)
  assert.equal((await loginsOf(on.owner, on.projectId)).length, 3)

  const removed = await call(on.hub, on.ana, 'DELETE', `${on.projects}/${on.projectId}`, {
    name: 'Pedidos',
  })
  assert.equal(removed.statusCode, 204, removed.body)
  const gone = await call(on.hub, on.ana, 'GET', `${on.projects}/${on.projectId}`)
  assert.equal(gone.statusCode, 404, 'o Projeto saiu')
  assert.deepEqual(await loginsOf(on.owner, on.projectId), [], 'os logins do app saíram')
  assert.equal(await releasesOf(on), 1, 'a liberação saiu')
  const kept = await on.hub.test.database.read(
    { kind: 'COMPANY', companyId: on.companyId, personId: null },
    (tx) => tx.execute(sql`select project_id from copies.project_copy`),
  )
  assert.equal(Object(kept.rows[0]).project_id, other)
  const { readLogin } = appLogin(other)
  assert.equal(
    (await asApp(on.owner, readLogin, 'select * from sync.vendas')).rows,
    183,
    'a cópia continua para o outro Projeto',
  )
})
