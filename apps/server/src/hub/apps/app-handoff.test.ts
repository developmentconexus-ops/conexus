import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { test } from 'node:test'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { queued, TEST_ORIGIN, withOwnerLock } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import { call, codeOf, personOn, post } from '../identity/test-hub.ts'
import {
  browser,
  companyWithApps,
  ESTOQUE,
  frameHandoff,
  handoff,
  openPath,
  PEDIDOS,
} from './test-handoff.ts'
import { companyForVersions, folder, send, versionNumbered } from './test-versions.ts'

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

/**
 * The pass the Hub gives the person for this browser, as the code in its location: a tab's, through
 * `/apps/open`, or the Prévia frame's.
 */
async function codeFor(
  hub: Hub,
  person: Person,
  host: string,
  hash: string,
  environment: 'preview' | 'published' = 'published',
) {
  const body = { host, binding: hash }
  const made =
    environment === 'published'
      ? await handoff(hub, person, body)
      : await frameHandoff(hub, person, body)
  assert.equal(made.statusCode, environment === 'published' ? 303 : 200)
  const location =
    environment === 'published' ? made.headers.location : Object(made.json()).location
  return String(new URL(String(location)).searchParams.get('code'))
}

/** An app session of the person on the host, as the dispatcher holds it. */
async function sessionOf(
  hub: Hub,
  person: Person,
  host: string,
  environment: 'preview' | 'published' = 'preview',
) {
  const { binding, hash } = browser()
  const redeemed = await redeem(hub, {
    host,
    code: await codeFor(hub, person, host, hash, environment),
    binding,
  })
  assert.equal(redeemed.statusCode, 201)
  return String(Object(redeemed.json()).session)
}

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
      method: 'GET',
      url: openPath({ host: PEDIDOS, binding: browser().hash }),
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

function workerOf(answer: { json(): unknown }) {
  return Object(Object(answer.json()).version).worker
}

test('checagem com versão na Prévia: o Worker dela e o banco do login de execução; sem versão, o exemplo', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, projectId, owner } = subject
  const session = await sessionOf(hub, bruno, PEDIDOS)
  assert.deepEqual(Object(Object(await check(hub, PEDIDOS, session)).json()).version, {
    example: true,
  })
  const version = await versionNumbered(subject, (await send(subject, ana)).number)
  const checked = Object(Object(await check(hub, PEDIDOS, session)).json())
  assert.deepEqual(checked.version, { worker: `v-${version.id}` })
  assert.deepEqual(checked.database, {
    host: new URL(owner.reveal()).hostname,
    database: 'neondb',
    login: `app_${projectId}_run`,
  })
})

test('a aba recebe a publicada e a moldura a da Prévia', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, versions } = subject
  const tab = await sessionOf(hub, bruno, PEDIDOS, 'published')
  const frame = await sessionOf(hub, bruno, PEDIDOS, 'preview')
  const one = await versionNumbered(subject, (await send(subject, ana)).number)
  const published = `${versions.replace(/\/versions$/, '')}/published-version`
  assert.equal((await call(hub, ana, 'PUT', published, { number: 1 })).statusCode, 200)
  const two = await versionNumbered(
    subject,
    (await send(subject, ana, folder({}, '#6b2fa3'))).number,
  )
  // The new send moved the Prévia, and the tab stays on the published version.
  assert.deepEqual(
    [await check(hub, PEDIDOS, tab), await check(hub, PEDIDOS, frame)].map(workerOf),
    [`v-${one.id}`, `v-${two.id}`],
  )
  assert.equal((await call(hub, ana, 'PUT', published, { number: 2 })).statusCode, 200)
  assert.equal(workerOf(await check(hub, PEDIDOS, tab)), `v-${two.id}`)
})

test('antes do primeiro Publicar: a aba recebe 404 APP_NOT_PUBLISHED e a moldura, a Prévia', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno } = subject
  const tab = await sessionOf(hub, bruno, PEDIDOS, 'published')
  const frame = await sessionOf(hub, bruno, PEDIDOS, 'preview')
  const before = await check(hub, PEDIDOS, tab)
  assert.deepEqual([before.statusCode, codeOf(before)], [404, 'APP_NOT_PUBLISHED'])
  assert.deepEqual(Object(Object(await check(hub, PEDIDOS, frame)).json()).version, {
    example: true,
  })
  const one = await versionNumbered(subject, (await send(subject, ana)).number)
  const after = await check(hub, PEDIDOS, tab)
  assert.deepEqual([after.statusCode, codeOf(after)], [404, 'APP_NOT_PUBLISHED'])
  assert.equal(workerOf(await check(hub, PEDIDOS, frame)), `v-${one.id}`)
})
