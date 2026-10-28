import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTestDatabase } from '../../platform/test-database.ts'

const TS = 'timestamp with time zone'

test('catálogo: passagens e sessões de app, só hashes, presas à sessão do Hub; versões, arquivos e blobs', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const columns = await asOwner(
    `select table_name || '.' || column_name || ' ' || data_type || ' ' || is_nullable as "column"
       from information_schema.columns where table_schema = 'apps'
      order by table_name, ordinal_position`,
  )
  assert.deepEqual(
    columns.map((row) => row.column),
    [
      'app.project_id text NO',
      'app.company_id text NO',
      'app.live_version_id text YES',
      'app.sending_version_id text YES',
      `app.claimed_until ${TS} YES`,
      'app.database_ready boolean NO',
      'app.published_version_id text YES',
      'app_session.token_hash text NO',
      'app_session.host_label text NO',
      'app_session.person_id text NO',
      'app_session.company_id text NO',
      'app_session.project_id text NO',
      'app_session.hub_session_id text NO',
      'app_session.environment text NO',
      'app_version.id text NO',
      'app_version.company_id text NO',
      'app_version.project_id text NO',
      'app_version.number integer NO',
      'app_version.state text NO',
      'app_version.failure text YES',
      'app_version.manifest jsonb NO',
      'app_version.digest text NO',
      'app_version.sent_by text NO',
      'app_version.attempt_key text NO',
      `app_version.created_at ${TS} NO`,
      'blob.company_id text NO',
      'blob.sha256 text NO',
      'blob.bytes bytea NO',
      'handoff.code_hash text NO',
      'handoff.binding_hash text NO',
      'handoff.host_label text NO',
      'handoff.person_id text NO',
      'handoff.company_id text NO',
      'handoff.project_id text NO',
      'handoff.hub_session_id text NO',
      `handoff.expires_at ${TS} NO`,
      'handoff.environment text NO',
      'version_file.version_id text NO',
      'version_file.company_id text NO',
      'version_file.path text NO',
      'version_file.sha256 text NO',
      'version_file.size integer NO',
      'version_file.media_type text NO',
    ],
  )
  const constraints = await asOwner(
    `select conname as name, contype as type, confdeltype as "onDelete" from pg_constraint
      where connamespace = 'apps'::regnamespace and contype <> 'n' order by conname`,
  )
  assert.deepEqual(constraints, [
    { name: 'app_live_version_fkey', type: 'f', onDelete: 'a' },
    { name: 'app_pkey', type: 'p', onDelete: ' ' },
    { name: 'app_project_id_fkey', type: 'f', onDelete: 'c' },
    { name: 'app_published_version_fkey', type: 'f', onDelete: 'a' },
    { name: 'app_sending_has_claim', type: 'c', onDelete: ' ' },
    { name: 'app_sending_version_fkey', type: 'f', onDelete: 'a' },
    { name: 'app_session_environment', type: 'c', onDelete: ' ' },
    { name: 'app_session_hub_session_id_fkey', type: 'f', onDelete: 'c' },
    { name: 'app_session_pkey', type: 'p', onDelete: ' ' },
    { name: 'app_version_digest_form', type: 'c', onDelete: ' ' },
    { name: 'app_version_failed_has_failure', type: 'c', onDelete: ' ' },
    { name: 'app_version_number_positive', type: 'c', onDelete: ' ' },
    { name: 'app_version_pkey', type: 'p', onDelete: ' ' },
    { name: 'app_version_project_id_attempt_key_key', type: 'u', onDelete: ' ' },
    { name: 'app_version_project_id_fkey', type: 'f', onDelete: 'c' },
    { name: 'app_version_project_id_id_key', type: 'u', onDelete: ' ' },
    { name: 'app_version_project_id_number_key', type: 'u', onDelete: ' ' },
    { name: 'app_version_state', type: 'c', onDelete: ' ' },
    { name: 'blob_pkey', type: 'p', onDelete: ' ' },
    { name: 'blob_sha256_form', type: 'c', onDelete: ' ' },
    { name: 'blob_size', type: 'c', onDelete: ' ' },
    { name: 'handoff_environment', type: 'c', onDelete: ' ' },
    { name: 'handoff_hub_session_id_fkey', type: 'f', onDelete: 'c' },
    { name: 'handoff_pkey', type: 'p', onDelete: ' ' },
    { name: 'version_file_blob_fkey', type: 'f', onDelete: 'a' },
    { name: 'version_file_pkey', type: 'p', onDelete: ' ' },
    { name: 'version_file_size', type: 'c', onDelete: ' ' },
    { name: 'version_file_version_id_fkey', type: 'f', onDelete: 'c' },
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

test('catálogo: a versão da Prévia e a publicada são do Projeto, a que falhou diz por quê, e um blob em uso fica', async (t) => {
  const { asOwner } = await createTestDatabase(t)
  const sha = 'a'.repeat(64)
  await asOwner(`
    insert into projects.project(id, company_id, name, attempt_key, created_at) values
      ('p1', 'c1', 'Pedidos', 'k1', now()), ('p2', 'c1', 'Vendas', 'k2', now());
    insert into apps.app(project_id, company_id) values ('p1', 'c1'), ('p2', 'c1');
    insert into apps.blob(company_id, sha256, bytes) values ('c1', '${sha}', '\\x01');
    insert into apps.app_version(id, company_id, project_id, number, state, manifest, digest,
      sent_by, attempt_key, created_at) values ('v1', 'c1', 'p1', 1, 'ready', '{}', '${sha}', 'x', 'k1', now());
    insert into apps.version_file(version_id, company_id, path, sha256, size, media_type)
      values ('v1', 'c1', 'worker.js', '${sha}', 1, 'text/javascript');`)
  await assert.rejects(
    asOwner(`update apps.app set live_version_id = 'v1' where project_id = 'p2'`),
    { code: '23503' },
  )
  await assert.rejects(
    asOwner(`update apps.app set published_version_id = 'v1' where project_id = 'p2'`),
    { code: '23503' },
  )
  await asOwner(`update apps.app set live_version_id = 'v1' where project_id = 'p1'`)
  await asOwner(`update apps.app set published_version_id = 'v1' where project_id = 'p1'`)
  await assert.rejects(
    asOwner(`update apps.app set sending_version_id = 'v1' where project_id = 'p1'`),
    { code: '23514' },
  )
  await assert.rejects(asOwner(`update apps.app_version set state = 'failed'`), { code: '23514' })
  await asOwner(`update apps.app_version set state = 'failed', failure = 'APP_VERSION_FAILED'`)
  await assert.rejects(asOwner(`delete from apps.blob`), { code: '23503' })
  await assert.rejects(
    asOwner(`insert into apps.app_version(id, company_id, project_id, number, state, manifest,
      digest, sent_by, attempt_key, created_at) values ('v2', 'c1', 'p1', 1, 'ready', '{}', '${sha}', 'x', 'k2', now())`),
    { code: '23505' },
  )
  await asOwner(`delete from projects.project where id = 'p1'`)
  assert.deepEqual(await asOwner(`select count(*)::int as n from apps.version_file`), [{ n: 0 }])
  await asOwner(`delete from apps.blob`)
})
