import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { createTestDatabase } from '../../platform/test-database.ts'

const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const OPERATOR = PersonId.parse('person-op')

const SEED = `
  insert into auth."user"(id, name, email, role) values
    ('person-a', 'Ana', 'ana@example.test', null),
    ('person-op', 'Operadora', 'op@example.test', 'admin');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('${A}', 'Padaria Sol', 'key-a', now(), 'key-a'),
    ('${B}', 'Loja Lua', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', '${A}', 'person-a', 'owner', now());`

const SHA = 'a'.repeat(64)
const ACCOUNT = '123456789012'

function lakeRow(
  company: string,
  lakeId: string,
  state: string,
  stackId: string | null,
  failure: string | null = null,
) {
  return sql`insert into lake.company_lake
      (company_id, lake_id, state, account, region, template, stack_id, since, failure)
    values (${company}, ${lakeId}, ${state}, ${ACCOUNT}, 'us-east-2', ${SHA}, ${stackId}, now(), ${failure})`
}

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

function operator(personId: PersonId) {
  return { kind: 'OPERATOR', personId, companyId: A } as const
}
const IN_A = { kind: 'COMPANY', companyId: A, personId: ANA } as const

async function seeded(t: Parameters<typeof createTestDatabase>[0]) {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  return test
}

test('cada regra recusa a linha errada', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  function plant(
    lakeId: string,
    state: string,
    stackId: string | null,
    failure: string | null = null,
    company: string = crypto.randomUUID(),
  ) {
    return asOwner(
      `insert into lake.company_lake
         (company_id, lake_id, state, account, region, template, stack_id, since, failure)
       values ($1, $2, $3, '${ACCOUNT}', 'us-east-2', '${SHA}', $4, now(), $5)`,
      [company, lakeId, state, stackId, failure],
    )
  }
  await plant('abcdefghij12', 'creating', null)
  await plant('abcdefghij13', 'failed', null, 'LAKE_CREATE_FAILED')
  await plant('abcdefghij14', 'ready', 'stack-1')
  await plant('abcdefghij15', 'deleting', 'stack-2')
  await plant('abcdefghij16', 'delete_failed', 'stack-3')

  for (const lakeId of ['ABCDEFGHIJ12', 'abcdefghij1', 'abcdefghij123', 'abcdefghij-2']) {
    await assert.rejects(plant(lakeId, 'creating', null), { code: '23514' }, lakeId)
  }
  await assert.rejects(plant('abcdefghij12', 'creating', null), { code: '23505' }, 'mesmo lago')
  await assert.rejects(plant('abcdefghij17', 'ready', 'stack-1'), { code: '23505' }, 'mesma pilha')
  await assert.rejects(plant('abcdefghij18', 'gone', null), { code: '23514' }, 'estado')
  await assert.rejects(plant('abcdefghij19', 'failed', null), { code: '23514' }, 'failed sem falha')
  for (const state of ['creating', 'ready', 'deleting', 'delete_failed']) {
    const stack = state === 'creating' ? null : `stack-${state}`
    await assert.rejects(
      plant('abcdefghij20', state, stack, 'LAKE_CREATE_FAILED'),
      { code: '23514' },
      `${state} com falha`,
    )
  }
  await assert.rejects(
    plant('abcdefghij21', 'failed', null, 'OUTRO_CODIGO'),
    { code: '23514' },
    'falha de outro código',
  )
  for (const state of ['ready', 'deleting', 'delete_failed']) {
    await assert.rejects(
      plant('abcdefghij22', state, null),
      { code: '23514' },
      `${state} sem pilha`,
    )
  }
  for (const [column, value] of [
    ['account', '12345'],
    ['region', 'useast2'],
    ['template', 'xyz'],
  ] as const) {
    await assert.rejects(
      asOwner(
        `insert into lake.company_lake
           (company_id, lake_id, state, account, region, template, since)
         values ('x', 'abcdefghij23', 'creating',
           ${column === 'account' ? `'${value}'` : `'${ACCOUNT}'`},
           ${column === 'region' ? `'${value}'` : `'us-east-2'`},
           ${column === 'template' ? `'${value}'` : `'${SHA}'`}, now())`,
      ),
      { code: '23514' },
      column,
    )
  }
})

test('o operador lê, grava, muda o estado e apaga a linha; não muda a empresa, a conta nem a região', async (t) => {
  const { database, asOwner } = await seeded(t)
  const as = operator(OPERATOR)
  await database.command(as, (tx) => tx.execute(lakeRow(A, 'abcdefghij12', 'creating', null)))
  assert.deepEqual(
    await database.read(
      as,
      async (tx) => (await tx.execute(sql`select lake_id, state from lake.company_lake`)).rows,
    ),
    [{ lake_id: 'abcdefghij12', state: 'creating' }],
  )
  await database.command(as, (tx) =>
    tx.execute(sql`update lake.company_lake
      set state = 'ready', stack_id = 'stack-1', since = now() where company_id = ${A}`),
  )
  assert.deepEqual(await asOwner(`select state, stack_id from lake.company_lake`), [
    { state: 'ready', stack_id: 'stack-1' },
  ])
  for (const column of ['company_id', 'account', 'region']) {
    await assert.rejects(
      database.command(as, (tx) =>
        tx.execute(sql.raw(`update lake.company_lake set ${column} = ${column}`)),
      ),
      refusedWith('42501'),
      column,
    )
  }
  await database.command(as, (tx) =>
    tx.execute(sql`delete from lake.company_lake where company_id = ${A}`),
  )
  assert.deepEqual(await asOwner(`select count(*)::int as n from lake.company_lake`), [{ n: 0 }])
})

test('o operador sem papel de administrador não vê nem grava o lago', async (t) => {
  const { database, asOwner } = await seeded(t)
  await asOwner(
    `insert into lake.company_lake
       (company_id, lake_id, state, account, region, template, since)
     values ('${A}', 'abcdefghij12', 'creating', '${ACCOUNT}', 'us-east-2', '${SHA}', now())`,
  )
  const plain = operator(ANA)
  assert.deepEqual(
    await database.read(
      plain,
      async (tx) => (await tx.execute(sql`select company_id from lake.company_lake`)).rows,
    ),
    [],
  )
  await assert.rejects(
    database.command(plain, (tx) => tx.execute(lakeRow(B, 'abcdefghij13', 'creating', null))),
    refusedWith('42501'),
  )
  await database.command(plain, (tx) =>
    tx.execute(sql`delete from lake.company_lake where company_id = ${A}`),
  )
  assert.deepEqual(await asOwner(`select count(*)::int as n from lake.company_lake`), [{ n: 1 }])
})

test('a empresa lê a sua linha', async (t) => {
  const { database, asOwner } = await seeded(t)
  await asOwner(
    `insert into lake.company_lake
       (company_id, lake_id, state, account, region, template, stack_id, since)
     values ('${A}', 'abcdefghij12', 'ready', '${ACCOUNT}', 'us-east-2', '${SHA}', 'stack-1', now()),
            ('${B}', 'abcdefghij13', 'creating', '${ACCOUNT}', 'us-east-2', '${SHA}', null, now())`,
  )
  assert.deepEqual(
    await database.read(
      IN_A,
      async (tx) =>
        (
          await tx.execute(
            sql`select company_id, lake_id, state, account, region, template from lake.company_lake`,
          )
        ).rows,
    ),
    [
      {
        company_id: A,
        lake_id: 'abcdefghij12',
        state: 'ready',
        account: ACCOUNT,
        region: 'us-east-2',
        template: SHA,
      },
    ],
  )
  for (const read of [
    sql`select stack_id from lake.company_lake`,
    sql`select since from lake.company_lake`,
    sql`select failure from lake.company_lake`,
    sql`select * from lake.company_lake`,
  ]) {
    await assert.rejects(
      database.read(IN_A, (tx) => tx.execute(read)),
      refusedWith('42501'),
    )
  }
  for (const write of [
    lakeRow(A, 'abcdefghij14', 'creating', null),
    sql`update lake.company_lake set state = 'failed' where company_id = ${A}`,
    sql`delete from lake.company_lake where company_id = ${A}`,
  ]) {
    await assert.rejects(
      database.command(IN_A, (tx) => tx.execute(write)),
      refusedWith('42501'),
    )
  }
  assert.deepEqual(
    await asOwner(`select company_id, state from lake.company_lake order by company_id`),
    [
      { company_id: A, state: 'ready' },
      { company_id: B, state: 'creating' },
    ],
  )
})

test('o catálogo do lago: as colunas, as políticas e a segurança por linha', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  assert.deepEqual(
    (
      await asOwner(
        `select column_name || ' ' || data_type || ' ' || is_nullable as "column"
           from information_schema.columns where table_schema = 'lake' and table_name = 'company_lake'
          order by ordinal_position`,
      )
    ).map((row) => row.column),
    [
      'company_id text NO',
      'lake_id text NO',
      'state text NO',
      'account text NO',
      'region text NO',
      'template text NO',
      'stack_id text YES',
      'since timestamp with time zone NO',
      'failure text YES',
    ],
  )
  assert.deepEqual(
    (
      await asOwner(
        `select policyname || ' ' || roles::text || ' ' || cmd as policy
           from pg_policies where schemaname = 'lake' order by policyname`,
      )
    ).map((row) => row.policy),
    [
      'company_select {hub_company} SELECT',
      'operator_delete {hub_operator} DELETE',
      'operator_insert {hub_operator} INSERT',
      'operator_select {hub_operator} SELECT',
      'operator_update {hub_operator} UPDATE',
    ],
  )
  assert.deepEqual(
    await asOwner(
      `select relrowsecurity as secured from pg_class where oid = 'lake.company_lake'::regclass`,
    ),
    [{ secured: true }],
  )
})

test('o operador só apaga o lago da empresa do escopo; quem não é administrador não muda nem apaga linha nenhuma', async (t) => {
  const { database, asOwner } = await seeded(t)
  await asOwner(
    `insert into lake.company_lake
       (company_id, lake_id, state, account, region, template, since)
     values ('${A}', 'abcdefghij12', 'creating', '${ACCOUNT}', 'us-east-2', '${SHA}', now()),
            ('${B}', 'abcdefghij13', 'creating', '${ACCOUNT}', 'us-east-2', '${SHA}', now())`,
  )
  const rows = `select company_id, since from lake.company_lake order by company_id`
  const before = await asOwner(rows)
  // The administrator in A's scope reaches B's row to read, never to delete (review of PR 1239, M1).
  await database.command(operator(OPERATOR), (tx) =>
    tx.execute(sql`delete from lake.company_lake where company_id = ${B}`),
  )
  assert.deepEqual(await asOwner(rows), before)
  // With no WHERE the SELECT policy hides nothing, so only the administrator test stops them (M10, M11).
  const plain = operator(ANA)
  await database.command(plain, (tx) =>
    tx.execute(sql`update lake.company_lake set since = now() + interval '1 day'`),
  )
  await database.command(plain, (tx) => tx.execute(sql`delete from lake.company_lake`))
  assert.deepEqual(await asOwner(rows), before)
})
