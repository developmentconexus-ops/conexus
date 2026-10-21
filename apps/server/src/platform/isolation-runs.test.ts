import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Two companies with a Projeto each; every check reads through a scope with no filter of ours
// (decision 0039), and the open-run rule is the database's own (data D15).
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const BRUNO = PersonId.parse('person-b')
const RUN_A = '00000000-0000-4000-8000-0000000000a1'
const RUN_B = '00000000-0000-4000-8000-0000000000b1'
const OWNER = '00000000-0000-4000-8000-00000000000f'

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'member', now()), ('member-b', '${B}', 'person-b', 'owner', now());
  insert into projects.project(id, company_id, name, attempt_key, created_at) values
    ('project-a', '${A}', 'Encomendas', 'a', now()), ('project-b', '${B}', 'Encomendas', 'b', now());
  insert into builder.run(id, company_id, project_id, person_id, conversation_id, state, deadline_at, lease_until, owner) values
    ('${RUN_A}', '${A}', 'project-a', 'person-a', 'conversation-a', 'open', now() + interval '1 hour', now(), '${OWNER}'),
    ('${RUN_B}', '${B}', 'project-b', 'person-b', 'conversation-b', 'saved', now() + interval '1 hour', now(), '${OWNER}');
  update builder.run set candidate_sha = 'abc' where id = '${RUN_B}';`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('execuções: sem filtro, a Empresa B não lê nem grava execução, evento ou máquina da A', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inB(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: B, personId: BRUNO }, (tx) =>
      tx.execute(statement),
    )
  }
  assert.deepEqual((await inB(sql`select id from builder.run`)).rows, [{ id: RUN_B }])
  await assert.rejects(
    inB(sql`insert into builder.run_event(run_id, company_id, n, event)
      values (${RUN_A}, ${A}, 1, '{}')`),
    refusedWith('42501'),
  )
  await assert.rejects(
    inB(sql`insert into builder.machine(project_id, company_id, sandbox_id, used_at)
      values ('project-a', ${A}, 'sandbox', now())`),
    refusedWith('42501'),
  )
  assert.deepEqual((await inB(sql`update builder.run set state = 'failed' returning id`)).rows, [
    { id: RUN_B },
  ])
  assert.equal(
    (await asOwner(`select state from builder.run where id = '${RUN_A}'`))[0]?.state,
    'open',
  )
})

test('execuções: um Projeto tem uma execução aberta; terminada, outra se abre', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inA(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }
  function open(id: string) {
    return sql`insert into builder.run(id, company_id, project_id, person_id, conversation_id, state, deadline_at,
      lease_until, owner) values (${id}, ${A}, 'project-a', 'person-a', 'conversation-a', 'open', now(), now(), ${OWNER})`
  }
  await assert.rejects(inA(open('00000000-0000-4000-8000-0000000000a2')), refusedWith('23505'))
  await inA(sql`update builder.run set state = 'saving' where id = ${RUN_A}`)
  await assert.rejects(inA(open('00000000-0000-4000-8000-0000000000a2')), refusedWith('23505'))
  await inA(sql`update builder.run set state = 'saved' where id = ${RUN_A}`)
  await inA(open('00000000-0000-4000-8000-0000000000a2'))
  await assert.rejects(inA(sql`update builder.run set state = 'lost'`), refusedWith('23514'))
  await assert.rejects(inA(sql`update builder.run set deadline_at = now()`), refusedWith('42501'))
})

test('execuções: o login do Hub só recebe as empresas com trabalho pendente', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select id from builder.run`)),
    refusedWith('42501'),
  )
  const pending = sql`select array_agg(company_id order by company_id) as ids from builder.companies_with_runs()`
  assert.deepEqual((await database.installation((tx) => tx.execute(pending))).rows, [
    { ids: [A, B] },
  ])
  await asOwner(`update builder.run set copied_at = now() where id = '${RUN_B}';
    update builder.run set state = 'stopped' where id = '${RUN_A}'`)
  assert.deepEqual((await database.installation((tx) => tx.execute(pending))).rows, [{ ids: null }])
})
