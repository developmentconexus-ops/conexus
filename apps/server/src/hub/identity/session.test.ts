import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { silent, testConfig, WRITE_HEADERS } from '../../platform/test-database.ts'
import { createAuth } from './public.ts'
import type { Hub } from './test-hub.ts'
import {
  ANA_ACCOUNT,
  hubWithAna,
  problem,
  read,
  refusal,
  SESSION_COOKIE,
  signedIn,
  signOut,
} from './test-hub.ts'

const SIGNED_OUT = JSON.stringify({ state: 'SIGNED_OUT' })

async function signedOutRead(hub: Hub, cookie?: string) {
  const response = await read(hub, cookie)
  assert.equal(response.statusCode, 200, String(cookie))
  assert.equal(response.body, SIGNED_OUT, String(cookie))
}

test('cópia do banco: o cookie abre; sem cookie, com o token cru da tabela ou com assinatura forjada, ninguém', async (t) => {
  const hub = await hubWithAna(t)
  const cookie = await signedIn(hub)
  const ok = await read(hub, cookie)
  assert.equal(ok.statusCode, 200)
  assert.equal(ok.body, JSON.stringify({ state: 'SIGNED_IN', person: ANA_ACCOUNT }))
  const [row] = await hub.test.asOwner('select token from auth.session')
  const forged = `${cookie.split('.')[0]}.${'A'.repeat(43)}%3D`
  for (const attempt of [undefined, `__Host-conexus_session=${String(row?.token)}`, forged]) {
    await signedOutRead(hub, attempt)
  }
})

test('linha apagada: a sessão apagada no banco não abre mais', async (t) => {
  const hub = await hubWithAna(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner('delete from auth.session')
  await signedOutRead(hub, cookie)
})

test('prazo ocioso: sem uso há mais de 1800 s, ninguém; usada depois de 60 s, volta com o cookie renovado', async (t) => {
  const hub = await hubWithAna(t)
  const cookie = await signedIn(hub)
  await hub.test.asOwner(`update auth.session set expires_at = now() + interval '1739 seconds'`)
  const renewed = await read(hub, cookie)
  assert.equal(renewed.statusCode, 200)
  assert.match(String(renewed.headers['set-cookie']), SESSION_COOKIE)
  const [left] = await hub.test.asOwner(
    `select expires_at > now() + interval '1790 seconds' as renewed from auth.session`,
  )
  assert.deepEqual(left, { renewed: true })
  await hub.test.asOwner(`update auth.session set expires_at = now() - interval '1 second'`)
  await signedOutRead(hub, cookie)
})

/**
 * The clock moves until the session is `seconds` old: every time the library wrote moves back by the
 * same span. The age is set, not added to, so the real time the test spends never counts.
 */
async function ageTo(hub: Hub, seconds: number) {
  await hub.test.asOwner(
    `update auth.session set created_at = created_at - make_interval(secs => shift),
      updated_at = updated_at - make_interval(secs => shift),
      expires_at = expires_at - make_interval(secs => shift)
    from (select id, $1 - extract(epoch from statement_timestamp() - created_at) as shift
      from auth.session) as span
    where span.id = session.id`,
    [seconds],
  )
}

test('prazo total: usada a cada 25 min, aberta até 8 h e ninguém depois; a linha some', async (t) => {
  const hub = await hubWithAna(t)
  const cookie = await signedIn(hub)
  for (let minutes = 25; minutes <= 475; minutes += 25) {
    await ageTo(hub, minutes * 60)
    assert.equal(JSON.parse((await read(hub, cookie)).body).state, 'SIGNED_IN', `${minutes} min`)
  }
  await ageTo(hub, 8 * 60 * 60 - 1)
  assert.equal(JSON.parse((await read(hub, cookie)).body).state, 'SIGNED_IN', '8 h menos 1 s')
  await ageTo(hub, 8 * 60 * 60 + 1)
  await signedOutRead(hub, cookie)
  assert.deepEqual(await hub.test.asOwner('select count(*)::int as rows from auth.session'), [
    { rows: 0 },
  ])
})

test('prazo total, sessão renovada pela versão anterior além de 8 h: a primeira leitura protegida às 8 h 1 min, 401', async (t) => {
  const hub = await hubWithAna(t)
  for (const renewed of ['2 minutes', '30 seconds']) {
    const cookie = await signedIn(hub)
    await hub.test.asOwner(
      `update auth.session set created_at = now() - interval '8 hours 1 minute',
        updated_at = now() - $1::interval, expires_at = now() - $1::interval + interval '30 minutes'`,
      [renewed],
    )
    for (const attempt of ['primeira', 'segunda']) {
      const response = await hub.app.inject({
        method: 'GET',
        url: '/api/companies',
        headers: { cookie },
      })
      assert.deepEqual(
        [response.statusCode, Object(response.json()).code],
        [401, 'SESSION_REQUIRED'],
        `renovada há ${renewed}, ${attempt} leitura`,
      )
    }
    await hub.test.asOwner('delete from auth.session')
  }
})

test('sair: 204, a linha some, o cookie expira; o mesmo cookie em seguida, ninguém', async (t) => {
  const hub = await hubWithAna(t)
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
  const hub = await hubWithAna(t)
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
  const hub = await hubWithAna(t)
  const cookie = await signedIn(hub)
  for (const [path, methods] of LIBRARY_PATHS) {
    for (const method of methods) {
      const response = await hub.app.inject({
        method,
        url: `/api/auth${path}`,
        headers: { ...WRITE_HEADERS, cookie },
        ...(method === 'POST'
          ? {
              payload: JSON.stringify({
                email: ANA_ACCOUNT.email,
                name: 'x',
                password: 'outra-senha-1',
              }),
            }
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
  const hub = await hubWithAna(t)
  await hub.test.asOwner(`update auth.user set role = 'admin' where id = $1`, [ANA_ACCOUNT.id])
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
        headers: { ...WRITE_HEADERS, cookie },
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
