import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const OPERATOR = PersonId.parse('person-op')
const HASH = 'a'.repeat(64)
const TABLES = ['model', 'version', 'run', 'model_run'] as const

function rowsOf(company: string, key: string) {
  return `
  insert into treatment.model(id, company_id, name, description, created_by, created_at)
    values ('model-${key}', '${company}', 'venda', '', 'person-a', now());
  insert into treatment.version(id, model_id, company_id, number, sql, inputs, hash, proposed_by, proposed_at)
    values ('version-${key}', 'model-${key}', '${company}', 1, 'select 1', '[]', '${HASH}', 'person-a', now());
  insert into treatment.run(id, company_id, lake_id, cause, state, "select", attempt, started_at, ended_at)
    values ('run-${key}', '${company}', 'abcdefghij12', 'NOW', 'DONE', '[]', 1, now(), now());
  insert into treatment.model_run(run_id, company_id, name, version_id, status, rows)
    values ('run-${key}', '${company}', 'negocio__venda', 'version-${key}', 'BUILT', 3);`
}

const SEED = `
  insert into auth."user"(id, name, email, role) values
    ('person-a', 'Ana', 'ana@example.test', null),
    ('person-op', 'Operadora', 'op@example.test', 'admin');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Padaria Sol', 'key-a', now(), 'key-a'),
    ('${B}', 'Loja Lua', 'key-b', now(), 'key-b');
  ${rowsOf(A, 'a')}${rowsOf(B, 'b')}`

const IN_A = { kind: 'COMPANY', companyId: A, personId: ANA } as const

function operator(personId: PersonId) {
  return { kind: 'OPERATOR', personId, companyId: A } as const
}

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

async function seeded(t: Parameters<typeof createTestDatabase>[0]) {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  async function companiesOf(table: string) {
    const rows = await test.asOwner(`select company_id from treatment.${table} order by 1`)
    return rows.map((row) => row.company_id)
  }
  return { ...test, companiesOf }
}

test('tratamento: a empresa lê só as suas linhas nas quatro tabelas e não grava nas da outra empresa', async (t) => {
  const { database, asOwner, companiesOf } = await seeded(t)
  for (const table of TABLES) {
    const { rows } = await database.read(IN_A, (tx) =>
      tx.execute(sql.raw(`select company_id from treatment.${table}`)),
    )
    assert.deepEqual(rows, [{ company_id: A }], table)
  }
  for (const insert of [
    sql`insert into treatment.model(id, company_id, name, description, created_by, created_at)
      values ('model-x', ${B}, 'outra', '', 'person-a', now())`,
    sql`insert into treatment.version(id, model_id, company_id, number, sql, inputs, hash, proposed_by, proposed_at)
      values ('version-x', 'model-b', ${B}, 2, 'select 1', '[]', ${HASH}, 'person-a', now())`,
    sql`insert into treatment.run(id, company_id, lake_id, cause, state, "select", attempt, started_at, ended_at)
      values ('run-x', ${B}, 'abcdefghij12', 'NOW', 'DONE', '[]', 1, now(), now())`,
    sql`insert into treatment.model_run(run_id, company_id, name, status)
      values ('run-b', ${B}, 'negocio__outra', 'SKIPPED')`,
  ]) {
    await assert.rejects(
      database.command(IN_A, (tx) => tx.execute(insert)),
      refusedWith('42501'),
    )
  }
  await database.command(IN_A, (tx) =>
    tx.execute(sql`update treatment.model set description = 'de A'`),
  )
  assert.deepEqual(
    await asOwner(`select company_id, description from treatment.model order by 1`),
    [
      { company_id: A, description: 'de A' },
      { company_id: B, description: '' },
    ],
  )
  for (const table of TABLES) assert.deepEqual(await companiesOf(table), [A, B], table)
})

test('tratamento: a empresa não grava linha sua que aponta para o modelo, a rodada ou a versão de outra empresa', async (t) => {
  const { database, asOwner } = await seeded(t)
  for (const insert of [
    sql`insert into treatment.version(id, model_id, company_id, number, sql, inputs, hash, proposed_by, proposed_at)
      values ('version-x', 'model-b', ${A}, 2, 'select 1', '[]', ${HASH}, 'person-a', now())`,
    sql`insert into treatment.model_run(run_id, company_id, name, status)
      values ('run-b', ${A}, 'negocio__outra', 'SKIPPED')`,
    sql`insert into treatment.model_run(run_id, company_id, name, version_id, status)
      values ('run-a', ${A}, 'negocio__outra', 'version-b', 'SKIPPED')`,
  ]) {
    await assert.rejects(
      database.command(IN_A, (tx) => tx.execute(insert)),
      refusedWith('23503'),
    )
  }
  // A version that goes takes only its own mention: the model run stays, with its company.
  await asOwner(`delete from treatment.version where id = 'version-a'`)
  assert.deepEqual(
    await asOwner(`select company_id, version_id from treatment.model_run order by 1`),
    [
      { company_id: A, version_id: null },
      { company_id: B, version_id: 'version-b' },
    ],
  )
})

test('tratamento: a empresa não apaga linha nenhuma e só muda as colunas concedidas', async (t) => {
  const { database, companiesOf } = await seeded(t)
  for (const statement of [
    ...TABLES.map((table) => sql.raw(`delete from treatment.${table}`)),
    sql`update treatment.model set name = 'outro'`,
    sql`update treatment.version set sql = 'select 2'`,
    sql`update treatment.version set hash = ${HASH}`,
    sql`update treatment.run set lake_id = 'outrolago000'`,
    sql`update treatment.run set "select" = '[]'`,
    sql`update treatment.model_run set rows = 4`,
  ]) {
    await assert.rejects(
      database.command(IN_A, (tx) => tx.execute(statement)),
      refusedWith('42501'),
    )
  }
  await database.command(IN_A, async (tx) => {
    await tx.execute(
      sql`update treatment.version set approved_by = 'person-a', approved_at = now()`,
    )
    await tx.execute(sql`update treatment.run set state = 'STOPPED', pending = '[]',
      failure = null, stopped_by = 'person-a', attempt = 2, task = 'task', ended_at = now()`)
  })
  for (const table of TABLES) assert.deepEqual(await companiesOf(table), [A, B], table)
})

test('tratamento: a Central apaga os modelos e as rodadas só da empresa do escopo, e o resto sai em cascata', async (t) => {
  const { database, companiesOf } = await seeded(t)
  const plain = operator(ANA)
  await database.command(plain, async (tx) => {
    await tx.execute(sql`delete from treatment.run`)
    await tx.execute(sql`delete from treatment.model`)
  })
  for (const table of TABLES) assert.deepEqual(await companiesOf(table), [A, B], table)
  // With no WHERE the SELECT policy hides nothing, so only the DELETE policy keeps B's rows.
  await database.command(operator(OPERATOR), async (tx) => {
    await tx.execute(sql`delete from treatment.run`)
    await tx.execute(sql`delete from treatment.model`)
  })
  for (const table of TABLES) assert.deepEqual(await companiesOf(table), [B], table)
})

test('tratamento: o banco recusa uma segunda rodada aberta, um nome repetido e uma linha fora do seu estado', async (t) => {
  const { asOwner } = await seeded(t)
  function run(id: string, state: string, failure: string | null, ended: boolean) {
    return asOwner(
      `insert into treatment.run(id, company_id, lake_id, cause, state, "select", failure, attempt, started_at, ended_at)
       values ($1, '${A}', 'abcdefghij12', 'COPY', $2, '[]', $3, 1, now(), ${ended ? 'now()' : 'null'})`,
      [id, state, failure],
    )
  }
  await run('open-1', 'STARTING', null, false)
  await assert.rejects(run('open-2', 'RUNNING', null, false), {
    constraint: 'treatment_run_open_key',
  })
  await assert.rejects(run('r-1', 'DONE', null, false), { constraint: 'treatment_run_ended' })
  await assert.rejects(run('r-2', 'FAILED', null, true), {
    constraint: 'treatment_run_failure_only_when_failed',
  })
  await assert.rejects(run('r-3', 'FAILED', 'OUTRO_MOTIVO', true), {
    constraint: 'treatment_run_failure',
  })
  await assert.rejects(
    asOwner(`insert into treatment.model(id, company_id, name, description, created_by, created_at)
      values ('model-x', '${A}', 'venda', '', 'person-a', now())`),
    { constraint: 'treatment_model_name_key' },
  )
  await assert.rejects(
    asOwner(`update treatment.version set approved_at = now() where id = 'version-a'`),
    { constraint: 'treatment_version_approved' },
  )
  for (const [constraint, statement] of [
    ['treatment_model_name', `update treatment.model set name = 'Venda' where id = 'model-a'`],
    ['treatment_version_hash', `update treatment.version set hash = 'abc' where id = 'version-a'`],
    ['treatment_run_cause', `update treatment.run set cause = 'OUTRA' where id = 'run-a'`],
    ['treatment_run_attempt', `update treatment.run set attempt = 0 where id = 'run-a'`],
    [
      'treatment_model_run_rows',
      `update treatment.model_run set status = 'SKIPPED' where run_id = 'run-a'`,
    ],
    [
      'treatment_model_run_failure',
      `update treatment.model_run set status = 'FAILED', rows = null where run_id = 'run-a'`,
    ],
    ['treatment_model_run_line', `update treatment.model_run set line = 1 where run_id = 'run-a'`],
  ] as const) {
    await assert.rejects(asOwner(statement), { constraint })
  }
})
