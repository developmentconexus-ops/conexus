import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from './test-database.ts'

// The two tables of the requests to publish (step 24.3.4, U2) under the row policies, beside
// isolation.test.ts: Ana of A, Bruno of B and Carla of both, written as the owner.
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const ANA = PersonId.parse('person-a')
const CARLA = PersonId.parse('person-ab')

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test'),
    ('person-ab', 'Carla', 'carla@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'Empresa A', 'key-a', now(), 'key-a'),
    ('companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'person-a', 'owner', now()),
    ('member-b', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'person-b', 'owner', now()),
    ('member-ab-a', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'person-ab', 'member', now()),
    ('member-ab-b', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'person-ab', 'admin', now());`

async function seeded(t: TestContext) {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  return test
}

function inA(personId: PersonId) {
  return { kind: 'COMPANY', companyId: A, personId } as const
}

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('pedidos: no contexto A, os pedidos e os avisos de B não aparecem nem mudam, e o aviso de outra pessoa não se lê', async (t) => {
  const { database, asOwner } = await seeded(t)
  await asOwner(`
    insert into projects.project(id, company_id, name, attempt_key, created_at) values
      ('projectA', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'Pedidos', 'key-a', now()),
      ('projectB', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'Pedidos', 'key-b', now());
    insert into requests.request(id, attempt_key, company_id, requested_by, project_id, kind,
      number, state, created_at) values
      ('00000000-0000-4000-8000-00000000000a', 'key-a', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA',
        'person-ab', 'projectA', 'PUBLISH_APP_VERSION', 2, 'PENDING', now()),
      ('00000000-0000-4000-8000-00000000000b', 'key-b', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB',
        'person-b', 'projectB', 'PUBLISH_APP_VERSION', 2, 'PENDING', now());
    insert into notifications.request_notice(id, company_id, person_id, request_id, kind,
      created_at) values
      ('00000000-0000-4000-8000-0000000000aa', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'person-a',
        '00000000-0000-4000-8000-00000000000a', 'REQUEST_OPENED', now()),
      ('00000000-0000-4000-8000-0000000000bb', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'person-ab',
        '00000000-0000-4000-8000-00000000000b', 'REQUEST_OPENED', now());`)
  function inScope(personId: PersonId, statement: ReturnType<typeof sql>) {
    return database.command(inA(personId), async (tx) => (await tx.execute(statement)).rows)
  }
  const seen = sql`select
    (select coalesce(array_agg(project_id order by id), '{}') from requests.request) as requests,
    (select coalesce(array_agg(person_id order by id), '{}') from notifications.request_notice) as notices`
  assert.deepEqual(await inScope(ANA, seen), [{ requests: ['projectA'], notices: ['person-a'] }])
  // Carla, of both companies, reads A's request but not Ana's notice, nor her own of B.
  assert.deepEqual(await inScope(CARLA, seen), [{ requests: ['projectA'], notices: [] }])
  await inScope(ANA, sql`update requests.request set state = 'CANCELLED'`)
  await inScope(ANA, sql`update notifications.request_notice set read_at = now()`)
  await assert.rejects(
    inScope(
      ANA,
      sql`insert into requests.request(id, attempt_key, company_id, requested_by, project_id,
        kind, number, state, created_at) values ('00000000-0000-4000-8000-0000000000b2', 'planted',
        'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'person-b', 'projectB', 'PUBLISH_APP_VERSION', 3,
        'PENDING', now())`,
    ),
    refusedWith('42501'),
  )
  // The asker writes the deciders' notices of A, never one of B.
  await inScope(
    CARLA,
    sql`insert into notifications.request_notice(id, company_id, person_id, request_id, kind,
      created_at) values ('00000000-0000-4000-8000-0000000000a2', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA',
      'person-a', '00000000-0000-4000-8000-00000000000a', 'REQUEST_DECIDED', now())`,
  )
  await assert.rejects(
    inScope(
      CARLA,
      sql`insert into notifications.request_notice(id, company_id, person_id, request_id, kind,
        created_at) values ('00000000-0000-4000-8000-0000000000b3', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB',
        'person-b', '00000000-0000-4000-8000-00000000000b', 'REQUEST_DECIDED', now())`,
    ),
    refusedWith('42501'),
  )
  assert.deepEqual(await asOwner(`select project_id, state from requests.request order by id`), [
    { project_id: 'projectA', state: 'CANCELLED' },
    { project_id: 'projectB', state: 'PENDING' },
  ])
  assert.deepEqual(
    await asOwner(
      `select person_id, kind, read_at is not null as read from notifications.request_notice order by id`,
    ),
    [
      { person_id: 'person-a', kind: 'REQUEST_DECIDED', read: false },
      { person_id: 'person-a', kind: 'REQUEST_OPENED', read: true },
      { person_id: 'person-ab', kind: 'REQUEST_OPENED', read: false },
    ],
  )
})
