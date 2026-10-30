import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { z } from 'zod'
import { mercadoLivre } from '../mercado-livre/definition.ts'
import { sankhya } from '../sankhya/definition.ts'
import { defineConnector } from './definition.ts'
import type { OAuth2CodeAuth } from './oauth.ts'
import {
  authorizeUrl,
  codeRequest,
  oauth2Code,
  readGrant,
  refreshRequest,
  revokeRequest,
} from './oauth.ts'
import { AccountRef, defineOperation } from './operation.ts'
import { toRequest } from './request.ts'

/** A provider that is not Mercado Livre: another exchange route, a `scope` in the params, other lists of refusals. */
const invented = oauth2Code({
  app: { from: 'installation' },
  authorize: {
    url: 'https://login.exemplo.test/oauth/consent',
    pkce: 'S256',
    params: { scope: 'orders.read offline', prompt: 'consent' },
  },
  token: { path: '/v2/token' },
  answer: z
    .object({
      accessToken: z.string().min(1),
      refreshToken: z.string().min(1).optional(),
      expiresIn: z.number().int().positive(),
    })
    .transform(({ accessToken, refreshToken, expiresIn }) => ({
      accessToken,
      ...(refreshToken === undefined ? {} : { refreshToken }),
      expiresInSeconds: expiresIn,
    })),
  refusals: { grant: ['access_denied', 'token_revoked'], app: ['bad_client', 'bad_scope'] },
})

const APP = { clientId: 'invented-client', clientSecret: 'invented-secret-0001' }
const AUTHORIZE = {
  clientId: APP.clientId,
  redirectUri: 'https://hub.exemplo.test/integrations/return',
  state: 'company.sign-in',
  challenge: 'challenge-value',
}

const ANSWER = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresIn: 3600,
}

const ping = defineOperation({
  id: 'ping',
  class: 'read',
  subject: 'ping',
  idempotent: true,
  summary: 'Ping.',
  label: 'Ping',
  input: z.object({}),
  output: z.object({}),
  probe: () => ({}),
  request: () => ({ method: 'GET', path: '/ping', query: {}, body: undefined }),
  answer: () => ({ kind: 'OK', value: {} }),
})

function connectorWith(changes: { auth: OAuth2CodeAuth | typeof sankhya.auth }) {
  return defineConnector({
    id: 'exemplo',
    name: 'Exemplo',
    version: '1.0.0',
    origin: 'https://api.exemplo.test',
    account: {
      kind: 'reported',
      exclusive: true,
      who: {
        path: '/me',
        answer: z.object({ id: z.string(), name: z.string() }).transform((value) => ({
          ref: AccountRef.parse(value.id),
          label: value.name,
        })),
      },
    },
    category: 'Teste',
    summary: 'Um.',
    logo: sankhya.logo,
    perProject: 'many',
    subjects: { ping: 'Ping' },
    operations: [ping],
    check: ping,
    skill: { content: '', references: {} },
    ...changes,
  })
}

describe('a declaração recusa', () => {
  const declared = {
    app: { from: 'installation' } as const,
    authorize: { url: 'https://login.exemplo.test/c' as const, pkce: 'S256' as const, params: {} },
    token: { path: '/token' as const },
    answer: invented.answer,
    refusals: { grant: ['a'], app: ['b'] },
  }

  /** An address the types would refuse, to meet the check at run time. */
  const Unchecked = z.custom<`https://${string}`>()

  it('uma URL de autorização que não é https', () => {
    for (const url of ['http://login.exemplo.test/c', 'https://', 'ftp://login.exemplo.test/c'])
      assert.throws(
        () =>
          oauth2Code({
            ...declared,
            authorize: { ...declared.authorize, url: Unchecked.parse(url) },
          }),
        /https/,
        url,
      )
  })

  it('uma mesma resposta de erro em grant e em app', () => {
    assert.throws(
      () => oauth2Code({ ...declared, refusals: { grant: ['x', 'y'], app: ['y'] } }),
      /y/,
    )
  })

  it('uma conta reportada com um login que não é OAuth', () => {
    assert.throws(
      () =>
        defineConnector({
          ...sankhya,
          account: {
            kind: 'reported',
            exclusive: true,
            who: { path: '/me', answer: z.never() },
          },
        }),
      /Reported account without an OAuth login/,
    )
    assert.equal(connectorWith({ auth: invented }).account.kind, 'reported')
  })

  it('congela o que declara', () => {
    assert.ok(Object.isFrozen(invented))
    assert.ok(Object.isFrozen(invented.refusals.grant))
    assert.ok(Object.isFrozen(invented.authorize.params))
  })
})

describe('o endereço de autorização', () => {
  it('leva response_type, client_id, redirect_uri, state e o desafio SHA-256, depois dos params fixos', () => {
    const url = authorizeUrl(invented, AUTHORIZE)
    assert.equal(`${url.origin}${url.pathname}`, 'https://login.exemplo.test/oauth/consent')
    assert.deepEqual(
      [...url.searchParams.keys()],
      [
        'scope',
        'prompt',
        'response_type',
        'client_id',
        'redirect_uri',
        'state',
        'code_challenge',
        'code_challenge_method',
      ],
    )
    assert.equal(url.searchParams.get('scope'), 'orders.read offline')
    assert.equal(url.searchParams.get('response_type'), 'code')
    assert.equal(url.searchParams.get('client_id'), APP.clientId)
    assert.equal(url.searchParams.get('redirect_uri'), AUTHORIZE.redirectUri)
    assert.equal(url.searchParams.get('state'), AUTHORIZE.state)
    assert.equal(url.searchParams.get('code_challenge'), AUTHORIZE.challenge)
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
  })

  it('nunca leva o Secret', () => {
    assert.ok(!authorizeUrl(invented, AUTHORIZE).href.includes(APP.clientSecret))
  })

  it('sobre a origem do dublê, com a mesma rota', () => {
    const url = authorizeUrl(invented, AUTHORIZE, 'http://127.0.0.1:4010')
    assert.equal(`${url.origin}${url.pathname}`, 'http://127.0.0.1:4010/oauth/consent')
    assert.equal(url.searchParams.get('state'), AUTHORIZE.state)
  })

  it('o Mercado Livre usa o mesmo caminho do kit', () => {
    const url = authorizeUrl(mercadoLivre.auth, AUTHORIZE)
    assert.equal(url.origin, 'https://auth.mercadolivre.com.br')
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
  })
})

describe('a troca e a renovação', () => {
  it('mandam tudo no corpo de formulário e nada na URL', async () => {
    const exchange = codeRequest(invented, APP, {
      code: 'the-code',
      redirectUri: AUTHORIZE.redirectUri,
      verifier: 'the-verifier',
    })
    const renewal = refreshRequest(invented, APP, 'refresh-1')
    for (const request of [exchange, renewal]) {
      assert.equal(request.method, 'POST')
      assert.equal(request.path, '/v2/token')
      assert.deepEqual(request.query, {})
      assert.equal(request.headers.accept, 'application/json')
      const sent = toRequest(connectorWith({ auth: invented }), request, null)
      assert.equal(sent.url, 'https://api.exemplo.test/v2/token')
      assert.equal(sent.headers.get('content-type'), 'application/x-www-form-urlencoded')
    }
    assert.deepEqual(Object.fromEntries(exchange.form), {
      grant_type: 'authorization_code',
      client_id: APP.clientId,
      client_secret: APP.clientSecret,
      code: 'the-code',
      redirect_uri: AUTHORIZE.redirectUri,
      code_verifier: 'the-verifier',
    })
    assert.deepEqual(Object.fromEntries(renewal.form), {
      grant_type: 'refresh_token',
      client_id: APP.clientId,
      client_secret: APP.clientSecret,
      refresh_token: 'refresh-1',
    })
  })

  it('leem as chaves de uma resposta 2xx, com ou sem chave de renovação nova', () => {
    assert.deepEqual(readGrant(invented, { status: 200, body: ANSWER }), {
      kind: 'OK',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresInSeconds: 3600,
    })
    const kept = readGrant(invented, {
      status: 200,
      body: { accessToken: 'access-2', expiresIn: 60 },
    })
    assert.deepEqual(kept, {
      kind: 'OK',
      accessToken: 'access-2',
      refreshToken: null,
      expiresInSeconds: 60,
    })
  })

  it('dão GRANT_REFUSED para cada erro de grant e APP_REFUSED para cada um de app, com o que o fornecedor disse', () => {
    for (const error of invented.refusals.grant) {
      const read = readGrant(invented, { status: 400, body: { error, message: 'nope' } })
      assert.equal(read.kind, 'GRANT_REFUSED', error)
      assert.ok('native' in read)
      assert.deepEqual(
        { status: read.native.status, code: read.native.code, message: read.native.message },
        { status: 400, code: error, message: 'nope' },
      )
    }
    for (const error of invented.refusals.app)
      assert.equal(readGrant(invented, { status: 401, body: { error } }).kind, 'APP_REFUSED', error)
  })

  it('dão UNREADABLE para outro erro, um corpo sem erro e um 2xx fora do esquema, sem carregar o corpo do 2xx', () => {
    for (const body of [{ error: 'something_else' }, 'plain text', undefined, { error: 7 }])
      assert.equal(readGrant(invented, { status: 500, body }).kind, 'UNREADABLE')
    const odd = readGrant(invented, { status: 200, body: { accessToken: 'leaked-token' } })
    assert.equal(odd.kind, 'UNREADABLE')
    if (odd.kind === 'UNREADABLE') assert.equal(odd.native.body, null)
    assert.ok(!JSON.stringify(odd).includes('leaked-token'))
  })

  it('a lista do Mercado Livre decide, não a do kit', () => {
    const body = { error: 'invalid_grant' }
    assert.equal(readGrant(mercadoLivre.auth, { status: 400, body }).kind, 'GRANT_REFUSED')
    assert.equal(readGrant(invented, { status: 400, body }).kind, 'UNREADABLE')
  })
})

describe('a revogação declarada', () => {
  const a = { accountRef: '123456789', clientId: '8001' }

  it('o Mercado Livre monta o DELETE da página que cita, sem chave: o executor põe a do portador', () => {
    assert.ok(mercadoLivre.auth.kind === 'oauth2_code')
    assert.deepEqual(revokeRequest(mercadoLivre.auth, a), {
      method: 'DELETE',
      path: '/users/123456789/applications/8001',
      query: {},
      body: undefined,
    })
  })

  it('um valor com barra não sai do caminho', () => {
    assert.ok(mercadoLivre.auth.kind === 'oauth2_code')
    const request = revokeRequest(mercadoLivre.auth, { ...a, accountRef: '1/../2' })
    assert.equal(request?.path, '/users/1%2F..%2F2/applications/8001')
  })

  it('quem não declara não tem pedido, e uma declaração sem a conta é recusada', () => {
    assert.equal(revokeRequest(invented, a), null)
    assert.throws(
      () => oauth2Code({ ...invented, revoke: { method: 'DELETE', path: '/users/me' } }),
      /\{account\}/,
    )
  })
})
