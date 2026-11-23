import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { test } from 'node:test'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { queued, TEST_ORIGIN, withOwnerLock } from '../../platform/test-database.ts'
import type { Hub } from '../identity/test-hub.ts'
import { call, codeOf, personOn, post } from '../identity/test-hub.ts'
import {
  browser,
  codeFor,
  companyWithApps,
  ESTOQUE,
  ESTOQUE_PREVIA,
  openPath,
  PEDIDOS,
  PEDIDOS_PREVIA,
  redeem,
  sessionOf,
} from './test-handoff.ts'
import { companyForVersions, folder, send, versionNumbered } from './test-versions.ts'

function check(hub: Hub, host: string, session: string) {
  return hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${host}`,
    headers: { [APP_SESSION_HEADER]: session },
  })
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
  const session = await sessionOf(hub, bruno, PEDIDOS_PREVIA)
  const checked = await check(hub, PEDIDOS_PREVIA, session)
  assert.equal(checked.statusCode, 200)
  assert.deepEqual(checked.json(), {
    caller: {
      personId: bruno.id,
      personName: 'Bruno Reis',
      projectId,
      projectName: 'Pedidos',
      access: { kind: 'BUILDER' },
    },
    version: { example: true },
    database: null,
  })
  const missing = await hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${PEDIDOS_PREVIA}`,
  })
  const elsewhere = await check(hub, ESTOQUE, session)
  assert.deepEqual(
    [missing, elsewhere].map((response) => [response.statusCode, codeOf(response)]),
    Array(2).fill([401, 'APP_SESSION_INVALID']),
  )
  const signedOut = await call(hub, bruno, 'DELETE', '/api/sessions/current')
  assert.equal(signedOut.statusCode, 204)
  assert.equal((await check(hub, PEDIDOS_PREVIA, session)).statusCode, 401)
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
  const live = await sessionOf(hub, again, PEDIDOS_PREVIA)
  assert.equal((await check(hub, PEDIDOS_PREVIA, live)).statusCode, 200)
  await hub.test.asOwner(
    `update auth.session set expires_at = now() - interval '1 second' where user_id = $1`,
    [again.id],
  )
  const expired = await check(hub, PEDIDOS_PREVIA, live)
  assert.deepEqual([expired.statusCode, codeOf(expired)], [401, 'APP_SESSION_INVALID'])
})

test('checagem: tirado e empresa marcada 403, Projeto apagado 404, já na chamada seguinte', async (t) => {
  const { hub, ana, bruno, companyId, project } = await companyWithApps(t)
  const brunos = await sessionOf(hub, bruno, PEDIDOS_PREVIA)
  const anas = await sessionOf(hub, ana, PEDIDOS_PREVIA)
  const estoque = await sessionOf(hub, ana, ESTOQUE_PREVIA)
  assert.equal((await check(hub, PEDIDOS_PREVIA, brunos)).statusCode, 200)
  await hub.test.asOwner(`delete from auth.member where user_id = $1`, [bruno.id])
  const removed = await check(hub, PEDIDOS_PREVIA, brunos)
  assert.deepEqual([removed.statusCode, codeOf(removed)], [403, 'APP_ACCESS_REFUSED'])
  assert.equal((await check(hub, PEDIDOS_PREVIA, anas)).statusCode, 200)
  const deleted = await call(hub, ana, 'DELETE', project, { name: 'Pedidos' })
  assert.equal(deleted.statusCode, 204)
  const gone = await check(hub, PEDIDOS_PREVIA, anas)
  assert.deepEqual([gone.statusCode, codeOf(gone)], [404, 'APP_NOT_FOUND'])
  assert.equal((await check(hub, ESTOQUE_PREVIA, estoque)).statusCode, 200)
  await hub.test.asOwner(`update auth.company set deleting_since = now() where id = $1`, [
    companyId,
  ])
  const marked = await check(hub, ESTOQUE_PREVIA, estoque)
  assert.deepEqual([marked.statusCode, codeOf(marked)], [403, 'APP_ACCESS_REFUSED'])
})

test('checagem: o Projeto apagado e criado de novo com o nome pede outra entrada, 401, e a sessão velha sai', async (t) => {
  const { hub, ana, project } = await companyWithApps(t)
  const old = await sessionOf(hub, ana, PEDIDOS_PREVIA)
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Pedidos' })).statusCode, 204)
  const projects = project.slice(0, project.lastIndexOf('/'))
  assert.equal((await post(hub, ana, projects, { name: 'Pedidos' })).statusCode, 201)
  const stale = await check(hub, PEDIDOS_PREVIA, old)
  assert.deepEqual([stale.statusCode, codeOf(stale)], [401, 'APP_SESSION_INVALID'])
  assert.deepEqual(
    await hub.test.asOwner(
      `select count(*)::int as n from apps.app_session where host_label = $1`,
      [PEDIDOS_PREVIA],
    ),
    [{ n: 0 }],
  )
  assert.equal(
    (await check(hub, PEDIDOS_PREVIA, await sessionOf(hub, ana, PEDIDOS_PREVIA))).statusCode,
    200,
  )
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
  const session = await sessionOf(hub, bruno, PEDIDOS_PREVIA)
  assert.deepEqual(Object(Object(await check(hub, PEDIDOS_PREVIA, session)).json()).version, {
    example: true,
  })
  const version = await versionNumbered(subject, (await send(subject, ana)).number)
  const checked = Object(Object(await check(hub, PEDIDOS_PREVIA, session)).json())
  assert.deepEqual(checked.version, { worker: `v-${version.id}` })
  assert.deepEqual(checked.database, {
    host: new URL(owner.reveal()).hostname,
    database: 'neondb',
    login: `app_${projectId}_run`,
  })
})

test('o host diz a versão: a mesma pessoa recebe a publicada no host do app e a da Prévia no dela', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, versions } = subject
  const tab = await sessionOf(hub, bruno, PEDIDOS)
  const frame = await sessionOf(hub, bruno, PEDIDOS_PREVIA)
  const one = await versionNumbered(subject, (await send(subject, ana)).number)
  const published = `${versions.replace(/\/versions$/, '')}/published-version`
  assert.equal((await call(hub, ana, 'PUT', published, { number: 1 })).statusCode, 200)
  const two = await versionNumbered(
    subject,
    (await send(subject, ana, folder({}, '#6b2fa3'))).number,
  )
  // The new send moved the Prévia, and the tab stays on the published version.
  assert.deepEqual(
    [await check(hub, PEDIDOS, tab), await check(hub, PEDIDOS_PREVIA, frame)].map(workerOf),
    [`v-${one.id}`, `v-${two.id}`],
  )
  assert.equal((await call(hub, ana, 'PUT', published, { number: 2 })).statusCode, 200)
  assert.equal(workerOf(await check(hub, PEDIDOS, tab)), `v-${two.id}`)
})

test('antes do primeiro Publicar: o host do app recebe 404 APP_NOT_PUBLISHED e o da Prévia, a Prévia', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno } = subject
  const tab = await sessionOf(hub, bruno, PEDIDOS)
  const frame = await sessionOf(hub, bruno, PEDIDOS_PREVIA)
  const before = await check(hub, PEDIDOS, tab)
  assert.deepEqual([before.statusCode, codeOf(before)], [404, 'APP_NOT_PUBLISHED'])
  assert.deepEqual(Object(Object(await check(hub, PEDIDOS_PREVIA, frame)).json()).version, {
    example: true,
  })
  const one = await versionNumbered(subject, (await send(subject, ana)).number)
  const after = await check(hub, PEDIDOS, tab)
  assert.deepEqual([after.statusCode, codeOf(after)], [404, 'APP_NOT_PUBLISHED'])
  assert.equal(workerOf(await check(hub, PEDIDOS_PREVIA, frame)), `v-${one.id}`)
})

test('a sessão é do host em que foi trocada: a da Prévia no host do app 401, e a do app no da Prévia', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const frame = await sessionOf(hub, bruno, PEDIDOS_PREVIA)
  const tab = await sessionOf(hub, bruno, PEDIDOS)
  const crossed = [await check(hub, PEDIDOS, frame), await check(hub, PEDIDOS_PREVIA, tab)]
  assert.deepEqual(
    crossed.map((answer) => [answer.statusCode, codeOf(answer)]),
    Array(2).fill([401, 'APP_SESSION_INVALID']),
  )
  assert.equal((await check(hub, PEDIDOS_PREVIA, frame)).statusCode, 200)
})

test('uma sessão da Prévia de antes, com o rótulo do app, vale no host do app e recebe a publicada', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, bruno, versions } = subject
  const old = await sessionOf(hub, bruno, PEDIDOS)
  // Before the Prévia had its own host, its pass was made on the app's and its row said `preview`.
  await hub.test.asOwner(`update apps.app_session set environment = 'preview'`)
  const one = await versionNumbered(subject, (await send(subject, ana)).number)
  const published = `${versions.replace(/\/versions$/, '')}/published-version`
  assert.equal((await call(hub, ana, 'PUT', published, { number: 1 })).statusCode, 200)
  await versionNumbered(subject, (await send(subject, ana, folder({}, '#6b2fa3'))).number)
  assert.equal(workerOf(await check(hub, PEDIDOS, old)), `v-${one.id}`)
  const crossed = await check(hub, PEDIDOS_PREVIA, old)
  assert.deepEqual([crossed.statusCode, codeOf(crossed)], [401, 'APP_SESSION_INVALID'])
})
