import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { SENT_AT } from '../kernel/conformance-declared.ts'
import { answerOf } from '../kernel/conformance-session.ts'
import { refreshRequest } from '../kernel/oauth.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { mercadoLivre } from './definition.ts'
import { mercadoLivreFake } from './fake.ts'
import type { Case } from './recordings.ts'
import { recording } from './recordings.ts'
import { ACCOUNT, authorize, getWith, grant } from './test-session.ts'

const auth = mercadoLivre.auth

test('cada renovação dá uma chave de renovação nova e só a última vale', async () => {
  const fake = mercadoLivreFake()
  const first = await authorize(fake)
  assert.equal(first.kind, 'OK')
  if (first.kind !== 'OK' || first.refreshToken === null) return
  const second = await grant(fake, refreshRequest(auth, fake.app, first.refreshToken))
  assert.equal(second.kind, 'OK')
  if (second.kind !== 'OK' || second.refreshToken === null) return
  assert.notEqual(second.refreshToken, first.refreshToken)
  assert.equal(
    (await grant(fake, refreshRequest(auth, fake.app, first.refreshToken))).kind,
    'GRANT_REFUSED',
  )
  assert.equal((await grant(fake, refreshRequest(auth, fake.app, second.refreshToken))).kind, 'OK')
  assert.equal(fake.refreshes(), 2)
})

test('uma nova autorização da mesma conta derruba a chave de renovação anterior', async () => {
  const fake = mercadoLivreFake()
  const first = await authorize(fake)
  const again = await authorize(fake)
  assert.equal(first.kind, 'OK')
  assert.equal(again.kind, 'OK')
  if (first.kind !== 'OK' || again.kind !== 'OK') return
  assert.equal(
    (await grant(fake, refreshRequest(auth, fake.app, first.refreshToken ?? ''))).kind,
    'GRANT_REFUSED',
  )
  assert.equal(
    (await grant(fake, refreshRequest(auth, fake.app, again.refreshToken ?? ''))).kind,
    'OK',
  )
})

test('outra conta não derruba a chave da primeira', async () => {
  const fake = mercadoLivreFake()
  const first = await authorize(fake)
  fake.switches.account = { ref: '987654321', label: 'OUTRALOJA' }
  assert.equal((await authorize(fake)).kind, 'OK')
  if (first.kind !== 'OK') return
  assert.equal(
    (await grant(fake, refreshRequest(auth, fake.app, first.refreshToken ?? ''))).kind,
    'OK',
  )
})

test('as chaves do dublê: revoke, invalidClient, rateLimited e operator', async () => {
  const fake = mercadoLivreFake()
  const first = await authorize(fake)
  if (first.kind !== 'OK') return assert.fail('first authorization')
  const token = first.refreshToken ?? ''

  fake.switches.rateLimited = true
  assert.equal((await grant(fake, refreshRequest(auth, fake.app, token))).kind, 'UNREADABLE')
  fake.switches.rateLimited = false

  fake.switches.invalidClient = true
  assert.equal((await grant(fake, refreshRequest(auth, fake.app, token))).kind, 'APP_REFUSED')
  fake.switches.invalidClient = false

  fake.switches.revoke = true
  assert.equal((await grant(fake, refreshRequest(auth, fake.app, token))).kind, 'GRANT_REFUSED')
  fake.switches.revoke = false
  assert.equal(fake.refreshes(), 0, 'none of them renewed')

  fake.switches.operator = true
  const operator = await authorize(fake)
  assert.equal(operator.kind, 'GRANT_REFUSED')
  assert.ok('native' in operator)
  assert.equal(operator.native.message, 'invalid_operator_user_id')
})

test('expireAccess dá 401 nas chaves de acesso emitidas, e uma renovação dá uma boa', async () => {
  const fake = mercadoLivreFake()
  const first = await authorize(fake)
  if (first.kind !== 'OK') return assert.fail('first authorization')
  async function read(key: string) {
    return (await getWith(fake, '/users/me', key)).status
  }
  assert.equal(await read(first.accessToken), 200)
  fake.expireAccess()
  assert.equal(await read(first.accessToken), 401)
  const renewed = await grant(fake, refreshRequest(auth, fake.app, first.refreshToken ?? ''))
  if (renewed.kind !== 'OK') return assert.fail('renewal')
  assert.equal(await read(renewed.accessToken), 200)
})

/** Each path of a body (`results[].buyer.id`) with the JSON types seen there, across every element of an array. */
function shapeOf(value: unknown, at = '', found = new Map<string, Set<string>>()) {
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
  found.set(at, (found.get(at) ?? new Set()).add(type))
  if (Array.isArray(value)) for (const item of value) shapeOf(item, `${at}[]`, found)
  else if (typeof value === 'object' && value !== null)
    for (const [key, item] of Object.entries(value)) shapeOf(item, `${at}.${key}`, found)
  return found
}

/** What the double plants where its reads declare personal data, for the Hub to withhold: the service never sends it on these routes. */
const PLANTED = ['.results[].buyer.', '.questions[].from.']

const SCAN = { scan: true } as const

function bodyOf(answered: { body?: unknown }) {
  return z.record(z.string(), z.unknown()).parse(answered.body)
}

/** The route with the account's own id left out: the recording carries an invented one. */
function accountless(path: string) {
  return path.replace(/\/users\/[^/]+/, '/users/:account')
}

test('as respostas gravadas: o dublê responde as quatro formas com as chaves, os tipos e a rota do serviço real', async () => {
  const fake = mercadoLivreFake()
  const granted = await authorize(fake)
  if (granted.kind !== 'OK') return assert.fail('authorize')
  const token = granted.accessToken
  async function ask(id: string, input: Record<string, unknown>) {
    const operation = mercadoLivre.operations.find((each) => each.id === id) ?? assert.fail(id)
    const request = requestOf(operation, input, ACCOUNT, SENT_AT)
    const answered = await answerOf(await fake.handle(toRequest(mercadoLivre, request, token)))
    return { request, answered }
  }
  const first = await ask('anuncios', { ...SCAN, limit: 100 })
  const scroll = z.string().parse(bodyOf(first.answered).scroll_id)
  let last = first
  for (let pages = 0; pages < 100; pages++) {
    const results = z.array(z.unknown()).parse(bodyOf(last.answered).results)
    if (results.length === 0 && pages > 0) break
    last = await ask('anuncios', {
      scrollId: z.string().parse(bodyOf(last.answered).scroll_id),
      limit: 100,
    })
  }
  assert.notEqual(scroll, '')
  const cases: [Case, Awaited<ReturnType<typeof ask>>][] = [
    [
      'pedidos-alterados',
      await ask('pedidos', { offset: 0, limit: 50, changedFrom: '2026-09-10T00:00:00.000-03:00' }),
    ],
    ['anuncios-varredura-1', first],
    ['anuncios-varredura-2', last],
    ['perguntas-varredura', await ask('perguntas', { ...SCAN, limit: 50 })],
  ]
  for (const [name, { request, answered }] of cases) {
    const real = recording(name)
    assert.equal(accountless(request.path), accountless(real.route.path), `${name}: a rota`)
    assert.deepEqual(Object.keys(request.query).sort(), real.route.query, `${name}: o pedido`)
    assert.equal(answered.status, real.status, name)
    const given = shapeOf(bodyOf(answered))
    const recorded = shapeOf(real.body)
    for (const [at, types] of recorded)
      for (const type of types)
        assert.ok(given.get(at)?.has(type), `${name}: o dublê não manda ${at} como ${type}`)
    for (const at of given.keys())
      assert.ok(
        recorded.has(at) || PLANTED.some((planted) => at.startsWith(planted)),
        `${name}: o serviço real não manda ${at}`,
      )
  }
  assert.deepEqual(bodyOf(last.answered).results, [], 'a varredura acaba numa página sem linhas')
  assert.equal(typeof bodyOf(last.answered).scroll_id, 'string', '...que ainda traz o scroll_id')
})
