import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Two companies with a Projeto each; every check reads through a scope with no filter of ours
// (decision 0039).
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const BRUNO = PersonId.parse('person-b')

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'member', now()), ('member-b', '${B}', 'person-b', 'owner', now());
  insert into projects.project(id, company_id, name, attempt_key, created_at) values
    ('project-a', '${A}', 'Encomendas', 'a', now()), ('project-b', '${B}', 'Encomendas', 'b', now());
  insert into builder.machine(project_id, company_id, sandbox_id, used_at) values
    ('project-a', '${A}', 'sandbox-a', now()), ('project-b', '${B}', 'sandbox-b', now());`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('máquinas: sem filtro, a Empresa B não lê nem grava máquina da A', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inB(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: B, personId: BRUNO }, (tx) =>
      tx.execute(statement),
    )
  }
  assert.deepEqual((await inB(sql`select sandbox_id from builder.machine`)).rows, [
    { sandbox_id: 'sandbox-b' },
  ])
  await assert.rejects(
    inB(sql`insert into builder.machine(project_id, company_id, sandbox_id, used_at)
      values ('project-a', ${A}, 'sandbox', now())`),
    refusedWith('42501'),
  )
  assert.deepEqual(
    (await inB(sql`update builder.machine set used_at = now() returning sandbox_id`)).rows,
    [{ sandbox_id: 'sandbox-b' }],
  )
  assert.equal(
    (await asOwner(`select sandbox_id from builder.machine where company_id = '${A}'`))[0]
      ?.sandbox_id,
    'sandbox-a',
  )
})
