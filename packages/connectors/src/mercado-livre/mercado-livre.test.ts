import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { connectorOf } from '../index.ts'
import { runConformance } from '../kernel/conformance.ts'
import { inProbeOrder } from '../kernel/definition.ts'
import { authorizeUrl, codeRequest, refreshRequest } from '../kernel/oauth.ts'
import { AccountRef, requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { mercadoLivre } from './definition.ts'
import { mercadoLivreFake } from './fake.ts'
import { docsOf } from './operations/shared.ts'
import { authorize, getWith, grant, startSignIn } from './test-session.ts'

runConformance(mercadoLivre, mercadoLivreFake())

const auth = mercadoLivre.auth

test('o Mercado Livre é achado pelo id', () => {
  assert.equal(connectorOf('mercado-livre'), mercadoLivre)
  assert.equal(connectorOf('Mercado-Livre'), undefined)
})

test('são 27 leituras em 11 assuntos, cada uma um GET na origem fixa, com a sua página da documentação', () => {
  assert.equal(mercadoLivre.operations.length, 27)
  assert.equal(Object.keys(mercadoLivre.subjects).length, 11)
  assert.equal(mercadoLivre.oneRequestAtATime, false)
  for (const operation of inProbeOrder(mercadoLivre)) {
    assert.equal(operation.class, 'read', operation.id)
    assert.ok(docsOf(operation), `${operation.id} cites its page`)
    const input = operation.probe(new Map())
    if (input === null) continue
    const request = requestOf(operation, input, { ref: AccountRef.parse('123456789') })
    assert.equal(request.method, 'GET', operation.id)
    const sent = toRequest(mercadoLivre, request, 'bearer')
    assert.equal(new URL(sent.url).origin, 'https://api.mercadolibre.com', operation.id)
  }
})

test('o logotipo é o símbolo, não a marca escrita', () => {
  assert.match(mercadoLivre.logo, /viewBox="0-23 150 150"/)
})

test('o dublê recusa um código usado duas vezes, um verificador errado e um redirect_uri diferente', async () => {
  const fake = mercadoLivreFake()
  const first = await startSignIn(fake)
  assert.equal((await first.exchange()).kind, 'OK')
  assert.equal((await first.exchange()).kind, 'GRANT_REFUSED', 'used twice')

  const wrongVerifier = await startSignIn(fake)
  assert.equal((await wrongVerifier.exchange({ verifier: 'other' })).kind, 'GRANT_REFUSED')
  assert.equal((await wrongVerifier.exchange()).kind, 'GRANT_REFUSED', 'spent by the failed try')

  const wrongRedirect = await startSignIn(fake)
  assert.equal(
    (await wrongRedirect.exchange({ redirectUri: 'https://hub.exemplo.test/other' })).kind,
    'GRANT_REFUSED',
  )
})

test('o dublê aceita o redirect_uri que o Hub configura e recusa o de fábrica', async () => {
  const fake = mercadoLivreFake({ redirectUri: 'https://hub.example.test/integrations/return' })
  assert.equal(fake.redirectUri, 'https://hub.example.test/integrations/return')
  assert.equal((await authorize(fake)).kind, 'OK')
  const factory = await startSignIn(fake)
  assert.equal(
    (await factory.exchange({ redirectUri: 'https://hub.exemplo.test/integrations/return' })).kind,
    'GRANT_REFUSED',
  )
})

test('o dublê recusa uma chave de renovação usada ou antiga', async () => {
  const fake = mercadoLivreFake()
  const granted = await authorize(fake)
  assert.equal(granted.kind, 'OK')
  if (granted.kind !== 'OK') return
  const renewed = await grant(fake, refreshRequest(auth, fake.app, granted.refreshToken ?? ''))
  assert.equal(renewed.kind, 'OK')
  const again = await grant(fake, refreshRequest(auth, fake.app, granted.refreshToken ?? ''))
  assert.equal(again.kind, 'GRANT_REFUSED', 'used')
  assert.equal(fake.refreshes(), 1)
})

test('o dublê recusa o app errado e uma autorização recusada pela pessoa volta com o erro', async () => {
  const fake = mercadoLivreFake()
  const wrong = await grant(
    fake,
    codeRequest(
      auth,
      { clientId: 'other', clientSecret: 'other' },
      { code: 'c', verifier: 'v', redirectUri: fake.redirectUri },
    ),
  )
  assert.equal(wrong.kind, 'APP_REFUSED')

  fake.switches.refuse = true
  const page = authorizeUrl(
    auth,
    { clientId: fake.app.clientId, redirectUri: fake.redirectUri, state: 's', challenge: 'c' },
    mercadoLivre.origin,
  )
  const back = new URL((await fake.handle(new Request(page))).headers.get('location') ?? '')
  assert.equal(back.searchParams.get('error'), 'access_denied')
  assert.equal(back.searchParams.get('state'), 's')
})

test('um grupo de permissão recusado dá 403 só nas suas leituras', async () => {
  const fake = mercadoLivreFake()
  const granted = await authorize(fake)
  assert.equal(granted.kind, 'OK')
  if (granted.kind !== 'OK') return
  fake.switches.refuseGroups.add('vendas')
  const { accessToken } = granted
  function send(path: `/${string}`) {
    return getWith(fake, path, accessToken)
  }
  const refused = await send('/orders/2000000000001')
  assert.equal(refused.status, 403)
  assert.deepEqual(
    z.looseObject({ code: z.string() }).parse(refused.body).code,
    'PA_UNAUTHORIZED_RESULT_FROM_POLICIES',
  )
  assert.equal((await send('/trends/MLB')).status, 200)
})
