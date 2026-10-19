import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// Empresa A: Bruno owns it, Ana and Diego are members; Ana has her own account and the company's
// Time 2 is given to her alone. Written as the owner; the removals go through the scopes' roles.
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const BRUNO = PersonId.parse('person-b')
const OPERATOR = PersonId.parse('person-op')
const TIME_1 = '00000000-0000-4000-8000-000000000001'
const TIME_2 = '00000000-0000-4000-8000-000000000002'
const ANAS = '00000000-0000-4000-8000-0000000000a1'

const SEED = `
  insert into auth."user"(id, name, email) values ('person-a', 'Ana', 'ana@example.test'),
    ('person-b', 'Bruno', 'bruno@example.test'), ('person-d', 'Diego', 'diego@example.test');
  insert into auth."user"(id, name, email, role) values ('person-op', 'Operadora', 'op@example.test', 'admin');
  insert into auth.company(id, name, slug, created_at, attempt_key) values ('${A}', 'Empresa A', 'key-a', now(), 'key-a');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'member', now()), ('member-b', '${A}', 'person-b', 'owner', now()),
    ('member-d', '${A}', 'person-d', 'member', now());
  insert into builder.model_account(id, company_id, person_id, kind, provider, label, position,
    state, sealed, key_id, hint, linked_by, linked_at, revision, attempt_key) values
    ('${TIME_1}', '${A}', null, 'api_key', 'anthropic', 'Time 1', 0, 'ready', '\\x01', 'k1', 'aaaa', 'person-b', now(), 1, 't1'),
    ('${TIME_2}', '${A}', null, 'api_key', 'anthropic', 'Time 2', 1, 'ready', '\\x02', 'k1', 'bbbb', 'person-b', now(), 1, 't2'),
    ('${ANAS}', '${A}', 'person-a', 'api_key', 'openai', 'Minha', 0, 'ready', '\\x03', 'k1', 'cccc', 'person-a', now(), 1, 'a1');
  insert into builder.model_account_assignee(account_id, company_id, person_id) values ('${TIME_2}', '${A}', 'person-a');
  insert into builder.model_account_sign_in(id, company_id, person_id, owner, kind, label, sealed, key_id, expires_at) values
    (gen_random_uuid(), '${A}', 'person-a', 'me', 'claude_subscription', 'Assinatura', '\\x04', 'k1', now() + interval '10 minutes');
  insert into builder.company_model(company_id, model) values ('${A}', 'anthropic/claude-sonnet-4-5');
  insert into builder.company_account_kind(company_id, kind) values ('${A}', 'claude_subscription');`

const COUNTS = `select
  (select count(*)::int from builder.model_account) as accounts,
  (select count(*)::int from builder.model_account_assignee) as assignees,
  (select count(*)::int from builder.model_account_sign_in) as sign_ins,
  (select count(*)::int from builder.company_model) as models,
  (select count(*)::int from builder.company_account_kind) as kinds`

test('contas de modelo: tirar a pessoa apaga as contas e as entradas dela, e a conta dada volta para todos', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await database.command({ kind: 'COMPANY', companyId: A, personId: BRUNO }, (tx) =>
    tx.execute(sql`delete from auth.member where id = 'member-a'`),
  )
  assert.deepEqual(await asOwner(`select id::text from builder.model_account order by id`), [
    { id: TIME_1 },
    { id: TIME_2 },
  ])
  assert.deepEqual(await asOwner(COUNTS), [
    { accounts: 2, assignees: 0, sign_ins: 0, models: 1, kinds: 1 },
  ])
})

test('contas de modelo: apagar a empresa apaga tudo dela', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  // As the Central's deletion does through the library: the members, then the company.
  await database.command({ kind: 'OPERATOR', personId: OPERATOR, companyId: A }, async (tx) => {
    await tx.execute(sql`delete from auth.member where company_id = ${A}`)
    await tx.execute(sql`delete from auth.company where id = ${A}`)
  })
  assert.deepEqual(await asOwner(COUNTS), [
    { accounts: 0, assignees: 0, sign_ins: 0, models: 0, kinds: 0 },
  ])
})
