import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Two companies with a Projeto, its app, one version and one file each, written as the owner; each
// check reads through a scope with no filter of ours (decision 0039, B3 and B4), as for Projects.
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const OPERATOR = PersonId.parse('person-op')
const SHA_A = 'a'.repeat(64)
const SHA_B = 'b'.repeat(64)

function seedCompany(company: CompanyId, suffix: string, sha: string) {
  return `
  insert into projects.project(id, company_id, name, attempt_key, created_at) values
    ('project-${suffix}', '${company}', 'Pedidos', 'key-${suffix}', now());
  insert into apps.app(project_id, company_id) values ('project-${suffix}', '${company}');
  insert into apps.blob(company_id, sha256, bytes) values ('${company}', '${sha}', '\\x01');
  insert into apps.app_version(id, company_id, project_id, number, state, manifest, digest, sent_by,
    attempt_key, created_at) values ('version-${suffix}', '${company}', 'project-${suffix}', 1, 'ready',
    '{}', '${sha}', 'person-a', 'key-${suffix}', now());
  insert into apps.version_file(version_id, company_id, path, sha256, size, media_type) values
    ('version-${suffix}', '${company}', 'worker.js', '${sha}', 1, 'text/javascript');
  update apps.app set live_version_id = 'version-${suffix}' where project_id = 'project-${suffix}';`
}

const SEED = `
  insert into auth."user"(id, name, email, role) values
    ('person-a', 'Ana', 'ana@example.test', null), ('person-op', 'Operadora', 'op@example.test', 'admin');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  ${seedCompany(A, 'a', SHA_A)}
  ${seedCompany(B, 'b', SHA_B)}`

const IDS = sql`select
  (select coalesce(array_agg(project_id), '{}') from apps.app) as apps,
  (select coalesce(array_agg(id), '{}') from apps.app_version) as versions,
  (select coalesce(array_agg(version_id), '{}') from apps.version_file) as files,
  (select coalesce(array_agg(sha256), '{}') from apps.blob) as blobs`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('versões: sem filtro, a empresa lê só as suas e não grava app, versão, arquivo ou blob de outra', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inA(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }
  assert.deepEqual((await inA(IDS)).rows, [
    { apps: ['project-a'], versions: ['version-a'], files: ['version-a'], blobs: [SHA_A] },
  ])
  await assert.rejects(
    inA(
      sql`insert into apps.blob(company_id, sha256, bytes) values (${B}, ${'c'.repeat(64)}, '\\x01')`,
    ),
    refusedWith('42501'),
  )
  await assert.rejects(
    inA(sql`insert into apps.app_version(id, company_id, project_id, number, state, manifest,
      digest, sent_by, attempt_key, created_at) values ('planted', ${B}, 'project-b', 2, 'ready',
      '{}', ${SHA_B}, 'person-a', 'planted', now())`),
    refusedWith('42501'),
  )
  await assert.rejects(
    inA(sql`update apps.app_version set company_id = ${B} where id = 'version-a'`),
    refusedWith('42501'),
  )
  // A file of A that names B's bytes by their hash finds no blob of A: a blob is per company.
  await assert.rejects(
    inA(sql`insert into apps.version_file(version_id, company_id, path, sha256, size, media_type)
      values ('version-a', ${A}, 'roubado.js', ${SHA_B}, 1, 'text/javascript')`),
    refusedWith('23503'),
  )
  const same = await inA(sql`insert into apps.blob(company_id, sha256, bytes)
    values (${A}, ${SHA_B}, '\\x02') returning sha256`)
  assert.deepEqual(same.rows, [{ sha256: SHA_B }])
  await inA(sql`delete from apps.app`)
  await inA(sql`delete from apps.blob where sha256 = ${SHA_B}`)
  assert.deepEqual(await asOwner(`select id from apps.app_version order by id`), [
    { id: 'version-b' },
  ])
  assert.deepEqual(
    await asOwner(`select encode(bytes, 'hex') as b from apps.blob where company_id = '${B}'`),
    [{ b: '01' }],
  )
})

test('versões: a Central lê e apaga só as da empresa do escopo, e não grava', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function operating(personId: PersonId, statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'OPERATOR', personId, companyId: B }, (tx) =>
      tx.execute(statement),
    )
  }
  assert.deepEqual((await operating(ANA, IDS)).rows, [
    { apps: [], versions: [], files: [], blobs: [] },
  ])
  assert.deepEqual((await operating(OPERATOR, IDS)).rows, [
    { apps: ['project-b'], versions: ['version-b'], files: ['version-b'], blobs: [SHA_B] },
  ])
  await assert.rejects(
    operating(OPERATOR, sql`update apps.app set database_ready = true`),
    refusedWith('42501'),
  )
  await operating(OPERATOR, sql`delete from apps.app`)
  assert.deepEqual(await asOwner(`select project_id from apps.app`), [{ project_id: 'project-a' }])
})

test('versões: o login do Hub lista só as empresas com app, sem ler uma linha delas', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  const listed = await database.installation((tx) =>
    tx.execute(sql`select company_id from apps.companies_with_apps() order by 1`),
  )
  assert.deepEqual(listed.rows, [{ company_id: A }, { company_id: B }])
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select company_id from apps.app`)),
    refusedWith('42501'),
  )
})

test('um Projeto marcado para apagar não tem mais endereço', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(
    `update projects.project set host_label = 'pedidos--empresa-a' where id = 'project-a'`,
  )
  function lookup() {
    return database.installation((tx) =>
      tx.execute(sql`select project_id from projects.project_of_host('pedidos--empresa-a')`),
    )
  }
  assert.deepEqual((await lookup()).rows, [{ project_id: 'project-a' }])
  await database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
    tx.execute(sql`update projects.project set deleting_since = now() where id = 'project-a'`),
  )
  assert.deepEqual((await lookup()).rows, [])
})
