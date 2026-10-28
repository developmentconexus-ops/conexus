import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import { ProjectId } from '@conexus/hub-api'
import { appTablesOf } from '../../platform/test-company-postgres.ts'
import { ANA_OWNER, BRUNO, codeOf, post } from '../identity/test-hub.ts'
import { companyForVersions, folder, listed, MIGRATION, send } from './test-versions.ts'

test('envio: a versão do Builder vai ao ar com o número dele, enviada por dono ou membro; a rota de envio saiu (35)', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, companyId, projectId, versions } = subject
  assert.deepEqual((await send(subject, ana)).preview, { state: 'ready', number: 1 })
  const [version] = await listed(subject)
  assert.deepEqual(
    [version?.number, version?.state, version?.live, version?.failure, version?.sentBy],
    [1, 'ready', true, null, ana.id],
  )
  assert.deepEqual(hub.cloudflare.workers(), [`v-${version?.id}`])
  const upload = hub.cloudflare.upload(`v-${version?.id}`)
  assert.deepEqual(upload?.tags, [`company-${companyId}`, `project-${projectId}`])
  assert.equal(upload?.cpuMs, APP_CALL_LIMITS.cpuMs)
  const [app] = await hub.test.asOwner(
    'select live_version_id, sending_version_id, database_ready from apps.app',
  )
  assert.deepEqual(app, {
    live_version_id: version?.id,
    sending_version_id: null,
    database_ready: true,
  })
  assert.deepEqual((await send(subject, bruno, folder({}, '#6b2fa3'))).preview, {
    state: 'ready',
    number: 2,
  })
  const gone = await post(hub, ana, versions, folder())
  assert.deepEqual([gone.statusCode, codeOf(gone)], [404, 'NOT_FOUND'])
  assert.equal((await hub.test.asOwner('select count(*)::int as n from apps.app_version'))[0]?.n, 2)
})

test('envio: a pasta que a máquina deixa fora do contrato ou acima do teto não guarda nada', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  const base = folder()
  const [, , style] = base.files
  if (style === undefined) throw new Error('folder')
  const many = Array.from({ length: 1001 }, (_, at) => ({ ...style, path: `assets/${at}.css` }))
  const refused = [
    { ...base, manifest: { ...base.manifest, contract: 2 } },
    { ...base, files: [...base.files, { ...style, path: 'assets/extra.css' }] },
    {
      ...base,
      manifest: { ...base.manifest, assets: many.map(({ path }) => path.slice(7)) },
      files: [...base.files.slice(0, 1), ...many],
    },
  ]
  for (const version of refused) {
    const { number, preview } = await send(subject, ana, version)
    assert.deepEqual(preview, { state: 'failed', number, code: 'APP_VERSION_FAILED' })
  }
  assert.deepEqual(await hub.test.asOwner('select id from apps.app_version'), [])
  assert.deepEqual(hub.cloudflare.calls, [])
})

test('envio: Neon ou Cloudflare fora "falhou"; código que não inicia e migração que falha, nada aplicado', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, owner, projectId } = subject
  await send(subject, ana)
  const [live] = await listed(subject)
  hub.cloudflare.script('upload', 'NO_ANSWER')
  const noCloudflare = await send(subject, ana, folder({}, '#111111'))
  hub.neon.script('ownerConnection', 'NO_ANSWER')
  const noNeon = await send(subject, ana, folder({}, '#222222'))
  hub.cloudflare.script('upload', 'NOT_STARTING')
  const second = { id: '002_extra', statements: ['CREATE TABLE extra (v text)'] }
  const notStarting = await send(subject, ana, folder({ migrations: [MIGRATION, second] }))
  const broken = {
    id: '003_quebrada',
    statements: ['CREATE TABLE outra (v text)', 'INSERT INTO nada VALUES (1)'],
  }
  const failing = await send(subject, ana, folder({ migrations: [MIGRATION, second, broken] }))
  const changed = { id: MIGRATION.id, statements: ['CREATE TABLE recado (texto text)'] }
  const rewritten = await send(subject, ana, folder({ migrations: [changed] }))
  assert.deepEqual(
    [noCloudflare, noNeon, notStarting, failing, rewritten].map(({ preview }) => preview),
    [
      { state: 'failed', number: 2, code: 'APP_VERSION_FAILED' },
      { state: 'failed', number: 3, code: 'APP_VERSION_FAILED' },
      { state: 'failed', number: 4, code: 'APP_VERSION_NOT_STARTING' },
      {
        state: 'failed',
        number: 5,
        code: 'APP_MIGRATION_FAILED',
        cause: { kind: 'database', sqlstate: '42P01' },
      },
      { state: 'failed', number: 6, code: 'APP_MIGRATION_CHANGED' },
    ],
  )
  const said = hub.lines.filter((line) => line.message === 'PREVIEW_SEND_FAILED')
  assert.ok(!JSON.stringify(said).includes('INSERT'), 'the failure carries no SQL')
  const tables = await appTablesOf(owner, ProjectId.parse(projectId))
  assert.deepEqual(tables, { tables: ['conexus_migration', 'recado'], ledger: [MIGRATION.id] })
  const rows = await hub.test.asOwner(
    `select v.number, v.state, v.failure, a.live_version_id = $1 as kept
       from apps.app_version v, apps.app a order by v.number`,
    [live?.id],
  )
  assert.deepEqual(
    rows.map((row) => [row.number, row.state, row.failure, row.kept]),
    [
      [1, 'ready', null, true],
      [2, 'failed', 'APP_VERSION_FAILED', true],
      [3, 'failed', 'APP_VERSION_FAILED', true],
      [4, 'failed', 'APP_VERSION_NOT_STARTING', true],
      [5, 'failed', 'APP_MIGRATION_FAILED', true],
      [6, 'failed', 'APP_MIGRATION_CHANGED', true],
    ],
  )
  assert.deepEqual(
    (await listed(subject)).map((one) => [one.number, one.live]),
    [
      [6, false],
      [5, false],
      [4, false],
      [3, false],
      [2, false],
      [1, true],
    ],
  )
})

test('versões: cada uma diz quem a enviou; quem saiu da empresa fica sem nome', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, companyId } = subject
  await send(subject, ana)
  await send(subject, bruno, folder({}, '#6b2fa3'))
  async function names() {
    return (await listed(subject)).map((version) => version.sentByName)
  }
  assert.deepEqual(await names(), [BRUNO.name, ANA_OWNER.name])
  await hub.test.asOwner('delete from auth.member where user_id = $1 and company_id = $2', [
    bruno.id,
    companyId,
  ])
  assert.deepEqual(await names(), [null, ANA_OWNER.name])
})
