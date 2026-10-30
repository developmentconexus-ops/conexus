import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call } from '../identity/test-hub.ts'
import { linkMercadoLivre, mercadoLivreOn } from './test-connections.ts'

type On = Awaited<ReturnType<typeof mercadoLivreOn>>

async function linked(on: On) {
  const response = await linkMercadoLivre(on.hub, on.ana, on.companyId)
  return String(Object(response.json()).connection.id)
}

async function unlinked(on: On, id: string) {
  const response = await call(on.hub, on.ana, 'DELETE', `${on.base}/${id}`)
  return { status: response.statusCode, body: Object(response.json()) }
}

function lineNamed(on: On, message: string) {
  return on.hub.lines.find((line) => line.message === message)
}

test('Desligar pede ao Mercado Livre que tire a autorização, com a chave viva, e depois apaga', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = await linked(on)
  const sealed = await on.hub.test.asOwner('select count(*)::int as n from connectors.connection')
  assert.equal(sealed[0]?.n, 1)
  const gone = await unlinked(on, id)
  assert.deepEqual([gone.status, gone.body], [200, { revocation: 'REVOKED' }])
  assert.deepEqual(on.fake.revocations(), [
    `${on.fake.switches.account.ref}/${on.fake.app.clientId}`,
  ])
  assert.equal((await on.hub.test.asOwner('select 1 from connectors.connection')).length, 0)
  assert.ok(lineNamed(on, 'CONNECTION_REVOKED'))
})

test('Desligar com a chave vencida renova antes de pedir', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = await linked(on)
  on.fake.expireAccess()
  const gone = await unlinked(on, id)
  assert.equal(gone.body.revocation, 'REVOKED')
  assert.equal(on.fake.refreshes(), 1)
  assert.equal(on.fake.revocations().length, 1)
})

test('o Mercado Livre recusa: a ligação sai, a pessoa lê REFUSED e o log tem o status', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = await linked(on)
  on.fake.switches.refuseRevoke = true
  const gone = await unlinked(on, id)
  assert.deepEqual([gone.status, gone.body], [200, { revocation: 'REFUSED' }])
  assert.equal((await on.hub.test.asOwner('select 1 from connectors.connection')).length, 0)
  const line = lineNamed(on, 'CONNECTION_REVOKE_REFUSED')
  assert.equal(line?.fields.status, 403)
  assert.equal(lineNamed(on, 'CONNECTION_REVOKED'), undefined)
})

test('o Mercado Livre fora do ar: a ligação sai, a pessoa lê UNREACHABLE e o log diz', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = await linked(on)
  await on.served.close()
  const gone = await unlinked(on, id)
  assert.deepEqual([gone.status, gone.body], [200, { revocation: 'UNREACHABLE' }])
  assert.equal((await on.hub.test.asOwner('select 1 from connectors.connection')).length, 0)
  assert.ok(lineNamed(on, 'CONNECTION_REVOKE_UNANSWERED'))
})

test('desligar de novo, e quem não pode: nada é enviado', async (t) => {
  const on = await mercadoLivreOn(t)
  const id = await linked(on)
  const member = await call(on.hub, on.carla, 'DELETE', `${on.base}/${id}`)
  assert.equal(member.statusCode, 404)
  assert.equal(on.fake.revocations().length, 0)
  assert.equal((await unlinked(on, id)).body.revocation, 'REVOKED')
  assert.deepEqual((await unlinked(on, id)).body, { revocation: 'NONE' })
  assert.equal(on.fake.revocations().length, 1)
})
