import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ProjectId } from '@conexus/hub-api'
import { appTablesOf } from '../../platform/test-company-postgres.ts'
import { serveEnvironment, TEST_ORIGIN } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import { neonServer } from '../../platform/test-neon.ts'
import { companyForVersions, send } from '../apps/test-versions.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  codeOf,
  companyOn,
  memberOn,
  PASSWORD,
  personOn,
  post,
} from '../identity/test-hub.ts'

async function withProject(t: Parameters<typeof companyOn>[0]) {
  const { hub, ana, companyId } = await companyOn(t)
  const admin = await memberOn(hub, companyId, CARLA, 'admin')
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, bruno, projects, { name: 'Pedidos' })
  const url = `${projects}/${Object(made.json()).project.id}`
  return { hub, ana, admin, bruno, companyId, projects, url }
}

test('apagar: dono e administrador apagam; o membro, o outro nome e o segundo pedido não', async (t) => {
  const { hub, ana, admin, bruno, projects, url } = await withProject(t)
  const member = await call(hub, bruno, 'DELETE', url, { name: 'Pedidos' })
  assert.equal(member.statusCode, 404)
  assert.equal(codeOf(member), 'NOT_FOUND')
  const wrong = await call(hub, ana, 'DELETE', url, { name: 'pedidos' })
  assert.equal(wrong.statusCode, 422)
  assert.equal(codeOf(wrong), 'PROJECT_NAME_MISMATCH')
  assert.equal((await call(hub, ana, 'DELETE', url, { name: 'Pedidos' })).statusCode, 204)
  assert.equal((await call(hub, ana, 'DELETE', url, { name: 'Pedidos' })).statusCode, 404)
  const other = await post(hub, bruno, projects, { name: 'Estoque' })
  const otherUrl = `${projects}/${Object(other.json()).project.id}`
  assert.equal((await call(hub, admin, 'DELETE', otherUrl, { name: 'Estoque' })).statusCode, 204)
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.project`), [
    { n: 0 },
  ])
})

test('apagar: o último Projeto não apaga o banco da empresa', async (t) => {
  const { hub, ana, url } = await withProject(t)
  assert.equal((await call(hub, ana, 'DELETE', url, { name: 'Pedidos' })).statusCode, 204)
  assert.deepEqual(await hub.test.asOwner(`select state from projects.company_database`), [
    { state: 'ready' },
  ])
  assert.equal(hub.neon.projects().length, 1)
  assert.ok(!hub.neon.calls.includes('delete'))
})

test('ler: a lista traz o banco pronto e o Projeto diz se quem lê pode apagá-lo', async (t) => {
  const { hub, ana, bruno, projects, url } = await withProject(t)
  const listed = await call(hub, bruno, 'GET', projects)
  assert.equal(listed.statusCode, 200)
  const body = Object(listed.json())
  assert.deepEqual(
    body.projects.map((project: { name: string }) => project.name),
    ['Pedidos'],
  )
  assert.deepEqual([body.databaseReady, body.next], [true, { kind: 'END' }])
  const asMember = Object(Object(await call(hub, bruno, 'GET', url)).json())
  const asOwner = Object(Object(await call(hub, ana, 'GET', url)).json())
  function rights(project: { mayDelete: boolean; mayManageVersions: boolean }) {
    return [project.mayDelete, project.mayManageVersions]
  }
  assert.deepEqual(
    [rights(asMember.project), rights(asOwner.project)],
    [
      [false, false],
      [true, true],
    ],
  )
  const missing = await call(hub, ana, 'GET', `${projects}/${'a'.repeat(32)}`)
  assert.equal(missing.statusCode, 404)
})

test('ler: a lista de uma empresa sem Projeto diz que o banco ainda não existe', async (t) => {
  const { hub, ana, companyId } = await companyOn(t)
  const listed = await call(hub, ana, 'GET', `/api/companies/${companyId}/projects`)
  assert.deepEqual(listed.json(), { projects: [], next: { kind: 'END' }, databaseReady: false })
})

test('log: PROJECT_CREATED, COMPANY_DATABASE_CREATED e PROJECT_DELETED levam ids, nunca o nome', async (t) => {
  const { hub, companyId } = await companyOn(t)
  const neon = await neonServer(t)
  const environment = { ...serveEnvironment(t, hub.test.runtimeUrl), HUB_NEON_API_URL: neon.url }
  const { port, lines, stop } = await spawnHub(t, environment)
  const base = `http://127.0.0.1:${port}`
  const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
  try {
    const signedIn = await fetch(`${base}/api/sessions/current`, {
      method: 'PUT',
      headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
      body: JSON.stringify({ email: ANA_OWNER.email, password: PASSWORD }),
    })
    const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    const url = `${base}/api/companies/${companyId}/projects`
    const created = await fetch(url, {
      method: 'POST',
      headers: { ...json, cookie, 'idempotency-key': crypto.randomUUID() },
      body: JSON.stringify({ name: 'Pedidos Secretos' }),
    })
    assert.equal(created.status, 201)
    const { project } = Object(await created.json())
    const deleted = await fetch(`${url}/${project.id}`, {
      method: 'DELETE',
      headers: { ...json, cookie },
      body: JSON.stringify({ name: 'Pedidos Secretos' }),
    })
    assert.equal(deleted.status, 204)
  } finally {
    await stop()
  }
  assert.equal(neon.projects().length, 1)
  for (const message of ['COMPANY_DATABASE_CREATED', 'PROJECT_CREATED', 'PROJECT_DELETED']) {
    const line = lines.find((logged) => logged.msg === message)
    assert.equal(line?.companyId, companyId, message)
    assert.match(String(line?.traceId), /^[0-9a-f-]{36}$/, message)
  }
  assert.doesNotMatch(JSON.stringify(lines), /Pedidos Secretos/)
})

test('apagar: dois pedidos ao mesmo tempo dão 204 e 404', async (t) => {
  const { hub, ana, admin, url } = await withProject(t)
  const both = await Promise.all([
    call(hub, ana, 'DELETE', url, { name: 'Pedidos' }),
    call(hub, admin, 'DELETE', url, { name: 'Pedidos' }),
  ])
  assert.deepEqual(both.map((response) => response.statusCode).sort(), [204, 404])
})

test('empresa marcada: nenhuma rota da empresa admite quem é dela, de Projeto ou de pessoas', async (t) => {
  const { hub, ana, bruno, companyId, projects, url } = await withProject(t)
  await hub.test.asOwner(`update auth.company set deleting_since = now() where id = $1`, [
    companyId,
  ])
  for (const person of [ana, bruno]) {
    const answers = await Promise.all([
      call(hub, person, 'GET', projects),
      call(hub, person, 'GET', url),
      post(hub, person, projects, { name: 'Outro' }),
      call(hub, person, 'DELETE', url, { name: 'Pedidos' }),
    ])
    assert.deepEqual(
      answers.map((response) => response.statusCode),
      [404, 404, 404, 404],
    )
  }
  const central = await personOn(hub, {
    name: 'Central',
    email: 'central@example.test',
    role: 'admin',
  })
  const operated = await call(hub, central, 'GET', `/api/companies/${companyId}/members`)
  assert.equal(operated.statusCode, 404)
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from projects.project`), [
    { n: 1 },
  ])
})

test('apagar com app: Workers, esquema e logins antes das linhas; a marca dá 404 já; trava viva 409', async (t) => {
  const { hub, ana, projectId, owner, versions, projects } = await companyForVersions(t)
  const url = `${projects}/${projectId}`
  const version = Object(Object((await send(hub, ana, versions)).json()).version)
  await hub.test.asOwner(
    `update apps.app set sending_version_id = $1, claimed_until = now() + interval '1 minute'`,
    [version.id],
  )
  const held = await call(hub, ana, 'DELETE', url, { name: 'Pedidos' })
  assert.deepEqual([held.statusCode, codeOf(held)], [409, 'APP_VERSION_SENDING'])
  await hub.test.asOwner('update apps.app set sending_version_id = null, claimed_until = null')
  // Cloudflare out: the Projeto stays marked, gone for every read and the app's host.
  hub.cloudflare.script('remove', 'NO_ANSWER')
  assert.equal((await call(hub, ana, 'DELETE', url, { name: 'Pedidos' })).statusCode, 204)
  const reads = [await call(hub, ana, 'GET', url), await call(hub, ana, 'GET', versions)]
  assert.deepEqual(
    reads.map((read) => read.statusCode),
    [404, 404],
  )
  const listed = Object((await call(hub, ana, 'GET', projects)).json()).projects
  assert.deepEqual(listed, [])
  assert.deepEqual(hub.cloudflare.workers(), [`v-${version.id}`])
  const again = await call(hub, ana, 'DELETE', url, { name: 'Pedidos' })
  assert.equal(again.statusCode, 404)
  // The repair at start finishes it: the Worker, then the schema and logins, then the rows.
  await hub.repair()
  assert.deepEqual(hub.cloudflare.workers(), [])
  assert.deepEqual(await appTablesOf(owner, ProjectId.parse(projectId)), { tables: [], ledger: [] })
  const left = await hub.test.asOwner(
    `select (select count(*)::int from projects.project) as projects,
            (select count(*)::int from apps.app_version) as versions,
            (select count(*)::int from apps.blob) as blobs`,
  )
  assert.deepEqual(left, [{ projects: 0, versions: 0, blobs: 0 }])
  const removed = hub.cloudflare.calls.filter(({ call: kind }) => kind === 'remove')
  assert.equal(removed.length, 2)
})

test('apagar: o envio vencido vê a marca, falha e tira o próprio Worker', async (t) => {
  const { hub, ana, projectId, versions, projects } = await companyForVersions(t)
  const held = hub.cloudflare.holdUpload()
  const sent = send(hub, ana, versions)
  await held.arrived
  await hub.test.asOwner(`update apps.app set claimed_until = now() - interval '1 second'`)
  const deleted = await call(hub, ana, 'DELETE', `${projects}/${projectId}`, { name: 'Pedidos' })
  assert.equal(deleted.statusCode, 204)
  held.release()
  const answer = await sent
  assert.equal(answer.statusCode, 404)
  assert.deepEqual(hub.cloudflare.workers(), [])
})
