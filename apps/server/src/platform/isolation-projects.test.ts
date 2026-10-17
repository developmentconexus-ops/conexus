import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Two companies with a Project and a database each, and a member of A and an administrator, written
// as the owner; each check reads through a scope with no filter of ours (decision 0039, B3 and B4).
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const OPERATOR = PersonId.parse('person-op')

const SEED = `
  insert into auth."user"(id, name, email, role) values
    ('person-a', 'Ana', 'ana@example.test', null), ('person-op', 'Operadora', 'op@example.test', 'admin');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into projects.project(id, company_id, name, attempt_key, created_at) values
    ('project-a', '${A}', 'Pedidos', 'key-a', now()), ('project-b', '${B}', 'Pedidos', 'key-b', now());
  insert into projects.company_database(company_id, state, neon_project_id) values
    ('${A}', 'ready', 'neon-a'), ('${B}', 'ready', 'neon-b');`

const IDS = sql`select
  (select coalesce(array_agg(id), '{}') from projects.project) as projects,
  (select coalesce(array_agg(company_id), '{}') from projects.company_database) as databases`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('projetos: sem filtro, a empresa não lê nem grava Projeto ou banco de outra, e não muda deleting_since', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inA(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }
  assert.deepEqual((await inA(IDS)).rows, [{ projects: ['project-a'], databases: [A] }])
  await assert.rejects(
    inA(sql`insert into projects.project(id, company_id, name, attempt_key, created_at)
      values ('planted', ${B}, 'Outro', 'planted', now())`),
    refusedWith('42501'),
  )
  await assert.rejects(
    inA(sql`insert into projects.company_database(company_id, state, neon_project_id)
      values ('companyCCCCCCCCCCCCCCCCCCCCCCCCC', 'ready', 'neon-c')`),
    refusedWith('42501'),
  )
  await assert.rejects(inA(sql`update projects.project set name = 'Outro'`), refusedWith('42501'))
  await assert.rejects(inA(sql`delete from projects.company_database`), refusedWith('42501'))
  const marked = await inA(
    sql`update projects.company_database set state = 'ready' returning company_id`,
  )
  assert.deepEqual(marked.rows, [{ company_id: A }])
  const deleted = await inA(sql`delete from projects.project returning id`)
  assert.deepEqual(deleted.rows, [{ id: 'project-a' }])
  await assert.rejects(
    inA(sql`update auth.company set deleting_since = now()`),
    refusedWith('42501'),
  )
  assert.deepEqual(await asOwner(`select id from projects.project`), [{ id: 'project-b' }])
})

test('projetos: a Central lê e apaga só os do escopo, sem gravar, e só sendo administradora', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function operating(personId: PersonId, statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'OPERATOR', personId, companyId: B }, (tx) =>
      tx.execute(statement),
    )
  }
  assert.deepEqual((await operating(ANA, IDS)).rows, [{ projects: [], databases: [] }])
  assert.deepEqual((await operating(OPERATOR, IDS)).rows, [
    { projects: ['project-b'], databases: [B] },
  ])
  await assert.rejects(
    operating(OPERATOR, sql`update projects.company_database set state = 'creating'`),
    refusedWith('42501'),
  )
  await assert.rejects(
    operating(
      OPERATOR,
      sql`insert into projects.project(id, company_id, name, attempt_key, created_at)
        values ('planted', ${B}, 'Outro', 'planted', now())`,
    ),
    refusedWith('42501'),
  )
  await operating(OPERATOR, sql`delete from projects.project`)
  await operating(OPERATOR, sql`delete from projects.company_database`)
  assert.deepEqual(await asOwner(`select id from projects.project`), [{ id: 'project-a' }])
  assert.deepEqual(await asOwner(`select company_id from projects.company_database`), [
    { company_id: A },
  ])
})
