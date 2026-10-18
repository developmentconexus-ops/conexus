import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createTestDatabase,
  serveEnvironment,
  startHub,
  urlFile,
} from '../../platform/test-database.ts'

test('catálogo: o esquema auth tem as tabelas da biblioteca e as três do plugin de organização', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const tables = await asOwner(
    `select table_name as name from information_schema.tables
      where table_schema = 'auth' order by table_name`,
  )
  assert.deepEqual(
    tables.map((row) => row.name),
    ['account', 'company', 'invitation', 'member', 'rate_limit', 'session', 'user', 'verification'],
  )
})

test('catálogo: as colunas de empresa, membro e convite, e as dos plugins em pessoa e sessão', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const columns = await asOwner(
    `select table_name || '.' || column_name || ' ' || data_type || ' ' || is_nullable
              || coalesce(' default ' || column_default, '') as "column"
       from information_schema.columns
      where table_schema = 'auth'
        and (table_name in ('company', 'member', 'invitation')
          or column_name in ('role', 'banned', 'ban_reason', 'ban_expires',
                             'active_organization_id', 'impersonated_by'))
      order by table_name, ordinal_position`,
  )
  const ts = 'timestamp with time zone'
  assert.deepEqual(
    columns.map((row) => row.column),
    [
      'company.id text NO',
      'company.name text NO',
      'company.slug text NO',
      'company.logo text YES',
      'company.metadata text YES',
      `company.created_at ${ts} NO`,
      'company.attempt_key text NO',
      `company.deleting_since ${ts} YES`,
      'invitation.id text NO',
      'invitation.company_id text NO',
      'invitation.email text NO',
      'invitation.role text YES',
      'invitation.status text NO',
      `invitation.expires_at ${ts} NO`,
      `invitation.created_at ${ts} NO`,
      'invitation.inviter_id text NO',
      'invitation.attempt_key text NO',
      `invitation.mailed_at ${ts} YES`,
      'invitation.revision integer NO default 0',
      `invitation.superseded_at ${ts} YES`,
      'invitation.replaces jsonb YES',
      'member.id text NO',
      'member.company_id text NO',
      'member.user_id text NO',
      'member.role text NO',
      `member.created_at ${ts} NO`,
      'session.active_organization_id text YES',
      'session.impersonated_by text YES',
      'user.role text YES',
      'user.banned boolean YES default false',
      'user.ban_reason text YES',
      `user.ban_expires ${ts} YES`,
    ],
  )
})

test('catálogo: os únicos, as chaves estrangeiras RESTRICT das novas tabelas e toda data em timestamptz', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const unique = await asOwner(
    `select tc.table_name || ' ' || string_agg(kcu.column_name, ',' order by kcu.ordinal_position)
              as "unique"
       from information_schema.table_constraints tc
       join information_schema.key_column_usage kcu using (constraint_schema, constraint_name)
      where tc.constraint_schema = 'auth' and tc.constraint_type = 'UNIQUE'
      group by tc.constraint_name, tc.table_name order by 1`,
  )
  assert.deepEqual(
    unique.map((row) => row.unique),
    [
      'company attempt_key',
      'company slug',
      'invitation company_id,attempt_key',
      'member company_id,user_id',
      'rate_limit key',
      'session token',
      'user email',
    ],
  )
  const pending = await asOwner(
    `select indexdef from pg_indexes where indexname = 'invitation_pending_email_key'`,
  )
  assert.deepEqual(pending, [
    {
      indexdef:
        "CREATE UNIQUE INDEX invitation_pending_email_key ON auth.invitation USING btree (company_id, lower(email)) WHERE (status = 'pending'::text)",
    },
  ])
  const keys = await asOwner(
    `select tc.table_name || '.' || kcu.column_name || ' ' || rc.delete_rule as "key"
       from information_schema.referential_constraints rc
       join information_schema.table_constraints tc using (constraint_schema, constraint_name)
       join information_schema.key_column_usage kcu using (constraint_schema, constraint_name)
      where rc.constraint_schema = 'auth' order by 1`,
  )
  assert.deepEqual(
    keys.map((row) => row.key),
    [
      'account.user_id CASCADE',
      'invitation.company_id RESTRICT',
      'invitation.inviter_id RESTRICT',
      'member.company_id RESTRICT',
      'member.user_id RESTRICT',
      'session.user_id CASCADE',
    ],
  )
  const dates = await asOwner(
    `select data_type as type, count(*)::int as columns from information_schema.columns
      where table_schema = 'auth' and data_type like 'timestamp%' group by data_type`,
  )
  assert.deepEqual(dates, [{ type: 'timestamp with time zone', columns: 20 }])
})

test('catálogo: um só convite pendente por empresa e endereço, em qualquer caixa; o cancelado não conta', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(`insert into auth.user (id, name, email) values ('p1', 'Ana', 'ana@example.test');
    insert into auth.company (id, name, slug, created_at, attempt_key)
      values ('c1', 'Empresa', 'k1', now(), 'k1')`)
  function invite(id: string, email: string, status: string) {
    return asOwner(
      `insert into auth.invitation
         (id, company_id, email, role, status, expires_at, created_at, inviter_id, attempt_key)
       values ($1, 'c1', $2, 'member', $3, now(), now(), 'p1', $1)`,
      [id, email, status],
    )
  }
  await invite('i1', 'bruno@example.test', 'pending')
  await assert.rejects(invite('i2', 'Bruno@Example.test', 'pending'), { code: '23505' })
  await invite('i3', 'bruno@example.test', 'canceled')
  await asOwner(`update auth.invitation set status = 'canceled' where id = 'i1'`)
  await invite('i4', 'bruno@example.test', 'pending')
})

for (const [name, adminBefore, expected] of [
  [
    'ninguém é administrador: a pessoa mais antiga passa a ser',
    undefined,
    ['ana admin', 'bruno -'],
  ],
  ['já há um administrador: nada muda', 'bruno', ['ana -', 'bruno admin']],
] as const) {
  test(`administrador: depois de migrate, ${name}`, async (t) => {
    const test = await createTestDatabase(t)
    await test.asOwner(`insert into auth.user (id, name, email, created_at)
      values ('ana', 'Ana', 'ana@example.test', now() - interval '1 day'),
             ('bruno', 'Bruno', 'bruno@example.test', now())`)
    if (adminBefore !== undefined) {
      await test.asOwner(`update auth.user set role = 'admin' where id = $1`, [adminBefore])
    }
    await test.asOwner(
      `delete from drizzle.__drizzle_migrations where name like '%installation_admin'`,
    )
    const migrate = startHub(
      t,
      {
        ...serveEnvironment(t, test.runtimeUrl, 1),
        HUB_MIGRATION_DATABASE_URL_FILE: urlFile(t, test.ownerUrl),
      },
      ['migrate'],
    )
    assert.equal(await migrate.exited, 0)
    const roles = await test.asOwner(
      `select id || ' ' || coalesce(role, '-') as person from auth.user order by id`,
    )
    assert.deepEqual(
      roles.map((row) => row.person),
      expected,
    )
  })
}
