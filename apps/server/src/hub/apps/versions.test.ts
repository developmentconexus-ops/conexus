import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ProjectId } from '@conexus/hub-api'
import { appTablesOf } from '../../platform/test-company-postgres.ts'
import { queued, WRITE_HEADERS, withOwnerLock } from '../../platform/test-database.ts'
import { CARLA, call, codeOf, personOn, plantCompany } from '../identity/test-hub.ts'
import { companyForVersions, folder, MIGRATION, send } from './test-versions.ts'

const KEY = '6f1c2a4e-0b7d-4c1e-9a3f-2d5b8e7c1a90'

function versionOf(response: { json(): unknown }) {
  return Object(Object(response.json()).version)
}

test('envio: dono e administrador 201, no ar; membro, outra empresa, Projeto marcado 404; sem sessão 401', async (t) => {
  const { hub, ana, bruno, companyId, projectId, versions } = await companyForVersions(t)
  const sent = await send(hub, ana, versions)
  assert.equal(sent.statusCode, 201)
  const version = versionOf(sent)
  assert.deepEqual(
    [version.number, version.state, version.live, version.failure, version.sentBy],
    [1, 'ready', true, null, ana.id],
  )
  assert.deepEqual(hub.cloudflare.workers(), [`v-${version.id}`])
  const upload = hub.cloudflare.upload(`v-${version.id}`)
  assert.deepEqual(upload?.tags, [`company-${companyId}`, `project-${projectId}`])
  assert.equal(upload?.cpuMs, 50)
  const [app] = await hub.test.asOwner(
    'select live_version_id, sending_version_id, database_ready from apps.app',
  )
  assert.deepEqual(app, {
    live_version_id: version.id,
    sending_version_id: null,
    database_ready: true,
  })
  await hub.test.asOwner(
    `update auth.member set role = 'admin' where user_id = $1 and company_id = $2`,
    [bruno.id, companyId],
  )
  assert.equal((await send(hub, bruno, versions, folder({}, '#6b2fa3'))).statusCode, 201)
  await hub.test.asOwner(
    `update auth.member set role = 'member' where user_id = $1 and company_id = $2`,
    [bruno.id, companyId],
  )
  const carla = await personOn(hub, CARLA)
  await plantCompany(hub.test, carla.id, 'Empresa C', 'empresa-c')
  const refused = [await send(hub, bruno, versions), await send(hub, carla, versions)]
  await hub.test.asOwner('update projects.project set deleting_since = now()')
  refused.push(await send(hub, ana, versions))
  assert.deepEqual(
    refused.map((answer) => [answer.statusCode, codeOf(answer)]),
    Array(3).fill([404, 'NOT_FOUND']),
  )
  const anonymous = await hub.app.inject({
    method: 'POST',
    url: versions,
    headers: WRITE_HEADERS,
    payload: JSON.stringify(folder()),
  })
  assert.equal(anonymous.statusCode, 401)
  assert.equal((await hub.test.asOwner('select count(*)::int as n from apps.app_version'))[0]?.n, 2)
})

test('envio: a mesma chave dá a mesma versão; outra pasta na chave 409; dois juntos 201 e 409', async (t) => {
  const { hub, ana, versions } = await companyForVersions(t)
  const first = await send(hub, ana, versions, folder(), KEY)
  const again = await send(hub, ana, versions, folder(), KEY)
  assert.deepEqual([first.statusCode, again.statusCode], [201, 201])
  assert.equal(versionOf(again).id, versionOf(first).id)
  assert.equal(hub.cloudflare.calls.filter(({ call }) => call === 'upload').length, 1)
  const other = await send(hub, ana, versions, folder({}, '#6b2fa3'), KEY)
  assert.deepEqual([other.statusCode, codeOf(other)], [409, 'IDEMPOTENCY_CONFLICT'])
  // A pruned version is gone, so its key sends anew.
  const later = versionOf(await send(hub, ana, versions, folder({}, '#333333')))
  await hub.test.asOwner('delete from apps.app_version where attempt_key = $1', [KEY])
  assert.equal(later.live, true)
  const anew = await send(hub, ana, versions, folder(), KEY)
  assert.equal(anew.statusCode, 201)
  assert.notEqual(versionOf(anew).id, versionOf(first).id)
  const answers = await withOwnerLock(hub.test, 'lock table apps.app', [], async (release) => {
    const both = [
      send(hub, ana, versions, folder({}, '#111111')),
      send(hub, ana, versions, folder({}, '#222222')),
    ]
    await queued(hub.test, 2)
    await release()
    return Promise.all(both)
  })
  assert.deepEqual(answers.map((answer) => answer.statusCode).sort(), [201, 409])
  assert.ok(answers.some((answer) => codeOf(answer) === 'APP_VERSION_SENDING'))
})

test('envio: 422 para caminho com .. ou absoluto, repetido, ausente ou a mais; 413 acima do teto', async (t) => {
  const { hub, ana, versions } = await companyForVersions(t)
  const base = folder()
  const [worker, index, style] = base.files
  if (worker === undefined || index === undefined || style === undefined) throw new Error('folder')
  const bodies = [
    { ...base, files: [worker, index, { ...style, path: 'assets/../style.css' }] },
    { ...base, manifest: { ...base.manifest, assets: ['/etc/style.css', 'index.html'] } },
    { ...base, files: [worker, index, style, style] },
    { ...base, files: [worker, index] },
    { ...base, files: [...base.files, { ...style, path: 'assets/extra.css' }] },
    { ...base, manifest: { ...base.manifest, contract: 2 } },
  ]
  for (const body of bodies) {
    const answer = await send(hub, ana, versions, body)
    assert.deepEqual([answer.statusCode, codeOf(answer)], [422, 'APP_VERSION_INVALID'])
  }
  const big = Buffer.alloc(10 * 1024 * 1024 + 1).toString('base64')
  const tooBig = await send(hub, ana, versions, {
    ...base,
    files: [worker, index, { ...style, base64: big }],
  })
  assert.deepEqual([tooBig.statusCode, codeOf(tooBig)], [413, 'APP_VERSION_TOO_LARGE'])
  const huge = await send(hub, ana, versions, { ...base, padding: 'x'.repeat(15 * 1024 * 1024) })
  assert.equal(huge.statusCode, 413)
  assert.deepEqual(await hub.test.asOwner('select id from apps.app_version'), [])
  assert.deepEqual(hub.cloudflare.calls, [])
})

test('envio: Neon ou Cloudflare fora 502 e "falhou"; código que não inicia e migração que falha 422, nada aplicado', async (t) => {
  const { hub, ana, owner, projectId, versions } = await companyForVersions(t)
  const live = versionOf(await send(hub, ana, versions))
  hub.cloudflare.script('upload', 'NO_ANSWER')
  const noCloudflare = await send(hub, ana, versions, folder({}, '#111111'))
  hub.neon.script('ownerConnection', 'NO_ANSWER')
  const noNeon = await send(hub, ana, versions, folder({}, '#222222'))
  assert.deepEqual(
    [noCloudflare, noNeon].map((answer) => [answer.statusCode, codeOf(answer)]),
    Array(2).fill([502, 'APP_VERSION_FAILED']),
  )
  hub.cloudflare.script('upload', 'NOT_STARTING')
  const second = { id: '002_extra', statements: ['CREATE TABLE extra (v text)'] }
  const notStarting = await send(hub, ana, versions, folder({ migrations: [MIGRATION, second] }))
  assert.deepEqual([notStarting.statusCode, codeOf(notStarting)], [422, 'APP_VERSION_NOT_STARTING'])
  const broken = {
    id: '003_quebrada',
    statements: ['CREATE TABLE outra (v text)', 'INSERT INTO nada VALUES (1)'],
  }
  const failing = await send(
    hub,
    ana,
    versions,
    folder({ migrations: [MIGRATION, second, broken] }),
  )
  assert.deepEqual([failing.statusCode, codeOf(failing)], [422, 'APP_MIGRATION_FAILED'])
  assert.ok(!JSON.stringify(failing.json()).includes('INSERT'), 'the answer carries no SQL')
  const changed = { id: MIGRATION.id, statements: ['CREATE TABLE recado (texto text)'] }
  const rewritten = await send(hub, ana, versions, folder({ migrations: [changed] }))
  assert.deepEqual([rewritten.statusCode, codeOf(rewritten)], [422, 'APP_MIGRATION_CHANGED'])
  const tables = await appTablesOf(owner, ProjectId.parse(projectId))
  assert.deepEqual(tables, { tables: ['conexus_migration', 'recado'], ledger: [MIGRATION.id] })
  const rows = await hub.test.asOwner(
    `select v.number, v.state, v.failure, a.live_version_id = $1 as kept
       from apps.app_version v, apps.app a order by v.number`,
    [live.id],
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
  const listed = await call(hub, ana, 'GET', versions)
  assert.deepEqual(
    Object(listed.json()).versions.map((one: { number: number; live: boolean }) => [
      one.number,
      one.live,
    ]),
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
