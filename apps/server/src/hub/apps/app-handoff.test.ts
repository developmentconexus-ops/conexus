import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { queued, TEST_ORIGIN, withOwnerLock } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  codeOf,
  hubWithMail,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'
import { companyForVersions, send } from './test-versions.ts'

const PEDIDOS = 'pedidos--empresa-a'
const ESTOQUE = 'estoque--empresa-a'

/** A browser's binding: the secret its cookie on the app's host holds, and the hash the Hub keeps. */
function browser() {
  const binding = randomBytes(32).toString('base64url')
  return { binding, hash: createHash('sha256').update(binding).digest('base64url') }
}

/** Empresa A with Ana its owner, Bruno a member, and the Projetos Pedidos and Estoque. */
async function companyWithApps(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, ana, projects, { name: 'Pedidos' })
  await post(hub, ana, projects, { name: 'Estoque' })
  const projectId = String(Object(made.json()).project.id)
  return { hub, ana, bruno, companyId, projectId, project: `${projects}/${projectId}` }
}

function handoff(hub: Hub, person: Person | undefined, body: { host: string; binding: string }) {
  return hub.app.inject({
    method: 'POST',
    url: '/api/apps/handoffs',
    headers: {
      origin: TEST_ORIGIN,
      'content-type': 'application/json',
      ...(person ? { cookie: person.cookie } : {}),
    },
    payload: JSON.stringify(body),
  })
}

function redeem(hub: Hub, body: { host: string; code: string; binding: string }) {
  return hub.edge.inject({
    method: 'POST',
    url: '/api/app-sessions',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  })
}

function check(hub: Hub, host: string, session: string) {
  return hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${host}`,
    headers: { [APP_SESSION_HEADER]: session },
  })
}

/** The pass the Hub gives the person for this browser, as the code in its location. */
async function codeFor(hub: Hub, person: Person, host: string, hash: string) {
  const made = await handoff(hub, person, { host, binding: hash })
  assert.equal(made.statusCode, 201)
  const location = new URL(String(Object(made.json()).location))
  return String(location.searchParams.get('code'))
}

/** An app session of the person on the host, as the dispatcher holds it. */
async function sessionOf(hub: Hub, person: Person, host: string) {
  const { binding, hash } = browser()
  const redeemed = await redeem(hub, {
    host,
    code: await codeFor(hub, person, host, hash),
    binding,
  })
  assert.equal(redeemed.statusCode, 201)
  return String(Object(redeemed.json()).session)
}

test('passagem: o membro recebe 201 no host do app; sem sessão 401; host, empresa ou marcada, a mesma 404', async (t) => {
  const { hub, bruno, companyId } = await companyWithApps(t)
  const { hash } = browser()
  const made = await handoff(hub, bruno, { host: PEDIDOS, binding: hash })
  assert.equal(made.statusCode, 201)
  const location = new URL(String(Object(made.json()).location))
  assert.equal(location.origin, `https://${PEDIDOS}.apps.example.test`)
  assert.equal(location.pathname, '/__conexus/passagem')
  assert.match(String(location.searchParams.get('code')), /^[A-Za-z0-9_-]{43}$/)
  const [row] = await hub.test.asOwner(
    `select code_hash, binding_hash,
      extract(epoch from expires_at - statement_timestamp())::int between 55 and 60 as lasts
      from apps.handoff`,
  )
  assert.equal(row?.binding_hash, hash)
  assert.equal(row?.lasts, true)
  assert.notEqual(row?.code_hash, location.searchParams.get('code'))
  const anonymous = await handoff(hub, undefined, { host: PEDIDOS, binding: hash })
  assert.equal(anonymous.statusCode, 401)
  const carla = await personOn(hub, CARLA)
  await plantCompany(hub.test, carla.id, 'Empresa C', 'empresa-c')
  const unknown = await handoff(hub, bruno, { host: 'nada--empresa-a', binding: hash })
  const outsider = await handoff(hub, carla, { host: PEDIDOS, binding: hash })
  await hub.test.asOwner(`update auth.company set deleting_since = now() where id = $1`, [
    companyId,
  ])
  const marked = await handoff(hub, bruno, { host: PEDIDOS, binding: hash })
  const refused = [unknown, outsider, marked]
  assert.deepEqual(
    refused.map((response) => [response.statusCode, codeOf(response)]),
    Array(3).fill([404, 'NOT_FOUND']),
  )
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from apps.handoff`), [
    { n: 1 },
  ])
})

test('resgate: outro vínculo, outro host, vencido 403; o certo 201; de novo 403 (LT2)', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const { binding, hash } = browser()
  const code = await codeFor(hub, bruno, PEDIDOS, hash)
  const answers = [
    await redeem(hub, { host: PEDIDOS, code, binding: browser().binding }),
    await redeem(hub, { host: ESTOQUE, code, binding }),
  ]
  const late = browser()
  const lateCode = await codeFor(hub, bruno, PEDIDOS, late.hash)
  await hub.test.asOwner(
    `update apps.handoff set expires_at = statement_timestamp() - interval '1 second'
      where binding_hash = $1`,
    [late.hash],
  )
  answers.push(await redeem(hub, { host: PEDIDOS, code: lateCode, binding: late.binding }))
  answers.push(await redeem(hub, { host: PEDIDOS, code, binding }))
  answers.push(await redeem(hub, { host: PEDIDOS, code, binding }))
  assert.deepEqual(
    answers.map((response) => response.statusCode),
    [403, 403, 403, 201, 403],
  )
  assert.deepEqual(answers.filter((response) => response.statusCode === 403).map(codeOf), [
    'APP_HANDOFF_INVALID',
    'APP_HANDOFF_INVALID',
    'APP_HANDOFF_INVALID',
    'APP_HANDOFF_INVALID',
  ])
  const session = String(Object(answers[3]?.json()).session)
  const [row] = await hub.test.asOwner(`select token_hash, host_label from apps.app_session`)
  assert.deepEqual(row, {
    token_hash: createHash('sha256').update(session).digest('base64url'),
    host_label: PEDIDOS,
  })
})

// The pass's row is held, so both redemptions queue on it and the race runs the same way every
// time: the first takes the row, the second finds it gone (code C65).
test('resgate: duas trocas juntas do mesmo código, a primeira vale, a segunda 403', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const { binding, hash } = browser()
  const code = await codeFor(hub, bruno, PEDIDOS, hash)
  const codeHash = createHash('sha256').update(code).digest('base64url')
  const holdPass = 'select code_hash from apps.handoff where code_hash = $1 for update'
  const both = await withOwnerLock(hub.test, holdPass, [codeHash], async (release) => {
    const first = redeem(hub, { host: PEDIDOS, code, binding })
    await queued(hub.test, 1, first)
    const second = redeem(hub, { host: PEDIDOS, code, binding })
    await queued(hub.test, 2, second)
    await release()
    return Promise.all([first, second])
  })
  assert.deepEqual(
    both.map((response) => response.statusCode),
    [201, 403],
  )
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from apps.app_session`), [
    { n: 1 },
  ])
})

test('checagem: 200 com quem chama; outro host e sem sessão 401; sessão do Hub apagada ou vencida 401', async (t) => {
  const { hub, bruno, projectId } = await companyWithApps(t)
  const session = await sessionOf(hub, bruno, PEDIDOS)
  const checked = await check(hub, PEDIDOS, session)
  assert.equal(checked.statusCode, 200)
  assert.deepEqual(checked.json(), {
    caller: { personId: bruno.id, personName: 'Bruno Reis', projectId, projectName: 'Pedidos' },
    version: { example: true },
    database: null,
  })
  const missing = await hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${PEDIDOS}`,
  })
  const elsewhere = await check(hub, ESTOQUE, session)
  assert.deepEqual(
    [missing, elsewhere].map((response) => [response.statusCode, codeOf(response)]),
    Array(2).fill([401, 'APP_SESSION_INVALID']),
  )
  const signedOut = await call(hub, bruno, 'DELETE', '/api/sessions/current')
  assert.equal(signedOut.statusCode, 204)
  assert.equal((await check(hub, PEDIDOS, session)).statusCode, 401)
  assert.deepEqual(await hub.test.asOwner(`select count(*)::int as n from apps.app_session`), [
    { n: 0 },
  ])
  const again = await personOn(hub, { name: 'Davi Souza', email: 'davi@example.test' })
  const [{ company_id: companyId } = {}] = await hub.test.asOwner(
    `select company_id from projects.project where id = $1`,
    [projectId],
  )
  await hub.test.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, 'member', now())`,
    [randomBytes(16).toString('hex'), companyId, again.id],
  )
  const live = await sessionOf(hub, again, PEDIDOS)
  assert.equal((await check(hub, PEDIDOS, live)).statusCode, 200)
  await hub.test.asOwner(
    `update auth.session set expires_at = now() - interval '1 second' where user_id = $1`,
    [again.id],
  )
  const expired = await check(hub, PEDIDOS, live)
  assert.deepEqual([expired.statusCode, codeOf(expired)], [401, 'APP_SESSION_INVALID'])
})

test('checagem: tirado e empresa marcada 403, Projeto apagado 404, já na chamada seguinte', async (t) => {
  const { hub, ana, bruno, companyId, project } = await companyWithApps(t)
  const brunos = await sessionOf(hub, bruno, PEDIDOS)
  const anas = await sessionOf(hub, ana, PEDIDOS)
  const estoque = await sessionOf(hub, ana, ESTOQUE)
  assert.equal((await check(hub, PEDIDOS, brunos)).statusCode, 200)
  await hub.test.asOwner(`delete from auth.member where user_id = $1`, [bruno.id])
  const removed = await check(hub, PEDIDOS, brunos)
  assert.deepEqual([removed.statusCode, codeOf(removed)], [403, 'APP_ACCESS_REFUSED'])
  assert.equal((await check(hub, PEDIDOS, anas)).statusCode, 200)
  const deleted = await call(hub, ana, 'DELETE', project, { name: 'Pedidos' })
  assert.equal(deleted.statusCode, 204)
  const gone = await check(hub, PEDIDOS, anas)
  assert.deepEqual([gone.statusCode, codeOf(gone)], [404, 'APP_NOT_FOUND'])
  assert.equal((await check(hub, ESTOQUE, estoque)).statusCode, 200)
  await hub.test.asOwner(`update auth.company set deleting_since = now() where id = $1`, [
    companyId,
  ])
  const marked = await check(hub, ESTOQUE, estoque)
  assert.deepEqual([marked.statusCode, codeOf(marked)], [403, 'APP_ACCESS_REFUSED'])
})

test('checagem: o Projeto apagado e criado de novo com o nome pede outra entrada, 401, e a sessão velha sai', async (t) => {
  const { hub, ana, project } = await companyWithApps(t)
  const old = await sessionOf(hub, ana, PEDIDOS)
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Pedidos' })).statusCode, 204)
  const projects = project.slice(0, project.lastIndexOf('/'))
  assert.equal((await post(hub, ana, projects, { name: 'Pedidos' })).statusCode, 201)
  const stale = await check(hub, PEDIDOS, old)
  assert.deepEqual([stale.statusCode, codeOf(stale)], [401, 'APP_SESSION_INVALID'])
  assert.deepEqual(
    await hub.test.asOwner(
      `select count(*)::int as n from apps.app_session where host_label = $1`,
      [PEDIDOS],
    ),
    [{ n: 0 }],
  )
  assert.equal((await check(hub, PEDIDOS, await sessionOf(hub, ana, PEDIDOS))).statusCode, 200)
})

test('borda: as rotas do despachante só na porta de borda, as do Hub só na pública: 404', async (t) => {
  const { hub, bruno, companyId } = await companyWithApps(t)
  const session = await sessionOf(hub, bruno, PEDIDOS)
  const onPublic = await Promise.all([
    hub.app.inject({ method: 'POST', url: '/api/app-sessions', headers: { origin: TEST_ORIGIN } }),
    hub.app.inject({
      method: 'GET',
      url: `/api/app-sessions/current?host=${PEDIDOS}`,
      headers: { [APP_SESSION_HEADER]: session },
    }),
  ])
  const onEdge = await Promise.all([
    hub.edge.inject({
      method: 'GET',
      url: `/api/companies/${companyId}`,
      headers: { cookie: bruno.cookie },
    }),
    hub.edge.inject({
      method: 'POST',
      url: '/api/apps/handoffs',
      headers: { cookie: bruno.cookie },
    }),
    hub.edge.inject({ method: 'GET', url: '/api/status' }),
    hub.edge.inject({ method: 'GET', url: '/' }),
  ])
  assert.deepEqual(
    [...onPublic, ...onEdge].map((answer) => [answer.statusCode, codeOf(answer)]),
    Array(6).fill([404, 'NOT_FOUND']),
  )
})

test('checagem com versão no ar: o Worker dela e o banco do login de execução; sem versão, o exemplo', async (t) => {
  const { hub, ana, bruno, projectId, versions, owner } = await companyForVersions(t)
  const session = await sessionOf(hub, bruno, PEDIDOS)
  assert.deepEqual(Object(Object(await check(hub, PEDIDOS, session)).json()).version, {
    example: true,
  })
  const version = Object(Object(await send(hub, ana, versions)).json()).version
  const checked = Object(Object(await check(hub, PEDIDOS, session)).json())
  assert.deepEqual(checked.version, { worker: `v-${version.id}` })
  assert.deepEqual(checked.database, {
    host: new URL(owner.reveal()).hostname,
    database: 'neondb',
    login: `app_${projectId}_run`,
  })
})
