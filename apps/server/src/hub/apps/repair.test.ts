import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ProjectId } from '@conexus/hub-api'
import { appTablesOf, forgetApp } from '../../platform/test-company-postgres.ts'
import { whenIdle } from '../../platform/test-database.ts'
import { post } from '../identity/test-hub.ts'
import { companyForVersions, folder, MIGRATION, send } from './test-versions.ts'

test('reparo: Worker que falta e esquema, logins e migrações da versão no ar voltam; "enviando" vencida falha', async (t) => {
  const { hub, ana, owner, projectId, versions, projects } = await companyForVersions(t)
  const live = Object(Object((await send(hub, ana, versions)).json()).version)
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

test('reparo: Cloudflare fora, a empresa fica para a próxima e o Hub segue', async (t) => {
  const { hub, ana, versions } = await companyForVersions(t)
  await send(hub, ana, versions)
  hub.cloudflare.script('exists', 'NO_ANSWER')
  await hub.repair()
  const sent = await send(hub, ana, versions, folder({}, '#6b2fa3'))
  assert.equal(sent.statusCode, 201)
})
