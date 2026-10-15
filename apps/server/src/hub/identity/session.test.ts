import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import { z } from 'zod'
import { createHub, identityOf } from '../../main.ts'
import { createTestDatabase, TEST_ORIGIN, testConfig } from '../../platform/test-database.ts'
import { createStatus } from '../status/public.ts'
import { createAuth } from './public.ts'

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
  const identity = identityOf({ database: test.database, config, log: silent })
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

const SIGNED_OUT = JSON.stringify({ state: 'SIGNED_OUT' })

async function signedOutRead(hub: Hub, cookie?: string) {
  const response = await read(hub, cookie)
  assert.equal(response.statusCode, 200, String(cookie))
  assert.equal(response.body, SIGNED_OUT, String(cookie))
}

test('cópia do banco: o cookie abre; sem cookie, com o token cru da tabela ou com assinatura forjada, ninguém', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  const ok = await read(hub, cookie)
  assert.equal(ok.statusCode, 200)
  assert.equal(ok.body, JSON.stringify({ state: 'SIGNED_IN', person: ANA }))
  const [row] = await hub.test.asOwner('select token from auth.session')
  const forged = `${cookie.split('.')[0]}.${'A'.repeat(43)}%3D`
  for (const attempt of [undefined, `__Host-conexus_session=${String(row?.token)}`, forged]) {
    await signedOutRead(hub, attempt)
  }
})

test('linha apagada: a sessão apagada no banco não abre mais', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner('delete from auth.session')
  await signedOutRead(hub, cookie)
})

test('prazo ocioso: sem uso há mais de 1800 s, ninguém; usada depois de 60 s, volta com o cookie renovado', async (t) => {
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
  await signedOutRead(hub, cookie)
})

test('prazo total: em uso e criada há mais de 8 h, ninguém e a linha some', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner(`update auth.session set created_at = now() - interval '8 hours 1 second'`)
  await signedOutRead(hub, cookie)
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as rows from auth.session'), [
    { rows: 0 },
  ])
})

test('sair: 204, a linha some, o cookie expira; o mesmo cookie em seguida, ninguém', async (t) => {
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
  await signedOutRead(hub, cookie)
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
  assert.equal(JSON.parse((await read(hub, cookie)).body).state, 'SIGNED_IN')
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

const Endpoint = z.object({
  path: z.string(),
  options: z.object({ method: z.union([z.string(), z.array(z.string())]) }),
})

test('LT12: cada caminho de organização e de administração da biblioteca responde 404 e nada muda', async (t) => {
  const hub = await hubOn(t)
  await hub.test.asOwner(`update auth.user set role = 'admin' where id = $1`, [ANA.id])
  const cookie = await signedIn(hub)
  const auth = createAuth({
    database: hub.test.database,
    config: testConfig(hub.test.runtimeUrl),
    log: silent,
  })
  const plugged = Object.values(auth.api)
    // Each endpoint is a function that carries its path and options as properties.
    .map((endpoint) =>
      Endpoint.safeParse({
        path: Reflect.get(endpoint, 'path'),
        options: Reflect.get(endpoint, 'options'),
      }),
    )
    .flatMap((endpoint) => (endpoint.success ? [endpoint.data] : []))
    .filter((endpoint) => /^\/(organization|admin)\//.test(endpoint.path))
  assert.equal(plugged.length, 37)
  for (const { path, options } of plugged) {
    for (const method of [options.method].flat()) {
      const response = await hub.app.inject({
        method: method === 'GET' ? 'GET' : 'POST',
        url: `/api/auth${path}`,
        headers: { ...WRITE, cookie },
        ...(method === 'GET'
          ? {}
          : { payload: JSON.stringify({ name: 'x', slug: 'x', role: 'admin' }) }),
      })
      assert.deepEqual([response.statusCode, problem(response).code], [404, 'NOT_FOUND'], path)
    }
  }
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as companies from auth.company'), [
    { companies: 0 },
  ])
})
