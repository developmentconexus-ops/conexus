import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, InvitationId, PersonId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
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
      'app_access.company_id text NO',
      'app_access.project_id text NO',
      'app_access.person_id text NO',
      'app_access.role text YES',
      `app_access.granted_at ${TS} NO`,
      'company_database.company_id text NO',
      'company_database.state text NO',
      'company_database.neon_project_id text YES',
      `company_database.claimed_until ${TS} YES`,
      'company_database.host text YES',
      'project.id text NO',
      'project.company_id text NO',
      'project.name text NO',
      'project.attempt_key text NO',
      `project.created_at ${TS} NO`,
      'project.host_label text YES',
      `project.deleting_since ${TS} YES`,
    ],
  )
  const constraints = await asOwner(
    `select conname as name, contype as type from pg_constraint
      where connamespace = 'projects'::regnamespace and contype <> 'n' order by conname`,
  )
  assert.deepEqual(constraints, [
    { name: 'app_access_company_id_project_id_fkey', type: 'f' },
    { name: 'app_access_pkey', type: 'p' },
    { name: 'company_database_creating_has_claim', type: 'c' },
    { name: 'company_database_neon_project_id_key', type: 'u' },
    { name: 'company_database_pkey', type: 'p' },
    { name: 'company_database_ready_has_project', type: 'c' },
    { name: 'company_database_state', type: 'c' },
    { name: 'project_company_id_attempt_key_key', type: 'u' },
    { name: 'project_company_id_id_key', type: 'u' },
    { name: 'project_host_label_form', type: 'c' },
    { name: 'project_host_label_key', type: 'u' },
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
      'app_access app_people_select {hub_app_people} SELECT',
      'app_access company_all {hub_company} ALL',
      'app_access invitation_insert {hub_invitation} INSERT',
      'app_access invitation_select {hub_invitation} SELECT',
      'company_database company_all {hub_company} ALL',
      'company_database operator_delete {hub_operator} DELETE',
      'company_database operator_select {hub_operator} SELECT',
      'project app_people_select {hub_app_people} SELECT',
      'project company_all {hub_company} ALL',
      'project hosts_select {hub_hosts} SELECT',
      'project invitation_select {hub_invitation} SELECT',
      'project operator_delete {hub_operator} DELETE',
      'project operator_select {hub_operator} SELECT',
    ],
  )
  const secured = await asOwner(
    `select relname as name, relrowsecurity as secured from pg_class
      where relnamespace = 'projects'::regnamespace and relkind = 'r' order by relname`,
  )
  assert.deepEqual(secured, [
    { name: 'app_access', secured: true },
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

const A = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const B = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')
const ANA = PersonId.parse('person-a')
const BRUNO = PersonId.parse('person-b')
const CARLA = PersonId.parse('person-carla')
const DAVI = PersonId.parse('person-davi')
const INVITATION = InvitationId.parse('invitationAAAAAAAAAAAAAAAAAAAAAA')

const SEED = `
  insert into auth."user"(id, name, email) values
    ('person-a', 'Ana', 'ana@example.test'), ('person-b', 'Bruno', 'bruno@example.test'),
    ('person-carla', 'Carla', 'carla@example.test'), ('person-davi', 'Davi', 'davi@example.test');
  insert into auth.company(id, name, slug, created_at, attempt_key) values
    ('companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'Padaria Sol', 'key-a', now(), 'key-a'),
    ('companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'Loja Lua', 'key-b', now(), 'key-b');
  insert into auth.member(id, company_id, user_id, role, created_at) values
    ('member-a', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'person-a', 'owner', now()),
    ('member-b', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'person-b', 'owner', now());
  insert into projects.project(id, company_id, name, attempt_key, created_at, host_label) values
    ('projectA1AAAAAAAAAAAAAAAAAAAAAAA', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'Encomendas', 'a1', now(), 'encomendas--sol'),
    ('projectA2AAAAAAAAAAAAAAAAAAAAAAA', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'Estoque', 'a2', now(), 'estoque--sol'),
    ('projectB1BBBBBBBBBBBBBBBBBBBBBBB', 'companyBBBBBBBBBBBBBBBBBBBBBBBBB', 'Vendas', 'b1', now(), 'vendas--lua');
  insert into auth.invitation(id, company_id, email, role, project_id, app_role, status, expires_at,
    created_at, inviter_id, attempt_key) values
    ('invitationAAAAAAAAAAAAAAAAAAAAAA', 'companyAAAAAAAAAAAAAAAAAAAAAAAAA', 'carla@example.test', null,
      'projectA1AAAAAAAAAAAAAAAAAAAAAAA', 'vendedor', 'pending', now() + interval '1 day', now(), 'person-a', 'attempt-a');`

function grant(project: string, company: string, person: string, role: string | null = 'vendedor') {
  return sql`insert into projects.app_access(company_id, project_id, person_id, role)
    values (${company}, ${project}, ${person}, ${role})`
}

function refusedWith(sqlstate: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Error && error.cause instanceof Error && 'code' in error.cause)
    assert.equal(error.cause.code, sqlstate)
    return true
  }
}

const IN_A = { kind: 'COMPANY', companyId: A, personId: ANA } as const
const IN_B = { kind: 'COMPANY', companyId: B, personId: BRUNO } as const
const INVITED = { kind: 'INVITATION', invitationId: INVITATION, personId: null } as const

async function seeded(t: Parameters<typeof createTestDatabase>[0]) {
  const test = await createTestDatabase(t)
  await test.asOwner(SEED)
  return test
}

async function appsOfPerson(
  database: Awaited<ReturnType<typeof seeded>>['database'],
  person: PersonId,
) {
  const rows = await database.installationRead(
    async (tx) =>
      (
        await tx.execute(
          sql`select * from projects.apps_of_person(${person}) order by project_name`,
        )
      ).rows,
  )
  return rows.map((row) => ({
    projectName: row.project_name,
    companyName: row.company_name,
    hostLabel: row.host_label,
  }))
}

function readAs(
  database: Awaited<ReturnType<typeof seeded>>['database'],
  scope: typeof IN_A | typeof IN_B,
  query: ReturnType<typeof sql>,
) {
  return database.read(scope, async (tx) => (await tx.execute(query)).rows)
}

test('o acesso a um app: uma linha por pessoa, some com o Projeto, cada empresa as suas', async (t) => {
  const { asOwner, database } = await seeded(t)
  await database.command(IN_A, (tx) =>
    tx.execute(grant('projectA1AAAAAAAAAAAAAAAAAAAAAAA', A, CARLA)),
  )
  await database.command(IN_B, (tx) =>
    tx.execute(grant('projectB1BBBBBBBBBBBBBBBBBBBBBBB', B, DAVI)),
  )
  await assert.rejects(
    database.command(IN_A, (tx) =>
      tx.execute(grant('projectA1AAAAAAAAAAAAAAAAAAAAAAA', A, CARLA, 'gerente')),
    ),
    refusedWith('23505'),
  )
  const people = sql`select person_id from projects.app_access`
  assert.deepEqual(await readAs(database, IN_A, people), [{ person_id: CARLA }])
  assert.deepEqual(await readAs(database, IN_B, people), [{ person_id: DAVI }])
  await assert.rejects(
    database.command(IN_A, (tx) => tx.execute(grant('projectB1BBBBBBBBBBBBBBBBBBBBBBB', B, CARLA))),
    refusedWith('42501'),
  )
  await assert.rejects(
    database.command(IN_A, (tx) => tx.execute(grant('projectB1BBBBBBBBBBBBBBBBBBBBBBB', A, CARLA))),
    refusedWith('23503'),
  )
  assert.deepEqual(
    (await appsOfPerson(database, CARLA)).map((app) => app.projectName),
    ['Encomendas'],
  )
  assert.deepEqual(
    await readAs(database, IN_A, sql`select name, email from auth."user" order by name`),
    [
      { name: 'Ana', email: 'ana@example.test' },
      { name: 'Carla', email: 'carla@example.test' },
    ],
  )
  await asOwner(`delete from projects.project where id = 'projectA1AAAAAAAAAAAAAAAAAAAAAAA'`)
  assert.deepEqual(await readAs(database, IN_A, people), [])
  assert.deepEqual(await readAs(database, IN_B, people), [{ person_id: DAVI }])
})

test('o acesso a um app: o convite escreve só a linha que nomeia', async (t) => {
  const { database } = await seeded(t)
  for (const [project, company, person, role] of [
    ['projectA2AAAAAAAAAAAAAAAAAAAAAAA', A, CARLA, 'vendedor'],
    ['projectA1AAAAAAAAAAAAAAAAAAAAAAA', A, CARLA, 'gerente'],
    ['projectA1AAAAAAAAAAAAAAAAAAAAAAA', A, DAVI, 'vendedor'],
    ['projectB1BBBBBBBBBBBBBBBBBBBBBBB', B, CARLA, 'vendedor'],
  ] as const) {
    await assert.rejects(
      database.command(INVITED, (tx) => tx.execute(grant(project, company, person, role))),
      refusedWith('42501'),
      `${project} ${person} ${role}`,
    )
  }
  await database.command(INVITED, (tx) =>
    tx.execute(grant('projectA1AAAAAAAAAAAAAAAAAAAAAAA', A, CARLA)),
  )
  const mine = await database.read(
    INVITED,
    async (tx) => (await tx.execute(sql`select person_id from projects.app_access`)).rows,
  )
  assert.deepEqual(mine, [{ person_id: CARLA }])
})

test('o acesso a um app: a função dá à pessoa só os seus, sem Projeto apagado nem empresa marcada', async (t) => {
  const { asOwner, database } = await seeded(t)
  await asOwner(
    `insert into projects.app_access(company_id, project_id, person_id, role) values
      ('${A}', 'projectA1AAAAAAAAAAAAAAAAAAAAAAA', '${CARLA}', 'vendedor'), ('${A}', 'projectA2AAAAAAAAAAAAAAAAAAAAAAA', '${CARLA}', null),
      ('${B}', 'projectB1BBBBBBBBBBBBBBBBBBBBBBB', '${CARLA}', 'x'), ('${B}', 'projectB1BBBBBBBBBBBBBBBBBBBBBBB', '${DAVI}', 'x')`,
  )
  await asOwner(
    `update projects.project set deleting_since = now() where id = 'projectA2AAAAAAAAAAAAAAAAAAAAAAA'`,
  )
  assert.deepEqual(await appsOfPerson(database, CARLA), [
    {
      projectName: 'Encomendas',
      companyName: 'Padaria Sol',
      hostLabel: 'encomendas--sol',
    },
    {
      projectName: 'Vendas',
      companyName: 'Loja Lua',
      hostLabel: 'vendas--lua',
    },
  ])
  assert.deepEqual(await appsOfPerson(database, ANA), [])
  await asOwner(`update auth.company set deleting_since = now() where id = '${B}'`)
  const left = await appsOfPerson(database, CARLA)
  assert.deepEqual(
    left.map((app) => app.projectName),
    ['Encomendas'],
  )
})
