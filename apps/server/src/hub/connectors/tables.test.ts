import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

// Two companies, each with a Sankhya connection, written as the owner; each check reads through a
// scope with no filter of ours (the pattern of platform/isolation-model-accounts.test.ts).
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const BRUNO = PersonId.parse('person-b')
const CONNECTION_A = '00000000-0000-4000-8000-00000000000a'
const CONNECTION_B = '00000000-0000-4000-8000-00000000000b'

function connection(id: string, company: string, connector: string, sealed: string, key: string) {
  return `insert into connectors.connection(id, company_id, connector_id, connector_version, state,
    sealed, key_id, linked_by, linked_at, attempt_key) values
    ('${id}', '${company}', '${connector}', '1.0.0', 'NEW', '${sealed}', 'k1', 'person-b', now(), '${key}');`
}

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'member', now()), ('member-b', '${A}', 'person-b', 'owner', now());
  ${connection(CONNECTION_A, A, 'sankhya', '\\x01', 'a')}
  ${connection(CONNECTION_B, B, 'sankhya', '\\x02', 'b')}`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('a ligação: uma por conector, cada empresa a sua, o selo só pela função', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inA(personId: PersonId, statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId }, (tx) =>
      tx.execute(statement),
    )
  }

  // One connection for each (company, connector): the second Sankhya of A is refused.
  await assert.rejects(asOwner(connection(crypto.randomUUID(), A, 'sankhya', '\\x03', 'a2')), {
    code: '23505',
    constraint: 'connection_connector_key',
  })
  await asOwner(connection(crypto.randomUUID(), A, 'bling', '\\x03', 'a3'))

  // A company's login reads its own row and no other's, and writes none into another company.
  const ids = sql`select coalesce(array_agg(id::text order by id), '{}') as ids from connectors.connection`
  const own = sql`select coalesce(array_agg(connector_id order by connector_id), '{}') as connectors
    from connectors.connection`
  assert.deepEqual((await inA(ANA, own)).rows, [{ connectors: ['bling', 'sankhya'] }])
  const inB = await database.command({ kind: 'COMPANY', companyId: B, personId: BRUNO }, (tx) =>
    tx.execute(ids),
  )
  assert.deepEqual(inB.rows, [{ ids: [CONNECTION_B] }])
  await assert.rejects(
    inA(
      ANA,
      sql`insert into connectors.connection(id, company_id, connector_id, connector_version, state,
        sealed, key_id, linked_by, linked_at, attempt_key)
        values (gen_random_uuid(), ${B}, 'bling', '1.0.0', 'NEW', '\\x00', 'k1', ${ANA}, now(), 'planted')`,
    ),
    refusedWith('42501'),
  )

  // The company's role never reads `sealed`; the function hands out one, in the transaction's company.
  await assert.rejects(
    inA(ANA, sql`select sealed from connectors.connection`),
    refusedWith('42501'),
  )
  await assert.rejects(inA(ANA, sql`select * from connectors.connection`), refusedWith('42501'))
  const opened = await inA(
    ANA,
    sql`select encode(sealed, 'hex') as sealed, key_id from connectors.sealed_of(${CONNECTION_A})`,
  )
  assert.deepEqual(opened.rows, [{ sealed: '01', key_id: 'k1' }])
  assert.deepEqual(
    (await inA(ANA, sql`select * from connectors.sealed_of(${CONNECTION_B})`)).rows,
    [],
  )
})

test('a ligação: o login do Hub só alcança as empresas que guardam um selo', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  // The Hub's login reaches no row and no function but the companies that hold a seal.
  await assert.rejects(
    database.installation((tx) => tx.execute(sql`select id from connectors.connection`)),
    refusedWith('42501'),
  )
  await assert.rejects(
    database.installation((tx) =>
      tx.execute(sql`select * from connectors.sealed_of(${CONNECTION_A})`),
    ),
    refusedWith('42501'),
  )
  const companies = await database.installation((tx) =>
    tx.execute(
      sql`select array_agg(company_id order by company_id) as ids from connectors.companies_with_seals()`,
    ),
  )
  assert.deepEqual(companies.rows, [{ ids: [A, B] }])
})

test('a ligação: a empresa troca o estado e o selo, e a apaga com a empresa', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inA(personId: PersonId, statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId }, (tx) =>
      tx.execute(statement),
    )
  }

  // The company's role reseals and tests a connection, and changes nothing else about it.
  await inA(
    ANA,
    sql`update connectors.connection set state = 'ACTIVE', tested_at = now()
    where id = ${CONNECTION_A}`,
  )
  await assert.rejects(
    inA(
      ANA,
      sql`update connectors.connection set connector_id = 'outro' where id = ${CONNECTION_A}`,
    ),
    refusedWith('42501'),
  )

  // The company leaves (its people first, as the deletion's phases do), and its connections with it.
  await asOwner(
    `delete from auth.member where company_id = '${A}'; delete from auth.company where id = '${A}'`,
  )
  assert.deepEqual(await asOwner(`select id from connectors.connection`), [{ id: CONNECTION_B }])
})
