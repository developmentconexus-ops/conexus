import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Two companies, each with a company account and Ana's own account in A, written as the owner;
// each check reads through a scope with no filter of ours (decision 0039, Grant A).
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const BRUNO = PersonId.parse('person-b')
const ACCOUNT_A = '00000000-0000-4000-8000-00000000000a'
const ACCOUNT_B = '00000000-0000-4000-8000-00000000000b'
const ANAS = '00000000-0000-4000-8000-0000000000a1'

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'member', now()), ('member-b', '${A}', 'person-b', 'owner', now());
  insert into builder.model_account(id, company_id, person_id, kind, provider, label, position,
    state, sealed, key_id, hint, linked_by, linked_at, revision, attempt_key) values
    ('${ACCOUNT_A}', '${A}', null, 'api_key', 'anthropic', 'Time 1', 0, 'ready', '\\x01', 'k1', 'x7Qa', 'person-b', now(), 1, 'a'),
    ('${ANAS}', '${A}', 'person-a', 'api_key', 'anthropic', 'Minha', 0, 'ready', '\\x02', 'k1', 'Ana1', 'person-a', now(), 1, 'a1'),
    ('${ACCOUNT_B}', '${B}', null, 'api_key', 'anthropic', 'Time 1', 0, 'ready', '\\x03', 'k1', 'x7Qb', 'person-b', now(), 1, 'b');`

const IDS = sql`select coalesce(array_agg(id::text order by id), '{}') as ids from builder.model_account`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('contas de modelo: sem filtro, a Empresa B não lê nem grava conta da A', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inB(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: B, personId: BRUNO }, (tx) =>
      tx.execute(statement),
    )
  }
  assert.deepEqual((await inB(IDS)).rows, [{ ids: [ACCOUNT_B] }])
  assert.deepEqual((await inB(sql`select * from builder.sealed_of(${ACCOUNT_A})`)).rows, [])
  await assert.rejects(
    inB(sql`insert into builder.model_account(id, company_id, person_id, kind, provider, label,
      position, state, sealed, key_id, hint, linked_by, linked_at, revision, attempt_key)
      values (gen_random_uuid(), ${A}, null, 'api_key', 'openai', 'Plantada', 0, 'ready', '\\x00',
      'k1', 'abcd', ${BRUNO}, now(), 1, 'planted')`),
    refusedWith('42501'),
  )
  const changed = await inB(sql`update builder.model_account set label = 'Outra' returning id`)
  assert.deepEqual(changed.rows, [{ id: ACCOUNT_B }])
  await inB(sql`delete from builder.model_account where id = ${ACCOUNT_A}`)
  assert.equal(
    (await asOwner(`select label from builder.model_account where id = '${ACCOUNT_A}'`))[0]?.label,
    'Time 1',
  )
})

test('contas de modelo: o papel da empresa recebe 42501 ao pedir sealed; a função entrega uma conta da própria empresa', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inA(personId: PersonId, statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId }, (tx) =>
      tx.execute(statement),
    )
  }
  await assert.rejects(
    inA(BRUNO, sql`select sealed from builder.model_account`),
    refusedWith('42501'),
  )
  await assert.rejects(inA(BRUNO, sql`select * from builder.model_account`), refusedWith('42501'))
  await assert.rejects(
    inA(BRUNO, sql`delete from builder.model_account returning sealed`),
    refusedWith('42501'),
  )
  const opened = await inA(
    BRUNO,
    sql`select encode(sealed, 'hex') as sealed, key_id from builder.sealed_of(${ACCOUNT_A})`,
  )
  assert.deepEqual(opened.rows, [{ sealed: '01', key_id: 'k1' }])
  // No one reads another person's own account, by the table or by the function (founder, D4).
  assert.deepEqual((await inA(BRUNO, IDS)).rows, [{ ids: [ACCOUNT_A] }])
  assert.deepEqual((await inA(BRUNO, sql`select * from builder.sealed_of(${ANAS})`)).rows, [])
  assert.deepEqual((await inA(ANA, IDS)).rows, [{ ids: [ACCOUNT_A, ANAS].sort() }])
  // The Hub's login reaches no row and no function but the companies that hold a seal.
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select id from builder.model_account`)),
    refusedWith('42501'),
  )
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select * from builder.sealed_of(${ACCOUNT_A})`)),
    refusedWith('42501'),
  )
  const companies = await database.installation((tx) =>
    tx.execute(
      sql`select array_agg(company_id order by company_id) as ids from builder.companies_with_seals()`,
    ),
  )
  assert.deepEqual(companies.rows, [{ ids: [A, B] }])
})

test('contas de modelo: as entradas e as atribuições seguem a política de linha da própria tabela', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(`${SEED}
    insert into builder.model_account_assignee(account_id, company_id, person_id) values
      ('${ACCOUNT_A}', '${A}', 'person-a');
    insert into builder.model_account_sign_in(id, company_id, person_id, owner, kind, label, sealed,
      key_id, expires_at) values
      ('00000000-0000-4000-8000-0000000000e1', '${A}', 'person-a', 'me', 'claude_subscription',
      'Assinatura', '\\x04', 'k1', now() + interval '5 minutes');`)
  function run(companyId: CompanyId, personId: PersonId, statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId, personId }, (tx) => tx.execute(statement))
  }
  const signIns = sql`select count(*)::int as n from builder.model_account_sign_in`
  const assignees = sql`select count(*)::int as n from builder.model_account_assignee`
  assert.deepEqual((await run(B, BRUNO, signIns)).rows, [{ n: 0 }])
  assert.deepEqual((await run(B, BRUNO, assignees)).rows, [{ n: 0 }])
  assert.deepEqual((await run(A, BRUNO, signIns)).rows, [{ n: 0 }])
  const taken = await run(A, BRUNO, sql`delete from builder.model_account_sign_in returning id`)
  assert.deepEqual(taken.rows, [])
  assert.deepEqual((await run(A, ANA, signIns)).rows, [{ n: 1 }])
  assert.deepEqual((await run(A, BRUNO, assignees)).rows, [{ n: 1 }])
  await run(B, BRUNO, sql`delete from builder.model_account_assignee`)
  assert.deepEqual((await run(A, ANA, assignees)).rows, [{ n: 1 }])
})

test('padrão de modelo: com o escopo de Ana, o padrão de outra pessoa não se lê, não se grava nem se apaga', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(`insert into builder.person_model_default(company_id, person_id, model, effort) values
    ('${A}', 'person-a', 'anthropic/claude-sonnet-4-5', 'high'),
    ('${A}', 'person-b', 'anthropic/claude-sonnet-4-5', 'low')`)
  function asAna(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }
  const own = await asAna(sql`select person_id from builder.person_model_default`)
  assert.deepEqual(own.rows, [{ person_id: 'person-a' }])
  await assert.rejects(
    asAna(sql`insert into builder.person_model_default(company_id, person_id, model, effort)
      values (${A}, 'person-b', 'openai/gpt-5', 'low')`),
    refusedWith('42501'),
  )
  await asAna(sql`update builder.person_model_default set effort = 'max'`)
  await asAna(sql`delete from builder.person_model_default where person_id = 'person-b'`)
  assert.deepEqual(
    await asOwner(`select person_id, effort from builder.person_model_default order by person_id`),
    [
      { person_id: 'person-a', effort: 'max' },
      { person_id: 'person-b', effort: 'low' },
    ],
  )
})
