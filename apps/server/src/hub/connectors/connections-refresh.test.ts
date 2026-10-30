import assert from 'node:assert/strict'
import { test } from 'node:test'
import { linkMercadoLivre, mercadoLivreOn, standIn, testOf } from './test-connections.ts'

// The double's keys last six hours; a link given one minute is inside the five-minute margin, so its first Testar refreshes.
const SHORT_SECONDS = 60
const LONG_SECONDS = 21_600

type Linked = Awaited<ReturnType<typeof mercadoLivreOn>>

/** Loja 1 linked with a key about to expire; the next keys the double gives last six hours. */
async function nearExpiry(on: Linked) {
  on.fake.switches.expiresInSeconds = SHORT_SECONDS
  const linked = await linkMercadoLivre(on.hub, on.ana, on.companyId)
  on.fake.switches.expiresInSeconds = LONG_SECONDS
  return String(Object(linked.json()).connection.id)
}

async function tested(on: Linked, id: string) {
  const started = performance.now()
  const response = await testOf(on.hub, on.ana, on.base, id)
  return { body: Object(response.json()), elapsed: performance.now() - started }
}

async function rowOf(on: Linked) {
  const [row] = await on.hub.test.asOwner(
    'select state, revision, refresh_until from connectors.connection',
  )
  return row
}

test('uma renovação: dois Testar com a chave vencida', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = await nearExpiry(on)
  const [first, second] = await Promise.all([tested(on, id), tested(on, id)])
  assert.deepEqual([first?.body.result, second?.body.result], ['WORKING', 'WORKING'])
  assert.equal(on.fake.refreshes(), 1)
  assert.deepEqual(await rowOf(on), { state: 'ACTIVE', revision: 1, refresh_until: null })
  assert.ok(on.hub.lines.some((line) => line.message === 'CONNECTION_TOKEN_REFRESHED'))
})

test('o prazo de quem espera: responde no seu prazo, e a renovação de quem a tem grava', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = await nearExpiry(on)
  on.fake.switches.slowMilliseconds = 2_000
  const both = await Promise.all([tested(on, id), tested(on, id)])
  const waiter = both.find((one) => one.body.result === 'UNREACHABLE')
  assert.ok(waiter, 'one of the two waited')
  assert.ok(waiter.elapsed < 1_500, `the waiter answered at ${waiter.elapsed} ms`)
  assert.equal(on.fake.refreshes(), 1)
  assert.equal((await rowOf(on))?.revision, 1)
  on.fake.switches.slowMilliseconds = 0
  assert.equal((await tested(on, id)).body.result, 'WORKING')
  assert.equal(on.fake.refreshes(), 1)
})

test('recusada pelo fornecedor: NEEDS_REAUTH, e o segundo Testar não renova', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = String(
    Object((await linkMercadoLivre(on.hub, on.ana, on.companyId)).json()).connection.id,
  )
  on.fake.expireAccess()
  on.fake.switches.revoke = true
  const refused = (await tested(on, id)).body
  assert.deepEqual(
    [refused.result, refused.native.status, refused.native.code, refused.connection.state],
    ['AUTH_REFUSED', 400, 'invalid_grant', 'NEEDS_REAUTH'],
  )
  const again = (await tested(on, id)).body
  // The read's own 401, not a refresh's 400: nobody asked the double again.
  assert.deepEqual([again.result, again.native.status], ['AUTH_REFUSED', 401])
  assert.deepEqual(await rowOf(on), { state: 'NEEDS_REAUTH', revision: 0, refresh_until: null })
})

test('o app recusado, o fornecedor fora e a resposta ilegível não mudam nada', async (t) => {
  const mode: { refresh: 'pass' | 'unreadable' | 'down' } = { refresh: 'pass' }
  const on = await mercadoLivreOn(t, { through: standIn(t, mode) })
  const id = await nearExpiry(on)
  const unchanged = { state: 'NEW', revision: 0, refresh_until: null }

  on.fake.switches.invalidClient = true
  const app = (await tested(on, id)).body
  assert.deepEqual(
    [app.result, app.native.status, app.native.code],
    ['APP_REFUSED', 401, 'invalid_client'],
  )
  assert.deepEqual(await rowOf(on), unchanged)
  const logged = on.hub.lines.find((line) => line.message === 'CONNECTOR_APP_REFUSED')
  assert.deepEqual([logged?.fields.status, logged?.fields.code], [401, 'invalid_client'])
  on.fake.switches.invalidClient = false

  on.fake.switches.rateLimited = true
  assert.equal((await tested(on, id)).body.result, 'UNREACHABLE')
  assert.deepEqual(await rowOf(on), unchanged)
  on.fake.switches.rateLimited = false

  mode.refresh = 'down'
  assert.equal((await tested(on, id)).body.result, 'UNREACHABLE')
  assert.deepEqual(await rowOf(on), unchanged)
  assert.ok(on.hub.lines.some((line) => line.message === 'CONNECTION_REFRESH_UNANSWERED'))

  mode.refresh = 'unreadable'
  const unread = (await tested(on, id)).body
  assert.deepEqual(
    [unread.result, unread.native.status, unread.native.body],
    ['UNREADABLE', 200, null],
  )
  assert.deepEqual(await rowOf(on), unchanged)
  assert.ok(on.hub.lines.some((line) => line.message === 'CONNECTION_REFRESH_UNREAD'))

  mode.refresh = 'pass'
  assert.equal((await tested(on, id)).body.result, 'WORKING')
  assert.equal(on.fake.refreshes(), 1)
})

test('testar: a conta, uma leitura só; a conta recusada ou o Mercado Livre pedindo para esperar', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = String(
    Object((await linkMercadoLivre(on.hub, on.ana, on.companyId)).json()).connection.id,
  )
  // A permission the app lacks for other reads: Testar does not send them.
  for (const group of ['anuncios', 'vendas']) on.fake.switches.refuseGroups.add(group)
  const working = (await tested(on, id)).body
  assert.deepEqual([working.result, working.connection.state], ['WORKING', 'ACTIVE'])

  on.fake.switches.accountRefused = true
  const refused = (await tested(on, id)).body
  assert.deepEqual(
    [refused.result, refused.read, refused.native.status, refused.native.code],
    ['READ_REFUSED', 'Conta', 403, 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES'],
  )
  assert.deepEqual(refused.connection, working.connection)

  on.fake.switches.accountRefused = false
  on.fake.switches.accountRateLimited = true
  const busy = (await tested(on, id)).body
  assert.deepEqual([busy.result, busy.native.status], ['BUSY', 429])
  assert.deepEqual(busy.connection, working.connection)
})
