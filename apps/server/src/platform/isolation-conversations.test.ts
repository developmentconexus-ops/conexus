import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Ana's conversation in Empresa A, Diego beside her, and Bruno in Empresa B, written as the owner;
// each check reads through a scope with no filter of ours (decision 0039, founder D1 A).
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const DIEGO = PersonId.parse('person-d')
const BRUNO = PersonId.parse('person-b')
const ANAS = '00000000-0000-4000-8000-0000000000a1'

const SEED = `
  insert into auth."user"(id, name, email) values ('person-a', 'Ana', 'ana@example.test'),
    ('person-d', 'Diego', 'diego@example.test'), ('person-b', 'Bruno', 'bruno@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'member', now()), ('member-d', '${A}', 'person-d', 'member', now()),
    ('member-b', '${B}', 'person-b', 'owner', now());
  insert into projects.project(id, company_id, name, attempt_key, created_at) values
    ('project-a', '${A}', 'Encomendas', 'p-a', now()), ('project-b', '${B}', 'Vendas', 'p-b', now());
  insert into builder.conversation(id, company_id, project_id, person_id, attempt_key, body_hash,
    created_at) values ('${ANAS}', '${A}', 'project-a', 'person-a', 'c-a', 'h', now());`

const IDS = sql`select coalesce(array_agg(id::text), '{}') as ids from builder.conversation`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('conversas: sem filtro, a Empresa B e Diego não leem nem gravam a conversa de Ana', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  for (const scope of [
    { kind: 'COMPANY', companyId: B, personId: BRUNO },
    { kind: 'COMPANY', companyId: A, personId: DIEGO },
  ] as const) {
    function run(statement: ReturnType<typeof sql>) {
      return database.command(scope, (tx) => tx.execute(statement))
    }
    assert.deepEqual((await run(IDS)).rows, [{ ids: [] }])
    await run(sql`delete from builder.conversation where id = ${ANAS}`)
  }
  const ana = { kind: 'COMPANY', companyId: A, personId: ANA } as const
  assert.deepEqual((await database.read(ana, (tx) => tx.execute(IDS))).rows, [{ ids: [ANAS] }])
})

test('conversas: o login do Hub não lê o índice nem a troca automática', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  for (const statement of [IDS, sql`select * from builder.company_model_fallback`]) {
    await assert.rejects(
      database.installation((tx) => tx.execute(statement)),
      refusedWith('42501'),
    )
  }
})
