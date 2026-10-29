import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { sankhya } from '../sankhya/definition.ts'
import { clientCredentials, readToken, tokenRequest } from './auth.ts'
import { defineConnector, defineReadDoor } from './definition.ts'
import type { ProviderRequest } from './operation.ts'
import { defineOperation } from './operation.ts'
import { toRequest } from './request.ts'

function get(path: `/${string}`, query: Record<string, string> = {}): ProviderRequest {
  return { method: 'GET', path, query, body: undefined }
}

/** A path the types would refuse, to meet the run-time check the Hub relies on. */
const Unchecked = z.custom<`/${string}`>()

const base = {
  id: 'ping',
  subject: 'ping',
  idempotent: true,
  summary: 'Ping.',
  label: 'Ping',
  input: z.object({}),
  output: z.object({}),
  probe: () => ({}),
  request: () => get('/ping'),
  answer: () => ({ kind: 'UNREADABLE' as const }),
}

/** A definition with fields the types would refuse: the checks at run time are what the Hub meets. */
function redefine(changes: Record<string, unknown>) {
  return defineConnector({ ...sankhya, ...changes })
}

test('a classe é obrigatória', () => {
  // @ts-expect-error an operation without a class does not compile
  defineOperation({ ...base })
  // @ts-expect-error a class outside read, write and destructive does not compile
  defineOperation({ ...base, class: 'search' })
  assert.equal(defineOperation({ ...base, class: 'write' }).class, 'write')
})

test('a porta de leitura só aceita operações read', () => {
  const read = defineOperation({ ...base, class: 'read' })
  const write = defineOperation({ ...base, id: 'poke', class: 'write' })
  defineReadDoor({ ping: read })
  // @ts-expect-error a write operation does not fit the door
  defineReadDoor({ poke: write })
  assert.throws(() => redefine({ id: 'other', readDoor: { poke: write } }), /not read/)
  assert.throws(() => redefine({ readDoor: { other: read } }), /is named ping/)
})

test('o id da operação e o do conector são marcados e conferidos', () => {
  assert.throws(() => defineOperation({ ...base, id: 'Bad id', class: 'read' }))
  assert.throws(() => redefine({ id: 'Sankhya!' }))
  const op = defineOperation({ ...base, class: 'read' })
  assert.throws(() => redefine({ operations: [op, op], readDoor: undefined }), /Repeated/)
})

test('o assunto de cada operação é um assunto do conector, e nenhum assunto fica vazio', () => {
  const op = defineOperation({ ...base, class: 'read' })
  const lone = { ...sankhya, operations: [op], readDoor: undefined }
  assert.throws(
    () => defineConnector({ ...lone, subjects: { ping: 'Ping', extra: 'Extra' } }),
    /without operation: extra/,
  )
  assert.throws(
    () => defineConnector({ ...lone, subjects: { other: 'Other' } }),
    /Unknown subject ping/,
  )
  assert.equal(defineConnector({ ...lone, subjects: { ping: 'Ping' } }).subjects.ping, 'Ping')
  assert.throws(() => defineOperation({ ...base, class: 'read', subject: 'Not a subject' }))
})

test('a versão e a origem do conector são conferidas', () => {
  assert.throws(() => redefine({ version: '1.0' }))
  assert.throws(() => redefine({ origin: 'http://api.sankhya.com.br' }))
  assert.throws(() => redefine({ origin: 'https://api.sankhya.com.br/v1' }))
})

test('o pedido fica na origem fixa', async () => {
  const built = toRequest(sankhya, get('/v1/empresas', { page: '0' }), 'abc')
  assert.equal(built.url, 'https://api.sankhya.com.br/v1/empresas?page=0')
  assert.equal(built.headers.get('authorization'), 'Bearer abc')
  assert.equal(built.redirect, 'error')
  const post = toRequest(sankhya, { ...get('/x'), method: 'POST', body: { a: 1 } }, null)
  assert.equal(post.headers.get('content-type'), 'application/json')
  assert.equal(await post.text(), '{"a":1}')
  const refused = [
    'https://evil.test/x',
    '//evil.test/x',
    '/a/../b',
    '/a/%2e%2e/b',
    '/a/%2E%2E',
    '/u@evil.test',
    '/a\\b',
    '/%5Cb',
    '/%zz',
    '/\t/evil.test/x',
    '/\n/evil.test/x',
    'v1/x',
    '',
  ]
  for (const path of refused) {
    assert.throws(
      () => toRequest(sankhya, get(Unchecked.parse(path)), null),
      /refused|left its origin/,
      path,
    )
  }
})

test('a origem de um dublê vale se for a que se deu, e o pedido não sai dela', () => {
  const local = toRequest(sankhya, get('/v1/empresas'), null, 'http://127.0.0.1:4010')
  assert.equal(local.url, 'http://127.0.0.1:4010/v1/empresas')
  assert.throws(() => toRequest(sankhya, get('//127.0.0.1:9/x'), null, 'http://127.0.0.1:4010'))
})

test('o login monta o pedido de token só dos campos declarados', () => {
  const credential = { clientId: 'id-1', clientSecret: 'secret-1', xToken: 'x-1' }
  const request = tokenRequest(sankhya.auth, credential)
  assert.equal(request.path, '/authenticate')
  assert.equal(request.form.get('client_id'), 'id-1')
  assert.equal(request.form.get('grant_type'), 'client_credentials')
  assert.equal(request.headers['X-Token'], 'x-1')
  assert.throws(() => tokenRequest(sankhya.auth, { clientId: 'id-1' }))
})

test('a credencial é estrita, sem linha a mais, vazia, quebrada em linhas ou longa', () => {
  const { credential } = sankhya.auth
  const ok = { clientId: 'a', clientSecret: 'b', xToken: 'c' }
  assert.equal(credential.safeParse(ok).success, true)
  assert.equal(credential.safeParse({ ...ok, extra: 'd' }).success, false)
  assert.equal(credential.safeParse({ ...ok, xToken: '' }).success, false)
  assert.equal(credential.safeParse({ ...ok, xToken: 'a\r\nb: c' }).success, false)
  assert.equal(credential.safeParse({ ...ok, clientId: 'a'.repeat(201) }).success, false)
  assert.equal(
    clientCredentials(sankhya.auth).credential.safeParse({ ...ok, extra: 'd' }).success,
    false,
  )
})

test('a resposta do login: token, chave recusada ou ilegível', () => {
  const { auth } = sankhya
  const token = { access_token: 't', expires_in: 300 }
  assert.deepEqual(readToken(auth, { status: 200, body: token }), {
    kind: 'OK',
    accessToken: 't',
    expiresInSeconds: 300,
  })
  for (const status of [400, 401, 403]) {
    assert.deepEqual(readToken(auth, { status, body: undefined }), { kind: 'AUTH_REFUSED' })
  }
  const unreadable = [
    { status: 200, body: {} },
    { status: 200, body: { access_token: '', expires_in: 1 } },
    { status: 200, body: { access_token: 't', expires_in: 0 } },
    { status: 500, body: undefined },
  ]
  for (const answer of unreadable) assert.deepEqual(readToken(auth, answer), { kind: 'UNREADABLE' })
})
