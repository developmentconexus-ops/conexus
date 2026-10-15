import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import { createHub } from '../../main.ts'
import { createTestDatabase, TEST_ORIGIN, testConfig } from '../../platform/test-database.ts'
import { createStatus } from '../status/public.ts'
import { createIdentity } from './public.ts'

const silent = { info: () => undefined, error: () => undefined }
const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
const PASSWORD = 'senha-certa-1'
const SESSIONS = '/api/sessions/current'
const CLIENT = '203.0.113.7'
const WRITE = {
  origin: TEST_ORIGIN,
  'content-type': 'application/json',
  'cf-connecting-ip': CLIENT,
}
const COOKIE =
  /^__Host-conexus_session=([^;]+); Max-Age=1800; Path=\/; HttpOnly; Secure; SameSite=Lax$/

async function hubOn(t: TestContext) {
  const test = await createTestDatabase(t)
  const config = testConfig(test.runtimeUrl)
  const status = createStatus({ version: config.version, database: test.database })
  const identity = createIdentity({ database: test.database, config, log: silent })
  const app = await createHub(config, { status, identity })
  t.after(() => app.close())
  await test.asOwner(`insert into auth.user (id, name, email) values ($1, $2, $3)`, [
    ANA.id,
    ANA.name,
    ANA.email,
  ])
  await test.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ('account-ana', $1, 'credential', $1, $2, now())`,
    [ANA.id, await hashPassword(PASSWORD)],
  )
  return { app, test }
}

type Hub = Awaited<ReturnType<typeof hubOn>>

function signIn(hub: Hub, body: unknown, headers: Record<string, string> = {}) {
  return hub.app.inject({
    method: 'PUT',
    url: SESSIONS,
    headers: { ...WRITE, ...headers },
    payload: JSON.stringify(body),
  })
}

async function signedIn(hub: Hub): Promise<string> {
  const response = await signIn(hub, { email: ANA.email, password: PASSWORD })
  assert.equal(response.statusCode, 200)
  return String(response.headers['set-cookie']).split(';')[0] ?? ''
}

function read(hub: Hub, cookie?: string) {
  return hub.app.inject({ method: 'GET', url: SESSIONS, headers: cookie ? { cookie } : {} })
}

function signOut(hub: Hub, cookie: string, headers: Record<string, string> = {}) {
  return hub.app.inject({
    method: 'DELETE',
    url: SESSIONS,
    headers: { origin: TEST_ORIGIN, cookie, ...headers },
  })
}

function problem(response: { json(): unknown }) {
  const { traceId, ...rest } = Object(response.json())
  assert.match(String(traceId), /^[0-9a-f-]{36}$/)
  return rest
}

function refusal(code: string, status: number, title: string) {
  return { type: `urn:conexus:problem:${code}`, title, status, code }
}

const SESSION_REQUIRED = refusal('SESSION_REQUIRED', 401, 'Sua sessão terminou.')

test('cópia do banco: o cookie abre; sem cookie, com o token cru da tabela ou com assinatura forjada, 401', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  const ok = await read(hub, cookie)
  assert.equal(ok.statusCode, 200)
  assert.equal(ok.body, JSON.stringify({ person: ANA }))
  const [row] = await hub.test.asOwner('select token from auth.session')
  const forged = `${cookie.split('.')[0]}.${'A'.repeat(43)}%3D`
  for (const attempt of [undefined, `__Host-conexus_session=${String(row?.token)}`, forged]) {
    const response = await read(hub, attempt)
    assert.equal(response.statusCode, 401, String(attempt))
    assert.deepEqual(problem(response), SESSION_REQUIRED)
  }
})

test('linha apagada: a sessão apagada no banco não abre mais', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner('delete from auth.session')
  assert.equal((await read(hub, cookie)).statusCode, 401)
})

test('prazo ocioso: sem uso há mais de 1800 s, 401; usada depois de 60 s, volta com o cookie renovado', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner(`update auth.session set expires_at = now() + interval '1739 seconds'`)
  const renewed = await read(hub, cookie)
  assert.equal(renewed.statusCode, 200)
  assert.match(String(renewed.headers['set-cookie']), COOKIE)
  const [left] = await hub.test.asOwner(
    `select expires_at > now() + interval '1790 seconds' as renewed from auth.session`,
  )
  assert.deepEqual(left, { renewed: true })
  await hub.test.asOwner(`update auth.session set expires_at = now() - interval '1 second'`)
  assert.equal((await read(hub, cookie)).statusCode, 401)
})

test('prazo total: em uso e criada há mais de 8 h, 401 e a linha some', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner(`update auth.session set created_at = now() - interval '8 hours 1 second'`)
  const response = await read(hub, cookie)
  assert.equal(response.statusCode, 401)
  assert.deepEqual(problem(response), SESSION_REQUIRED)
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as rows from auth.session'), [
    { rows: 0 },
  ])
})

test('relógio do banco: expires_at no futuro pelo processo e no passado pelo banco, 401', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner(`update auth.session set expires_at = now() - interval '1 second'`)
  t.mock.timers.enable({ apis: ['Date'], now: Date.now() - 600_000 })
  const response = await read(hub, cookie)
  t.mock.timers.reset()
  assert.equal(response.statusCode, 401)
})

test('sair: 204, a linha some, o cookie expira; o mesmo cookie em seguida, 401', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  const response = await signOut(hub, cookie)
  assert.equal(response.statusCode, 204)
  assert.equal(response.body, '')
  assert.ok(
    [response.headers['set-cookie']]
      .flat()
      .includes('__Host-conexus_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax'),
    String(response.headers['set-cookie']),
  )
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as rows from auth.session'), [
    { rows: 0 },
  ])
  assert.equal((await read(hub, cookie)).statusCode, 401)
})

test('sair falha: com o DELETE recusado pelo banco, 503, cookie mantido e sessão viva', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner('revoke delete on auth.session from hub_runtime')
  const response = await signOut(hub, cookie)
  assert.equal(response.statusCode, 503)
  assert.deepEqual(
    problem(response),
    refusal('DATABASE_UNAVAILABLE', 503, 'O banco do Conexus não respondeu.'),
  )
  assert.equal(response.headers['set-cookie'], undefined)
  assert.equal((await read(hub, cookie)).statusCode, 200)
})

// Every endpoint of better-auth 1.7.8 (auth.api), with its methods; none is routed.
const LIBRARY_PATHS: [string, readonly ('GET' | 'POST')[]][] = [
  ['/sign-in/social', ['POST']],
  ['/callback/google', ['GET', 'POST']],
  ['/get-session', ['GET', 'POST']],
  ['/sign-out', ['POST']],
  ['/sign-up/email', ['POST']],
  ['/sign-in/email', ['POST']],
  ['/reset-password', ['POST']],
  ['/verify-password', ['POST']],
  ['/verify-email', ['GET']],
  ['/send-verification-email', ['POST']],
  ['/change-email', ['POST']],
  ['/change-password', ['POST']],
  ['/update-session', ['POST']],
  ['/update-user', ['POST']],
  ['/delete-user', ['POST']],
  ['/request-password-reset', ['POST']],
  ['/reset-password/some-token', ['GET']],
  ['/list-sessions', ['GET']],
  ['/revoke-session', ['POST']],
  ['/revoke-sessions', ['POST']],
  ['/revoke-other-sessions', ['POST']],
  ['/link-social', ['POST']],
  ['/list-accounts', ['GET']],
  ['/delete-user/callback', ['GET']],
  ['/unlink-account', ['POST']],
  ['/refresh-token', ['POST']],
  ['/get-access-token', ['POST']],
  ['/account-info', ['GET']],
  ['/ok', ['GET']],
  ['/error', ['GET']],
]

test('caminhos da biblioteca: cada caminho de /api/auth/* responde 404', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  for (const [path, methods] of LIBRARY_PATHS) {
    for (const method of methods) {
      const response = await hub.app.inject({
        method,
        url: `/api/auth${path}`,
        headers: { ...WRITE, cookie },
        ...(method === 'POST'
          ? { payload: JSON.stringify({ email: ANA.email, name: 'x', password: 'outra-senha-1' }) }
          : {}),
      })
      assert.equal(response.statusCode, 404, `${method} ${path}`)
      assert.equal(problem(response).code, 'NOT_FOUND')
    }
  }
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as people from auth.user'), [
    { people: 1 },
  ])
})
