import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTestDatabase } from '../../platform/test-database.ts'

const TS = 'timestamp with time zone'

test('catálogo: passagens e sessões de app, só hashes, presas à sessão do Hub', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const columns = await asOwner(
    `select table_name || '.' || column_name || ' ' || data_type || ' ' || is_nullable as "column"
       from information_schema.columns where table_schema = 'apps'
      order by table_name, ordinal_position`,
  )
  assert.deepEqual(
    columns.map((row) => row.column),
    [
      'app_session.token_hash text NO',
      'app_session.host_label text NO',
      'app_session.person_id text NO',
      'app_session.company_id text NO',
      'app_session.project_id text NO',
      'app_session.hub_session_id text NO',
      'handoff.code_hash text NO',
      'handoff.binding_hash text NO',
      'handoff.host_label text NO',
      'handoff.person_id text NO',
      'handoff.company_id text NO',
      'handoff.project_id text NO',
      'handoff.hub_session_id text NO',
      `handoff.expires_at ${TS} NO`,
    ],
  )
  const constraints = await asOwner(
    `select conname as name, contype as type, confdeltype as "onDelete" from pg_constraint
      where connamespace = 'apps'::regnamespace and contype <> 'n' order by conname`,
  )
  assert.deepEqual(constraints, [
    { name: 'app_session_hub_session_id_fkey', type: 'f', onDelete: 'c' },
    { name: 'app_session_pkey', type: 'p', onDelete: ' ' },
    { name: 'handoff_hub_session_id_fkey', type: 'f', onDelete: 'c' },
    { name: 'handoff_pkey', type: 'p', onDelete: ' ' },
  ])
})

test('catálogo: apelido e endereço só na forma de um nome de host', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  await asOwner(`insert into auth.company(id, name, slug, created_at, attempt_key)
    values ('c1', 'Empresa', 'k1', now(), 'k1')`)
  function name(nickname: string) {
    return asOwner(`update auth.company set nickname = $1 where id = 'c1'`, [nickname])
  }
  for (const refused of ['ab', 'Empresa-a', '-empresa', 'empresa-', 'emp--resa', 'a'.repeat(31)]) {
    await assert.rejects(name(refused), { code: '23514' }, refused)
  }
  await name('empresa-a')
  function address(id: string, label: string) {
    return asOwner(
      `insert into projects.project (id, company_id, name, attempt_key, created_at, host_label)
       values ($1, 'c1', $1, $1, now(), $2)`,
      [id, label],
    )
  }
  for (const refused of [
    'pedidos-empresa-a',
    'a--b--c',
    '--empresa-a',
    `${'p'.repeat(53)}--empresa-a`,
  ]) {
    await assert.rejects(address(refused, refused), { code: '23514' }, refused)
  }
  await address('p1', `${'p'.repeat(52)}--empresa-a`)
})
