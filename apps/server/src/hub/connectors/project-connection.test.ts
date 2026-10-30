import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

// Two companies with a Sankhya connection and a Projeto each; the checks of step 20's U2, the
// grant of a connection to a Projeto and the connection's notes, as the company's login sees them.
const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const CONNECTION_A = '00000000-0000-4000-8000-00000000000a'
const CONNECTION_B = '00000000-0000-4000-8000-00000000000b'

function connection(id: string, company: string, connector: string, name: string, key: string) {
  return `insert into connectors.connection(id, company_id, connector_id, name, connector_version,
    state, sealed, key_id, linked_by, linked_at, attempt_key) values
    ('${id}', '${company}', '${connector}', '${name}', '1.0.0', 'NEW', '\\x01', 'k1',
     'person-a', now(), '${key}');`
}

const SEED = `
  insert into auth."user"(id, name, email) values ('person-a', 'Ana', 'ana@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Empresa A', 'key-a', now(), 'key-a'), ('${B}', 'Empresa B', 'key-b', now(), 'key-b');
  insert into projects.project(id, company_id, name, attempt_key, created_at) values
    ('proj-a', '${A}', 'Vendas', 'proj-a', now()), ('proj-b', '${B}', 'Vendas', 'proj-b', now());
  ${connection(CONNECTION_A, A, 'sankhya', 'Matriz', 'a')}
  ${connection(CONNECTION_B, B, 'sankhya', 'Matriz', 'b')}`

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

test('a liberação: uma por Projeto num conector que declara uma, várias noutro; só da própria empresa; some com a ligação', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  const ML_1 = '00000000-0000-4000-8000-0000000000c1'
  const ML_2 = '00000000-0000-4000-8000-0000000000c2'
  const SANKHYA_2 = '00000000-0000-4000-8000-0000000000c3'
  await asOwner(`
    ${connection(ML_1, A, 'mercado-livre', 'Loja 1', 'a-ml1')}
    ${connection(ML_2, A, 'mercado-livre', 'Loja 2', 'a-ml2')}
    ${connection(SANKHYA_2, A, 'sankhya', 'Filial', 'a-sk2')}`)
  function grant(
    project: string,
    company: string,
    connector: string,
    id: string,
    exclusive: boolean,
  ) {
    return asOwner(`insert into connectors.project_connection(project_id, company_id, connector_id,
      connection_id, exclusive, granted_by, granted_at)
      values ('${project}', '${company}', '${connector}', '${id}', ${exclusive}, 'person-a', now())`)
  }

  await grant('proj-a', A, 'sankhya', CONNECTION_A, true)
  // The second Sankhya in the same Projeto: the database refuses it, and names the index.
  await assert.rejects(grant('proj-a', A, 'sankhya', SANKHYA_2, true), {
    code: '23505',
    constraint: 'project_connection_one_key',
  })
  // The same connection twice is one grant.
  await assert.rejects(grant('proj-a', A, 'sankhya', CONNECTION_A, true), {
    code: '23505',
    constraint: 'project_connection_pkey',
  })
  // A connector that declares many: both stores.
  await grant('proj-a', A, 'mercado-livre', ML_1, false)
  await grant('proj-a', A, 'mercado-livre', ML_2, false)
  // Another company's connection, or Projeto, or a connector that is not the connection's: refused.
  await assert.rejects(grant('proj-a', A, 'sankhya', CONNECTION_B, false), {
    code: '23503',
    constraint: 'project_connection_connection_fkey',
  })
  await assert.rejects(grant('proj-b', B, 'sankhya', CONNECTION_A, false), {
    code: '23503',
    constraint: 'project_connection_connection_fkey',
  })
  await assert.rejects(grant('proj-a', A, 'bling', SANKHYA_2, false), {
    code: '23503',
    constraint: 'project_connection_connection_fkey',
  })
  await assert.rejects(grant('proj-b', A, 'sankhya', SANKHYA_2, false), {
    code: '23503',
    constraint: 'project_connection_project_fkey',
  })

  // Desligar takes the connection's grants; the Projeto's removal takes the rest.
  await asOwner(`delete from connectors.connection where id = '${ML_1}'`)
  assert.deepEqual(
    await asOwner(`select connection_id from connectors.project_connection order by connection_id`),
    [{ connection_id: CONNECTION_A }, { connection_id: ML_2 }],
  )
  await asOwner(`delete from projects.project where id = 'proj-a'`)
  assert.deepEqual(await asOwner(`select 1 from connectors.project_connection`), [])
})

test('a liberação: a empresa lê, libera e tira as suas, e nenhuma de outra empresa', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  await asOwner(`
    insert into connectors.project_connection(project_id, company_id, connector_id, connection_id,
      exclusive, granted_by, granted_at)
      values ('proj-b', '${B}', 'sankhya', '${CONNECTION_B}', true, 'person-b', now())`)
  function inA(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }

  assert.deepEqual((await inA(sql`select 1 from connectors.project_connection`)).rows, [])
  await inA(sql`insert into connectors.project_connection(project_id, company_id, connector_id,
    connection_id, exclusive, granted_by, granted_at)
    values ('proj-a', ${A}, 'sankhya', ${CONNECTION_A}, true, ${ANA}, now())`)
  assert.deepEqual(
    (await inA(sql`select connection_id, granted_by from connectors.project_connection`)).rows,
    [{ connection_id: CONNECTION_A, granted_by: ANA }],
  )
  // The scope writes no grant for another company's Projeto.
  await assert.rejects(
    inA(sql`insert into connectors.project_connection(project_id, company_id, connector_id,
      connection_id, exclusive, granted_by, granted_at)
      values ('proj-b', ${B}, 'sankhya', ${CONNECTION_B}, true, ${ANA}, now())`),
    refusedWith('42501'),
  )
  // A grant is made or taken back; it is not edited.
  await assert.rejects(
    inA(sql`update connectors.project_connection set exclusive = false`),
    refusedWith('42501'),
  )
  await inA(sql`delete from connectors.project_connection`)
  assert.deepEqual((await inA(sql`select 1 from connectors.project_connection`)).rows, [])
  assert.deepEqual(await asOwner(`select 1 from connectors.project_connection`), [
    { '?column?': 1 },
  ])
})

test('o caderno: nasce vazio, só objeto de até 32 KB; a empresa o lê e o muda sem mexer no selo', async (t) => {
  const { database, asOwner } = await createTestDatabase(t)
  await asOwner(SEED)
  function inA(statement: ReturnType<typeof sql>) {
    return database.command({ kind: 'COMPANY', companyId: A, personId: ANA }, (tx) =>
      tx.execute(statement),
    )
  }

  assert.deepEqual(
    (await inA(sql`select notes, revision from connectors.connection where id = ${CONNECTION_A}`))
      .rows,
    [{ notes: {}, revision: 0 }],
  )
  // One instruction adds a note and keeps the others; the revision, which only a seal write raises, stays.
  function note(concept: string) {
    return JSON.stringify({ [concept]: { map: { vendedor: 'TGFCAB.AD_CODVEND' }, rows: 3 } })
  }
  const sealedBefore = await asOwner(
    `select encode(sealed, 'hex') as sealed from connectors.connection where id = '${CONNECTION_A}'`,
  )
  assert.equal(sealedBefore.length, 1)
  await inA(sql`update connectors.connection set notes = notes || ${note('vendedor')}::jsonb
    where id = ${CONNECTION_A}`)
  await inA(sql`update connectors.connection set notes = notes || ${note('cliente')}::jsonb
    where id = ${CONNECTION_A}`)
  await inA(sql`update connectors.connection set notes = notes - 'vendedor'
    where id = ${CONNECTION_A}`)
  assert.deepEqual(
    (await inA(sql`select notes, revision from connectors.connection where id = ${CONNECTION_A}`))
      .rows,
    [{ notes: JSON.parse(note('cliente')), revision: 0 }],
  )
  // A value that is not an object, or past 32 KB, is refused by the database.
  for (const value of ['[]', '"texto"', 'null', JSON.stringify({ big: 'x'.repeat(32_768) })]) {
    await assert.rejects(
      inA(sql`update connectors.connection set notes = ${value}::jsonb where id = ${CONNECTION_A}`),
      refusedWith('23514'),
    )
  }
  assert.deepEqual(
    await asOwner(`select 1 from connectors.connection where octet_length(notes::text) = 32768`),
    [],
  )
  // The notes' updates left the seal byte-equal, read as the owner.
  assert.deepEqual(
    await asOwner(
      `select encode(sealed, 'hex') as sealed from connectors.connection where id = '${CONNECTION_A}'`,
    ),
    sealedBefore,
  )
  // The company cannot write the seal at all: the grant covers the notes only.
  await assert.rejects(
    inA(sql`update connectors.connection set sealed = sealed`),
    refusedWith('42501'),
  )
})
