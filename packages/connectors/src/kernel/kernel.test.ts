import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { mercadoLivre } from '../mercado-livre/definition.ts'
import { sankhya } from '../sankhya/definition.ts'
import { clientCredentials, readToken, tokenRequest } from './auth.ts'
import { defineConnector, defineReadDoor } from './definition.ts'
import { LOGO_MAX_BYTES, logoProblems } from './logo.ts'
import type { ProviderRequest } from './operation.ts'
import { defineOperation, locateOf, outcomeOf } from './operation.ts'
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
  answer: () => ({
    kind: 'UNREADABLE' as const,
    native: { status: 0, code: null, message: null, body: null },
  }),
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
  assert.throws(
    () => redefine({ operations: [op, op], check: op, readDoor: undefined }),
    /Repeated/,
  )
})

test('o assunto de cada operação é um assunto do conector, e nenhum assunto fica vazio', () => {
  const op = defineOperation({ ...base, class: 'read' })
  const lone = { ...sankhya, operations: [op], check: op, readDoor: undefined }
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

test('cada operação lê só operações anteriores, a porta primeiro', () => {
  const ping = defineOperation({ ...base, class: 'read' })
  const pong = defineOperation({ ...base, id: 'pong', class: 'read', from: ['ping'] })
  const lone = { ...sankhya, subjects: { ping: 'Ping' }, check: ping, readDoor: undefined }
  assert.deepEqual(defineConnector({ ...lone, operations: [ping, pong] }).operations[1]?.from, [
    'ping',
  ])
  assert.throws(() => defineConnector({ ...lone, operations: [pong, ping] }), /not earlier/)
  const self = defineOperation({ ...base, class: 'read', from: ['ping'] })
  assert.throws(() => defineConnector({ ...lone, operations: [self] }), /not earlier/)
  const absent = defineOperation({ ...base, class: 'read', from: ['nobody'] })
  assert.throws(() => defineConnector({ ...lone, operations: [absent] }), /not earlier/)
  const root = defineOperation({ ...base, id: 'root', class: 'read' })
  const door = { ...lone, operations: [pong, root], check: root, readDoor: { ping } }
  assert.equal(defineConnector(door).id, 'sankhya')
  assert.throws(() => defineOperation({ ...base, class: 'read', from: ['Bad id'] }))
})

test('o Testar é uma leitura do próprio conector, que não depende de outra', () => {
  const ping = defineOperation({ ...base, class: 'read' })
  const pong = defineOperation({ ...base, id: 'pong', class: 'read', from: ['ping'] })
  const nothing = defineOperation({ ...base, id: 'nothing', class: 'read', probe: () => null })
  const lone = { ...sankhya, subjects: { ping: 'Ping' }, readDoor: undefined }
  assert.equal(defineConnector({ ...lone, operations: [ping], check: ping }).check.id, 'ping')
  const outside = { ...lone, operations: [ping], check: pong }
  assert.throws(() => defineConnector(outside), /Check pong is no operation/)
  const after = { ...lone, operations: [ping, pong], check: pong }
  assert.throws(() => defineConnector(after), /Check pong needs an earlier read/)
  const empty = { ...lone, operations: [nothing], check: nothing }
  assert.throws(() => defineConnector(empty), /Check nothing needs an earlier read/)
  assert.equal(sankhya.check.id, 'empresas')
  assert.equal(mercadoLivre.check.id, 'conta')
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
    assert.partialDeepStrictEqual(readToken(auth, { status, body: undefined }), {
      kind: 'AUTH_REFUSED',
    })
  }
  const unreadable = [
    { status: 200, body: {} },
    { status: 200, body: { access_token: '', expires_in: 1 } },
    { status: 200, body: { access_token: 't', expires_in: 0 } },
    { status: 500, body: undefined },
  ]
  for (const answer of unreadable)
    assert.partialDeepStrictEqual(readToken(auth, answer), { kind: 'UNREADABLE' })
})

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>'

test('o logotipo: um SVG sem script, sem on…=, sem endereço de fora e até o teto', () => {
  assert.deepEqual(logoProblems(SVG), [])
  assert.deepEqual(logoProblems(`<?xml version="1.0"?><!-- a -->\n${SVG}`), [])
  const inside = `<svg xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#a)" fill="url('#b')"><use xlink:href="#c"/></g></svg>`
  assert.deepEqual(logoProblems(inside), [])
  for (const bad of [
    '',
    '<html></html>',
    `<div>${SVG}</div>`,
    SVG.replace('<path', '<script>x()</script><path'),
    SVG.replace('<path', '<SCRIPT src="#a"></SCRIPT><path'),
    SVG.replace('<path', '<path onload="x()"'),
    SVG.replace('<path', '<path\nonclick = "x()"'),
    SVG.replace('<path', '<image href="https://example.test/a.png"/><path'),
    SVG.replace('<path', '<image xlink:href="data:image/png;base64,AA"/><path'),
    SVG.replace('<path', "<a HREF='//example.test'/><path"),
    SVG.replace('<path', '<path fill="url(https://example.test/a)"'),
    SVG.replace('<path', '<path fill="url( \'x.svg#a\' )"'),
    SVG.replace('</svg>', `<!-- ${'x'.repeat(LOGO_MAX_BYTES)} --></svg>`),
    SVG.replace('0 0 1 1', '0 0 124 28'),
  ])
    assert.notDeepEqual(logoProblems(bad), [], bad.slice(0, 60))
  assert.match(String(logoProblems(SVG.replace('0 0 1 1', '0 0 124 28'))), /not square/)
})

test('o conector sem conta, ou o campo sem ajuda, não compila', () => {
  const { account: _account, ...noAccount } = sankhya
  assert.throws(
    // @ts-expect-error the account is required, with no default
    () => assert.ok(defineConnector(noAccount).account),
  )
  const fields = { a: { label: 'A', maxLength: 1, visible: true } }
  assert.throws(() => {
    // @ts-expect-error a field's help is required
    const auth = clientCredentials({ ...sankhya.auth, fields })
    return auth.fields.a?.help.text.length
  })
})

test('a status the connector documents no exception for gets the kernel outcome of its class', () => {
  assert.equal(outcomeOf(401), 'AUTH_REFUSED')
  for (const status of [400, 403, 404, 409, 422])
    assert.equal(outcomeOf(status), 'REFUSED', String(status))
  for (const status of [300, 402, 429, 500, 503])
    assert.equal(outcomeOf(status), 'UNREADABLE', String(status))
})

test('the login carries what the provider said, and never a 2xx body', () => {
  const { auth } = sankhya
  assert.deepEqual(readToken(auth, { status: 401, body: { code: 'X1', message: 'recusado' } }), {
    kind: 'AUTH_REFUSED',
    native: {
      status: 401,
      code: 'X1',
      message: 'recusado',
      body: { code: 'X1', message: 'recusado' },
    },
  })
  assert.deepEqual(readToken(auth, { status: 200, body: { access_token: '' } }), {
    kind: 'UNREADABLE',
    native: { status: 200, code: null, message: null, body: null },
  })
  assert.deepEqual(locateOf('texto'), { code: null, message: null })
})
