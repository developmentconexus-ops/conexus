import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

// Two companies; Ana and Bruno are members of the first, and the first has a Mercado Livre
// connection, which is what a Conectar de novo points at.
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const BRUNO = PersonId.parse('person-b')
const CONNECTION_A = '00000000-0000-4000-8000-00000000000a'

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'member', now()), ('member-b', '${A}', 'person-b', 'owner', now());
  insert into connectors.connection(id, company_id, connector_id, name, connector_version, state,
    sealed, key_id, linked_by, linked_at, attempt_key) values
    ('${CONNECTION_A}', '${A}', 'mercado-livre', 'Loja', '1.0.0', 'NEW', '\\x01', 'k1', 'person-b',
     now(), 'a');`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

// A sign-in row as text: its target is a name (first link) or a connection and its revision.
function signIn(
  company: string,
  person: string,
  target: [string | null, string | null, number | null],
) {
  const [connection, name, revision] = target.map((value) =>
    value === null ? 'null' : typeof value === 'number' ? String(value) : `'${value}'`,
  )
  const id = crypto.randomUUID()
  return {
    id,
    text: `insert into connectors.connection_sign_in(id, company_id, person_id, connector_id,
      connection_id, name, connection_revision, sealed, key_id, expires_at) values
      ('${id}', '${company}', '${person}', 'mercado-livre', ${connection}, ${name}, ${revision},
       '\\x01', 'k1', now() + interval '600 seconds')`,
  }
}

const FIRST: [null, string, null] = [null, 'Loja 2', null]
const AGAIN: [string, null, number] = [CONNECTION_A, null, 3]

test('a autorização em andamento: o alvo é uma ligação nova ou uma refeita, nunca as duas nem nenhuma', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(signIn(A, 'person-a', FIRST).text)
  await asOwner(signIn(A, 'person-a', AGAIN).text)
  for (const target of [
    [CONNECTION_A, 'Loja', 3],
    [null, null, null],
    [null, 'Loja', 3],
    [CONNECTION_A, null, null],
  ] as const) {
    await assert.rejects(asOwner(signIn(A, 'person-a', [...target]).text), {
      code: '23514',
      constraint: 'connection_sign_in_target',
    })
  }
})

test('a autorização em andamento: a ligação é da mesma empresa e do mesmo conector, e o nome vem aparado', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(
    `insert into auth.member(id, company_id, user_id, role, created_at)
      values ('member-b-b', '${B}', 'person-b', 'member', now())`,
  )
  // Another company's connection, or the right company's under another connector, is refused.
  for (const row of [
    signIn(B, 'person-b', AGAIN).text,
    signIn(A, 'person-a', AGAIN).text.replace(`'mercado-livre'`, `'bling'`),
  ]) {
    await assert.rejects(asOwner(row), {
      code: '23503',
      constraint: 'connection_sign_in_company_id_connector_id_connection_id_fkey',
    })
  }
  for (const name of ['', ' Loja', 'Loja ', 'x'.repeat(61)]) {
    await assert.rejects(asOwner(signIn(A, 'person-a', [null, name, null]).text), {
      code: '23514',
      constraint: 'connection_sign_in_name',
    })
  }
})

test('a autorização em andamento: uma pessoa, uma vez, e sai com a ligação ou com a pessoa', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function as(
    companyId: CompanyId,
    personId: PersonId,
    statement: string | ReturnType<typeof sql>,
  ) {
    const run = typeof statement === 'string' ? sql.raw(statement) : statement
    return database.command({ kind: 'COMPANY', companyId, personId }, (tx) => tx.execute(run))
  }
  const first = signIn(A, 'person-a', FIRST)
  await as(A, ANA, first.text)
  await as(A, ANA, signIn(A, 'person-a', AGAIN).text)

  // A person reads and spends only their own; a person of the company is no other's.
  const mine = sql`select count(*)::int as n from connectors.connection_sign_in`
  assert.deepEqual((await as(A, ANA, mine)).rows, [{ n: 2 }])
  assert.deepEqual((await as(A, BRUNO, mine)).rows, [{ n: 0 }])
  const others = sql`delete from connectors.connection_sign_in returning id`
  assert.deepEqual((await as(A, BRUNO, others)).rows, [])
  await assert.rejects(as(A, BRUNO, signIn(A, 'person-a', FIRST).text), refusedWith('42501'))
  await assert.rejects(as(B, BRUNO, signIn(A, 'person-b', FIRST).text), refusedWith('42501'))
  const spent = sql`delete from connectors.connection_sign_in where id = ${first.id} returning id`
  assert.deepEqual((await as(A, ANA, spent)).rows, [{ id: first.id }])
  // The company's role starts and spends, and never edits one in place.
  await assert.rejects(
    as(A, ANA, sql`update connectors.connection_sign_in set name = 'outro'`),
    refusedWith('42501'),
  )

  // A connection that leaves takes the authorization to reconnect it; a person who leaves, theirs.
  await asOwner(`delete from connectors.connection where id = '${CONNECTION_A}'`)
  assert.deepEqual(await asOwner(`select id from connectors.connection_sign_in`), [])
  await as(A, BRUNO, signIn(A, 'person-b', FIRST).text)
  await asOwner(`delete from auth.member where company_id = '${A}' and user_id = 'person-b'`)
  assert.deepEqual(await asOwner(`select id from connectors.connection_sign_in`), [])
})
