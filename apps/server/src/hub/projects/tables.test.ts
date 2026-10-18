import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTestDatabase } from '../../platform/test-database.ts'

const TS = 'timestamp with time zone'

test('catálogo: as colunas, os únicos e as restrições de Projeto e do banco da empresa', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const columns = await asOwner(
    `select table_name || '.' || column_name || ' ' || data_type || ' ' || is_nullable as "column"
       from information_schema.columns where table_schema = 'projects'
      order by table_name, ordinal_position`,
  )
  assert.deepEqual(
    columns.map((row) => row.column),
    [
      'company_database.company_id text NO',
      'company_database.state text NO',
      'company_database.neon_project_id text YES',
      `company_database.claimed_until ${TS} YES`,
      'project.id text NO',
      'project.company_id text NO',
      'project.name text NO',
      'project.attempt_key text NO',
      `project.created_at ${TS} NO`,
    ],
  )
  const constraints = await asOwner(
    `select conname as name, contype as type from pg_constraint
      where connamespace = 'projects'::regnamespace and contype <> 'n' order by conname`,
  )
  assert.deepEqual(constraints, [
    { name: 'company_database_creating_has_claim', type: 'c' },
    { name: 'company_database_neon_project_id_key', type: 'u' },
    { name: 'company_database_pkey', type: 'p' },
    { name: 'company_database_ready_has_project', type: 'c' },
    { name: 'company_database_state', type: 'c' },
    { name: 'project_company_id_attempt_key_key', type: 'u' },
    { name: 'project_name_length', type: 'c' },
    { name: 'project_pkey', type: 'p' },
  ])
  const index = await asOwner(
    `select indexdef from pg_indexes where indexname = 'project_company_name_key'`,
  )
  assert.deepEqual(index, [
    {
      indexdef:
        'CREATE UNIQUE INDEX project_company_name_key ON projects.project USING btree (company_id, lower((name COLLATE "und-x-icu")))',
    },
  ])
})

test('catálogo: as políticas de linha, e o mesmo nome em outra caixa é recusado só na mesma empresa', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const policies = await asOwner(
    `select tablename || ' ' || policyname || ' ' || roles::text || ' ' || cmd as policy
       from pg_policies where schemaname = 'projects' order by tablename, policyname`,
  )
  assert.deepEqual(
    policies.map((row) => row.policy),
    [
      'company_database company_all {hub_company} ALL',
      'company_database operator_delete {hub_operator} DELETE',
      'company_database operator_select {hub_operator} SELECT',
      'project company_all {hub_company} ALL',
      'project operator_delete {hub_operator} DELETE',
      'project operator_select {hub_operator} SELECT',
    ],
  )
  const secured = await asOwner(
    `select relname as name, relrowsecurity as secured from pg_class
      where relnamespace = 'projects'::regnamespace and relkind = 'r' order by relname`,
  )
  assert.deepEqual(secured, [
    { name: 'company_database', secured: true },
    { name: 'project', secured: true },
  ])
  function plant(id: string, company: string, name: string) {
    return asOwner(
      `insert into projects.project (id, company_id, name, attempt_key, created_at)
       values ($1, $2, $3, $1, now())`,
      [id, company, name],
    )
  }
  await plant('p1', 'c1', 'Ação')
  await assert.rejects(plant('p2', 'c1', 'AÇÃO'), { code: '23505' })
  await plant('p3', 'c2', 'AÇÃO')
})

test('catálogo: o banco da empresa pronto tem o projeto; o em criação tem o prazo, e só um deles', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  function plant(state: string, projectId: string | null, claimedUntil: string | null) {
    return asOwner(
      `insert into projects.company_database (company_id, state, neon_project_id, claimed_until)
       values (gen_random_uuid()::text, $1, $2, $3)`,
      [state, projectId, claimedUntil],
    )
  }
  const later = '2030-01-01T00:00:00Z'
  await plant('creating', null, later)
  await plant('ready', 'neon-1', null)
  for (const [state, projectId, claimedUntil] of [
    ['ready', null, null],
    ['ready', 'neon-2', later],
    ['creating', null, null],
    ['creating', 'neon-3', later],
    ['gone', 'neon-4', null],
  ] as const) {
    await assert.rejects(plant(state, projectId, claimedUntil), { code: '23514' }, state)
  }
  await assert.rejects(plant('ready', 'neon-1', null), { code: '23505' })
  await assert.rejects(
    asOwner(
      `insert into projects.project (id, company_id, name, attempt_key, created_at)
       values ('x', 'c1', $1, 'x', now())`,
      ['n'.repeat(101)],
    ),
    { code: '23514' },
  )
})

test('catálogo: num banco com LC_CTYPE=C, "Ação" e "AÇÃO" ainda são o mesmo nome', async (t) => {
  const { asOwner } = await createTestDatabase(t, 'C')
  function insert(id: string, name: string) {
    return asOwner(
      `insert into projects.project (id, company_id, name, attempt_key, created_at)
        values ($1, 'empresa', $2, $1, now())`,
      [id, name],
    )
  }
  await insert('um', 'Ação')
  await assert.rejects(insert('dois', 'AÇÃO'), { code: '23505' })
})
