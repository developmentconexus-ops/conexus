import assert from 'node:assert/strict'
import { test } from 'node:test'
import { refreshRequest } from '../kernel/oauth.ts'
import { mercadoLivre } from './definition.ts'
import { mercadoLivreFake } from './fake.ts'
import { authorize, getWith, grant } from './test-session.ts'

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
