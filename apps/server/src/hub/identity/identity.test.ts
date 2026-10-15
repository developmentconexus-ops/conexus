import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { hashPassword } from 'better-auth/crypto'
import type { InjectOptions } from 'fastify'
import { createHub } from '../../main.ts'
import {
  createTestDatabase,
  serveEnvironment,
  spawnHub,
  TEST_ORIGIN,
  testConfig,
} from '../../platform/test-database.ts'
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

test('entrar: 200 com a pessoa e um só cookie, __Host-, Secure, HttpOnly, SameSite=Lax, sem Domain', async (t) => {
  const hub = await hubOn(t)
  const response = await signIn(hub, { email: ANA.email, password: PASSWORD })
  assert.equal(response.statusCode, 200)
  assert.equal(response.body, JSON.stringify({ person: ANA }))
  const cookies = [response.headers['set-cookie']].flat()
  assert.equal(cookies.length, 1)
  assert.match(String(cookies[0]), COOKIE)
})

test('recusa: e-mail desconhecido e senha errada dão o mesmo 401 SIGN_IN_REFUSED', async (t) => {
  const hub = await hubOn(t)
  const unknown = await signIn(hub, { email: 'ninguem@example.test', password: PASSWORD })
  const wrong = await signIn(hub, { email: ANA.email, password: 'senha-errada' })
  const expected = refusal('SIGN_IN_REFUSED', 401, 'E-mail ou senha não conferem.')
  assert.equal(unknown.statusCode, 401)
  assert.equal(wrong.statusCode, 401)
  assert.deepEqual(problem(unknown), expected)
  assert.deepEqual(problem(wrong), expected)
  assert.equal(unknown.headers['set-cookie'], undefined)
})

test('limite: a 11ª tentativa em 60 s é 429 mesmo com a senha certa; outro endereço entra; depois de 60 s o primeiro entra', async (t) => {
  const hub = await hubOn(t)
  for (let attempt = 1; attempt <= 10; attempt++) {
    const response = await signIn(hub, { email: ANA.email, password: 'senha-errada' })
    assert.equal(response.statusCode, 401, `tentativa ${attempt}`)
  }
  const right = { email: ANA.email, password: PASSWORD }
  const eleventh = await signIn(hub, right)
  assert.equal(eleventh.statusCode, 429)
  assert.deepEqual(
    problem(eleventh),
    refusal('SIGN_IN_ATTEMPTS_EXCEEDED', 429, 'Muitas tentativas de entrada deste endereço.'),
  )
  assert.equal((await signIn(hub, right, { 'cf-connecting-ip': '198.51.100.9' })).statusCode, 200)
  await hub.test.asOwner('update auth.rate_limit set last_request = last_request - 61000')
  assert.equal((await signIn(hub, right)).statusCode, 200)
})

const ORIGIN_REFUSALS: [string, Record<string, string | null>][] = [
  ['sem Origin', { origin: null }],
  ['com Origin de outro site', { origin: 'https://other.example.test' }],
  ['com Sec-Fetch-Site cross-site', { 'sec-fetch-site': 'cross-site' }],
]
for (const [name, headers] of ORIGIN_REFUSALS) {
  test(`origem: ${name}, 403 REQUEST_ORIGIN_REFUSED em PUT e DELETE, antes do corpo`, async (t) => {
    const hub = await hubOn(t)
    const cookie = await signedIn(hub)
    function sent(base: Record<string, string>): Record<string, string> {
      const merged: [string, string | null][] = Object.entries({ ...base, ...headers })
      const kept: [string, string][] = []
      for (const [name, value] of merged) if (value !== null) kept.push([name, value])
      return Object.fromEntries(kept)
    }
    const put = await hub.app.inject({
      method: 'PUT',
      url: SESSIONS,
      headers: sent(WRITE),
      payload: '{not json',
    })
    const del = await hub.app.inject({
      method: 'DELETE',
      url: SESSIONS,
      headers: sent({ ...WRITE, cookie }),
      payload: '{not json',
    })
    const expected = refusal(
      'REQUEST_ORIGIN_REFUSED',
      403,
      'O Conexus recusou um pedido que não veio das suas páginas.',
    )
    for (const response of [put, del]) {
      assert.equal(response.statusCode, 403)
      assert.deepEqual(problem(response), expected)
    }
    assert.equal((await read(hub, cookie)).statusCode, 200)
  })
}

const MEDIA: [string, string, string, number, string][] = [
  ['formulário', 'application/x-www-form-urlencoded', 'email=a', 415, 'REQUEST_MEDIA_TYPE_REFUSED'],
  ['multipart', 'multipart/form-data; boundary=x', '--x--', 415, 'REQUEST_MEDIA_TYPE_REFUSED'],
  ['text/plain', 'text/plain', '{}', 415, 'REQUEST_MEDIA_TYPE_REFUSED'],
  ['JSON inválido', 'application/json', '{"email":', 400, 'REQUEST_MALFORMED'],
  [
    'corpo acima de 4 KiB',
    'application/json',
    JSON.stringify({ x: 'x'.repeat(4200) }),
    413,
    'REQUEST_TOO_LARGE',
  ],
]
for (const [name, type, payload, status, code] of MEDIA) {
  test(`mídia: ${name}, ${status} ${code} em PUT e DELETE`, async (t) => {
    const hub = await hubOn(t)
    const cookie = await signedIn(hub)
    for (const method of ['PUT', 'DELETE'] as const) {
      const response = await hub.app.inject({
        method,
        url: SESSIONS,
        headers: { ...WRITE, cookie, 'content-type': type },
        payload,
      } satisfies InjectOptions)
      assert.equal(response.statusCode, status, method)
      assert.equal(problem(response).code, code, method)
    }
  })
}

test('endereço: PUT sem cf-connecting-ip, 400 REQUEST_MALFORMED', async (t) => {
  const hub = await hubOn(t)
  const response = await hub.app.inject({
    method: 'PUT',
    url: SESSIONS,
    headers: { origin: TEST_ORIGIN, 'content-type': 'application/json' },
    payload: JSON.stringify({ email: ANA.email, password: PASSWORD }),
  })
  assert.equal(response.statusCode, 400)
  assert.deepEqual(
    problem(response),
    refusal('REQUEST_MALFORMED', 400, 'O Conexus não entendeu o pedido.'),
  )
})

test('banco dorme: depois do último pedido a cada rota, o pool chega a zero conexões', async (t) => {
  const hub = await hubOn(t)
  const cookie = await signedIn(hub)
  await signIn(hub, { email: ANA.email, password: 'senha-errada' })
  await read(hub, cookie)
  await signOut(hub, cookie)
  await hub.test.database.whenIdle()
  const open = await hub.test.asOwner(`select count(*)::int as open from pg_stat_activity
    where datname = current_database() and usename = 'hub_runtime'`)
  assert.deepEqual(open, [{ open: 0 }])
})

test('registros: entrar, recusa, limite e sair deixam cada um o seu código, sempre com o id de rastreio, nunca o e-mail', async (t) => {
  const hub = await hubOn(t)
  const { port, lines, stop } = await spawnHub(t, serveEnvironment(t, hub.test.runtimeUrl))
  const url = `http://127.0.0.1:${port}${SESSIONS}`
  async function put(password: string, ip = CLIENT) {
    const body = JSON.stringify({ email: ANA.email, password })
    return fetch(url, { method: 'PUT', headers: { ...WRITE, 'cf-connecting-ip': ip }, body })
  }
  const entered = await put(PASSWORD, '198.51.100.9')
  const cookie = String(entered.headers.get('set-cookie')).split(';')[0] ?? ''
  for (let attempt = 0; attempt < 11; attempt++) await put('senha-errada')
  const out = await fetch(url, { method: 'DELETE', headers: { origin: TEST_ORIGIN, cookie } })
  assert.deepEqual([entered.status, out.status], [200, 204])
  await stop()
  // Served lines sit between the start and the stop; boot lines carry no request.
  const served = lines.slice(
    lines.findIndex((line) => line.msg === 'LISTENING') + 1,
    lines.findIndex((line) => line.msg === 'SHUTTING_DOWN'),
  )
  assert.ok(
    served.some((line) => String(line.msg).startsWith('AUTH_LIBRARY_')),
    'a library line was written',
  )
  for (const line of served) {
    assert.match(String(line.traceId), /^[0-9a-f-]{36}$/, JSON.stringify(line))
  }
  const codes = new Set(served.map((line) => line.msg))
  for (const code of [
    'SESSION_CREATED',
    'SIGN_IN_REFUSED',
    'SIGN_IN_ATTEMPTS_EXCEEDED',
    'SESSION_ENDED',
  ]) {
    assert.ok(codes.has(code), code)
  }
  const output = JSON.stringify(lines)
  assert.doesNotMatch(output, /ana@example\.test/)
  assert.doesNotMatch(output, new RegExp(PASSWORD))
})
