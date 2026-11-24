import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import { appCheckLogin, appLogin, ProjectId } from '@conexus/hub-api'
import { savedOf } from '../../platform/test-company-postgres.ts'
import { call } from '../identity/test-hub.ts'
import { asAppLogin, checkDatabaseOf, confer, opened } from './test-conference.ts'
import { PEDIDOS } from './test-handoff.ts'
import { companyForVersions, folder, MIGRATION, send } from './test-versions.ts'

const PLATFORM_FAILED = { ok: false, error: 'CONFER_PLATFORM_FAILED' }

test('conferência: sobe c-<projectId> com as marcas e o limite de CPU, cria a linha do app e a sessão de 10 minutos no host do app', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, companyId, projectId } = subject
  const conference = await opened(subject, ana)
  assert.equal(conference.url.href, `https://${PEDIDOS}.${hub.config.appsDomain}/`)
  const worker = `c-${projectId}`
  assert.deepEqual(hub.cloudflare.workers(), [worker])
  assert.partialDeepStrictEqual(hub.cloudflare.upload(worker), {
    tags: [`company-${companyId}`, `project-${projectId}`],
    cpuMs: APP_CALL_LIMITS.cpuMs,
  })
  assert.deepEqual(await hub.test.asOwner('select project_id, live_version_id from apps.app'), [
    { project_id: projectId, live_version_id: null },
  ])
  assert.deepEqual(
    await hub.test.asOwner(
      `select host_label, person_id, project_id,
        expires_at - statement_timestamp() between interval '9 minutes' and interval '10 minutes'
          as ten_minutes
        from apps.check_session`,
    ),
    [{ host_label: PEDIDOS, person_id: ana.id, project_id: projectId, ten_minutes: true }],
  )
  const lines = hub.lines.map((line) => line.message)
  assert.ok(
    lines.includes('APP_CONFERENCE_UPLOADED') && lines.includes('APP_CONFERENCE_DATABASE_READY'),
  )
})

test('conferência: a versão que não inicia (10021) volta NOT_STARTING sem chamar o Neon nem gravar sessão', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  hub.cloudflare.script('upload', 'NOT_STARTING')
  assert.deepEqual(await confer(subject, ana), { ok: true, value: { kind: 'NOT_STARTING' } })
  assert.deepEqual(
    hub.neon.calls.filter((call) => call === 'ownerConnection'),
    [],
  )
  assert.deepEqual(await hub.test.asOwner('select * from apps.check_session'), [])
})

test('conferência: o Projeto sem endereço volta NO_ADDRESS sem Worker, sem banco e sem sessão', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  await hub.test.asOwner('update projects.project set host_label = null')
  assert.deepEqual(await confer(subject, ana), { ok: true, value: { kind: 'NO_ADDRESS' } })
  assert.deepEqual(hub.cloudflare.calls, [])
  assert.deepEqual(
    hub.neon.calls.filter((call) => call === 'ownerConnection'),
    [],
  )
  assert.deepEqual(await hub.test.asOwner('select * from apps.app'), [])
  assert.deepEqual(await hub.test.asOwner('select * from apps.check_session'), [])
})

test('conferência: o Projeto marcado para apagar depois do upload para antes do esquema de teste e da sessão', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, owner, projectId } = subject
  const held = hub.cloudflare.holdUpload()
  const opening = confer(subject, ana)
  await held.arrived
  await hub.test.asOwner('update projects.project set deleting_since = now()')
  held.release()
  assert.deepEqual(await opening, PLATFORM_FAILED)
  assert.deepEqual(
    hub.neon.calls.filter((call) => call === 'ownerConnection'),
    [],
  )
  assert.equal((await checkDatabaseOf(owner, projectId)).schema, false)
  assert.deepEqual(await hub.test.asOwner('select * from apps.check_session'), [])
  assert.ok(hub.lines.some((line) => line.message === 'APP_CONFERENCE_STOPPED'))
})

test('conferência: cada uma começa no esquema de teste vazio; a migração recusada volta MIGRATION_REFUSED e o esquema da Prévia não muda', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, owner, projectId } = subject
  const id = ProjectId.parse(projectId)
  await send(subject, ana)
  await asAppLogin(
    hub,
    owner,
    appLogin(id).runLogin,
    "insert into recado (texto) values ('da Prévia')",
  )
  const previa = await savedOf(owner, id)
  const checkRun = appCheckLogin(id).runLogin
  await opened(subject, ana)
  await asAppLogin(hub, owner, checkRun, "insert into recado (texto) values ('da conferência')")
  await opened(subject, ana)
  assert.deepEqual(await asAppLogin(hub, owner, checkRun, 'select texto from recado'), [])
  // DROP TABLE passes on an empty schema, with nothing saved to lose: the list refuses a view.
  const view = { id: '002_visao', statements: ['CREATE VIEW recados AS SELECT texto FROM recado'] }
  const refused = await confer(subject, ana, folder({ migrations: [MIGRATION, view] }))
  assert.partialDeepStrictEqual(refused, {
    ok: true,
    value: {
      kind: 'MIGRATION_REFUSED',
      failure: 'APP_MIGRATION_REFUSED',
      cause: { kind: 'rule', migration: '002_visao' },
    },
  })
  assert.deepEqual(await savedOf(owner, id), previa)
})

test('conferência: o Projeto apagado inteiro durante o upload deixa a conferência parar e tira o Worker c-, sem sessão nem Neon', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, owner, projectId, projects } = subject
  const held = hub.cloudflare.holdUpload()
  const opening = confer(subject, ana)
  await held.arrived
  const url = `${projects}/${projectId}`
  assert.equal((await call(hub, ana, 'DELETE', url, { name: 'Pedidos' })).statusCode, 204)
  const connections = hub.neon.calls.length
  held.release()
  assert.deepEqual(await opening, PLATFORM_FAILED)
  assert.ok(
    hub.cloudflare.calls.some(
      ({ call: kind, worker }) => kind === 'remove' && worker === `c-${projectId}`,
    ),
  )
  assert.deepEqual(hub.cloudflare.workers(), [])
  // The deletion's own connection came before the release; the stopped conference opens none.
  assert.equal(hub.neon.calls.length, connections)
  assert.equal((await checkDatabaseOf(owner, projectId)).schema, false)
  assert.deepEqual(await hub.test.asOwner('select * from apps.check_session'), [])
})

test('conferência: o Projeto marcado para apagar depois das migrações não grava a sessão', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  const held = hub.postgres.holdMigrate()
  const opening = confer(subject, ana)
  await held.arrived
  await hub.test.asOwner('update projects.project set deleting_since = now()')
  held.release()
  assert.deepEqual(await opening, PLATFORM_FAILED)
  assert.deepEqual(await hub.test.asOwner('select * from apps.check_session'), [])
})
