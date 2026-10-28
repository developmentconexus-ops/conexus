import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { appLogin, ProjectId } from '@conexus/hub-api'
import {
  appLoginsOf,
  appLoginTimeoutsOf,
  appTablesOf,
  forgetApp,
  pgTransport,
} from '../../platform/test-company-postgres.ts'
import { whenIdle } from '../../platform/test-database.ts'
import { call, post } from '../identity/test-hub.ts'
import {
  companyForVersions,
  folder,
  listed,
  MIGRATION,
  send,
  versionNumbered,
} from './test-versions.ts'

test('reparo: Worker que falta e esquema, logins e migrações da versão no ar voltam; "enviando" vencida falha', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, owner, projectId, projects } = subject
  const live = await versionNumbered(subject, (await send(subject, ana)).number)
  // Cloudflare lost the Worker, and a restore of the company's database took the app's schema.
  await hub.cloudflare.cloudflare.remove(`v-${live.id}`)
  const id = ProjectId.parse(projectId)
  assert.equal(await forgetApp(owner, id, hub.config.appLoginKey), 'DONE')
  // A send whose holder died: its claim passed.
  const estoque = Object(
    Object((await post(hub, ana, projects, { name: 'Estoque' })).json()).project,
  )
  await hub.test.asOwner(
    `insert into apps.app (project_id, company_id, sending_version_id, claimed_until)
     select $1, company_id, null, null from apps.app limit 1`,
    [estoque.id],
  )
  await hub.test.asOwner(
    `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     select $2, company_id, $1, 1, 'sending', '{}', repeat('0', 64), 'x', 'k', now()
       from apps.app where project_id = $1`,
    [estoque.id, 'd'.repeat(32)],
  )
  await hub.test.asOwner(
    `update apps.app set sending_version_id = $2, claimed_until = now() - interval '1 second'
      where project_id = $1`,
    [estoque.id, 'd'.repeat(32)],
  )
  await hub.repair()
  // The repair runs alone at start; after it no connection stays, so the database can sleep (D27).
  await whenIdle(hub.test.database)
  assert.deepEqual(hub.cloudflare.workers(), [`v-${live.id}`])
  const restored = hub.cloudflare.upload(`v-${live.id}`)
  assert.deepEqual(
    restored?.files.map((file) => file.path).sort(),
    folder()
      .files.map((file) => file.path)
      .sort(),
  )
  assert.deepEqual(await appTablesOf(owner, id), {
    tables: ['conexus_migration', 'recado'],
    ledger: [MIGRATION.id],
  })
  const [failed] = await hub.test.asOwner(
    'select state, failure from apps.app_version where id = $1',
    ['d'.repeat(32)],
  )
  assert.deepEqual(failed, { state: 'failed', failure: 'APP_VERSION_FAILED' })
})

test('reparo: os logins da etapa 9 ganham os prazos da chamada só no login de execução', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, owner, projectId } = subject
  assert.equal((await send(subject, ana)).preview?.state, 'ready')
  const id = ProjectId.parse(projectId)
  const { runLogin, migrateLogin } = appLogin(id)
  const [run, migrate] = [runLogin, migrateLogin].map((login) => `"${login}"`)
  // As step 9 made them: a statement timeout on both, no transaction timeout.
  const stepNine = await pgTransport(
    owner,
    [
      { text: `ALTER ROLE ${run} RESET transaction_timeout` },
      { text: `ALTER ROLE ${migrate} SET statement_timeout = '5s'` },
    ],
    AbortSignal.timeout(5_000),
  )
  assert.equal(stepNine.kind, 'DONE')
  await hub.repair()
  assert.deepEqual(await appLoginTimeoutsOf(owner, id), {
    run: ['statement_timeout=5000', 'transaction_timeout=6000'],
    migrate: [],
  })
})

test('reparo: Cloudflare fora, a empresa fica para a próxima e o Hub segue', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  await send(subject, ana)
  hub.cloudflare.script('exists', 'NO_ANSWER')
  await hub.repair()
  const sent = await send(subject, ana, folder({}, '#6b2fa3'))
  assert.deepEqual(sent.preview, { state: 'ready', number: 2 })
})

test('reparo: o Projeto marcado para apagar enquanto o reparo o refaz perde o que ele refez', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, owner, projectId } = subject
  await send(subject, ana)
  const id = ProjectId.parse(projectId)
  assert.equal(await forgetApp(owner, id, hub.config.appLoginKey), 'DONE')
  const held = hub.postgres.holdMigrate()
  const repaired = hub.repair()
  await held.arrived
  // A deletion marks the Projeto while the repair migrates its app.
  await hub.test.asOwner('update projects.project set deleting_since = now()')
  held.release()
  await repaired
  assert.deepEqual(hub.cloudflare.workers(), [])
  assert.deepEqual(await appLoginsOf(owner, id), [])
  assert.deepEqual((await appTablesOf(owner, id)).tables, [])
})

test('reparo: o reparo poda as versões marcadas, as enviadas à mão que a migração da 14.1 marca (36)', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, projects, projectId } = subject
  await send(subject, ana)
  await send(subject, ana, folder({}, '#6b2fa3'))
  // The migration's own statements, as `migrate` runs them on the installation's database.
  const migration = readFileSync(
    join(
      import.meta.dirname,
      '../../../migrations/20261026004659_e141_hand_sent_versions/migration.sql',
    ),
    'utf8',
  )
  for (const statement of migration.split('--> statement-breakpoint')) {
    await hub.test.asOwner(statement)
  }
  async function appVersion() {
    return Object((await call(hub, ana, 'GET', `${projects}/${projectId}`)).json()).project
      .appVersion
  }
  assert.equal(await appVersion(), null)
  assert.deepEqual(await listed(subject), [])
  assert.equal(hub.cloudflare.workers().length, 2, 'the Workers wait for the repair')
  await hub.repair()
  assert.deepEqual(hub.cloudflare.workers(), [])
  const left = await hub.test.asOwner(
    `select (select count(*)::int from apps.app_version) as versions,
            (select count(*)::int from apps.version_file) as files,
            (select count(*)::int from apps.blob) as blobs`,
  )
  assert.deepEqual(left, [{ versions: 0, files: 0, blobs: 0 }])
  // The Builder's next version goes on the air under its own number.
  assert.deepEqual((await send(subject, ana, folder({}, '#111111'))).preview, {
    state: 'ready',
    number: 3,
  })
  assert.equal(await appVersion(), 3)
})

test('reparo: a migração que o banco recusa deixa a empresa para a próxima, e o Hub segue', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, owner, projectId } = subject
  await send(subject, ana)
  const id = ProjectId.parse(projectId)
  assert.equal(await forgetApp(owner, id, hub.config.appLoginKey), 'DONE')
  t.mock.method(hub.postgres.companyPostgres, 'migrate', async () => ({
    kind: 'REFUSED' as const,
    code: '23505',
  }))
  await hub.repair()
  const said = hub.lines.map(({ fields, message }) => [message, fields.code])
  assert.ok(
    said.some(
      ([message, code]) => message === 'APP_REPAIR_FAILED' && code === 'APP_MIGRATION_FAILED',
    ),
  )
  assert.ok(!said.some(([message]) => message === 'APP_REPAIRED'))
})
