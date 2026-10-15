import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import type { Operation } from '@conexus/hub-api'
import { Person } from '@conexus/hub-api'
import { z } from 'zod'
import { answer, createServer, serve } from './http.ts'
import {
  TEST_ORIGIN,
  takeUndeclared,
  testConfig,
  unreachableDatabase,
  unreachableDatabaseUrl,
} from './test-database.ts'

const PERSON = Person.parse({ id: 'person-1', name: 'Ana Lima', email: 'ana@example.test' })

const echo = {
  id: 'echoNote',
  summary: 'Answers the note it was sent.',
  access: 'entry',
  method: 'PUT',
  path: '/api/notes/current',
  bodyLimit: 64,
  input: { body: z.object({ note: z.string().max(8) }) },
  success: { status: 200, body: z.object({ note: z.string() }) },
  failures: [],
} as const satisfies Operation

const forget = {
  id: 'deleteNote',
  summary: 'Forgets the note.',
  access: 'session',
  method: 'DELETE',
  path: '/api/notes/current',
  bodyLimit: 64,
  success: { status: 204 },
  failures: [],
} as const satisfies Operation

async function hub() {
  const app = await createServer(testConfig(await unreachableDatabaseUrl()), {
    webRoot: tmpdir(),
    readSession: async () => ({ kind: 'SIGNED_IN', person: PERSON, setCookie: [] }),
  })
  serve(app, echo, ({ body }) => answer({ note: body.note }, ['a=1; Path=/', 'b=2; Path=/']))
  serve(app, forget, () => answer(undefined, ['a=; Max-Age=0; Path=/']))
  await app.ready()
  return app
}

const HEADERS = {
  origin: TEST_ORIGIN,
  'content-type': 'application/json',
  'cf-connecting-ip': '203.0.113.7',
}

test('o corpo lido pelo esquema da operação volta, com cada cookie no seu cabeçalho', async () => {
  const app = await hub()
  const response = await app.inject({
    method: 'PUT',
    url: '/api/notes/current',
    headers: HEADERS,
    payload: '{"note":"oi"}',
  })
  assert.equal(response.statusCode, 200)
  assert.equal(response.body, '{"note":"oi"}')
  assert.deepEqual(response.headers['set-cookie'], ['a=1; Path=/', 'b=2; Path=/'])
})

test('um 204 sai sem corpo', async () => {
  const app = await hub()
  const response = await app.inject({
    method: 'DELETE',
    url: '/api/notes/current',
    headers: { origin: TEST_ORIGIN },
  })
  assert.equal(response.statusCode, 204)
  assert.equal(response.body, '')
  assert.deepEqual(response.headers['set-cookie'], ['a=; Max-Age=0; Path=/'])
})

const REFUSALS: [string, string, number, string][] = [
  ['JSON inválido', '{"note":', 400, 'REQUEST_MALFORMED'],
  ['corpo fora do esquema', '{"note":"longo demais"}', 400, 'REQUEST_MALFORMED'],
  ['corpo acima do limite', JSON.stringify({ note: 'x'.repeat(100) }), 413, 'REQUEST_TOO_LARGE'],
]
for (const [name, payload, status, code] of REFUSALS) {
  test(`${name}: ${status} ${code}`, async () => {
    const app = await hub()
    const response = await app.inject({
      method: 'PUT',
      url: '/api/notes/current',
      headers: HEADERS,
      payload,
    })
    assert.equal(response.statusCode, status)
    assert.equal(response.json().code, code)
    assert.match(String(response.headers['content-type']), /^application\/problem\+json/)
  })
}

test('formulário vindo da própria página: 415 REQUEST_MEDIA_TYPE_REFUSED', async () => {
  const app = await hub()
  const response = await app.inject({
    method: 'PUT',
    url: '/api/notes/current',
    headers: { ...HEADERS, 'content-type': 'multipart/form-data; boundary=x' },
    payload: '--x--',
  })
  assert.equal(response.statusCode, 415)
  assert.equal(response.json().title, 'O Conexus não aceita pedidos nesse formato.')
})

test('páginas: /, /login e /set-password abrem a página das telas; outro endereço, 404', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-web-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>x</title>')
  const app = await createServer(testConfig(await unreachableDatabaseUrl()), {
    webRoot: dir,
    readSession: async () => ({ kind: 'SIGNED_OUT' }),
  })
  t.after(() => app.close())
  for (const url of ['/', '/login', '/set-password', '/login?redirect=%2F']) {
    const page = await app.inject({ method: 'GET', url })
    assert.equal(page.statusCode, 200, url)
    assert.equal(page.body, '<!doctype html><title>x</title>', url)
  }
  assert.equal((await app.inject({ method: 'GET', url: '/entrar' })).statusCode, 404)
})

test('endereço desconhecido: fora de /api/ e /assets/, a página das telas com 404; nelas, o JSON de 404', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-web-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(join(dir, 'index.html'), '<!doctype html><title>x</title>')
  const app = await createServer(testConfig(await unreachableDatabaseUrl()), {
    webRoot: dir,
    readSession: async () => ({ kind: 'SIGNED_OUT' }),
  })
  t.after(() => app.close())
  for (const url of ['/endereco-que-nao-existe', '/a/b?c=1']) {
    const typed = await app.inject({ method: 'GET', url })
    assert.equal(typed.statusCode, 404, url)
    assert.equal(typed.body, '<!doctype html><title>x</title>', url)
    assert.match(String(typed.headers['content-type']), /^text\/html/, url)
  }
  for (const url of ['/api/nao-existe', '/api', '/api?x=1', '/assets/nao-existe.js']) {
    const api = await app.inject({ method: 'GET', url })
    assert.equal(api.statusCode, 404, url)
    assert.equal(Object(api.json()).code, 'NOT_FOUND', url)
  }
  const write = await app.inject({ method: 'POST', url: '/endereco-que-nao-existe', payload: '{' })
  assert.equal(write.statusCode, 404)
  assert.equal(Object(write.json()).code, 'NOT_FOUND')
})

test('resposta: o valor literal { body, setCookie } é a resposta, igual em tempo de compilação e de execução', async (t) => {
  const app = await createServer(testConfig(await unreachableDatabaseUrl()), {
    webRoot: tmpdir(),
    readSession: async () => ({ kind: 'SIGNED_OUT' }),
  })
  t.after(() => app.close())
  serve(app, echo, ({ body }) => ({ body: { note: body.note }, setCookie: ['review=1; Path=/'] }))
  const response = await app.inject({
    method: 'PUT',
    url: echo.path,
    headers: HEADERS,
    payload: '{"note":"ok"}',
  })
  assert.equal(response.statusCode, 200)
  assert.equal(response.body, '{"note":"ok"}')
  assert.deepEqual([response.headers['set-cookie']].flat(), ['review=1; Path=/'])
})

test('a porta de teste registra o código de falha que a operação não declara, e o arquivo falha', async (t) => {
  const database = await unreachableDatabase(t)
  const app = await createServer(testConfig(await unreachableDatabaseUrl()), {
    webRoot: tmpdir(),
    readSession: async () => ({ kind: 'SIGNED_OUT' }),
  })
  t.after(() => app.close())
  for (const [path, failures] of [
    ['/api/notes/declared', ['DATABASE_UNAVAILABLE']],
    ['/api/notes/undeclared', []],
  ] as const) {
    const read = {
      id: 'readNote',
      summary: 'Reads a note from the database.',
      access: 'public',
      method: 'GET',
      path,
      bodyLimit: 64,
      success: { status: 204 },
      failures,
    } as const satisfies Operation
    serve(app, read, () => database.read(async () => answer(undefined)))
  }
  const declared = await app.inject({ method: 'GET', url: '/api/notes/declared' })
  assert.deepEqual([declared.statusCode, declared.json().code], [503, 'DATABASE_UNAVAILABLE'])
  assert.deepEqual(takeUndeclared(), [])
  const undeclared = await app.inject({ method: 'GET', url: '/api/notes/undeclared' })
  assert.equal(undeclared.statusCode, 503)
  assert.deepEqual(takeUndeclared(), ['GET /api/notes/undeclared DATABASE_UNAVAILABLE'])
})

// Never called: it exists so `npm run typecheck` fails if a bare body becomes a valid answer (T9).
export function bareBodyIsNotAnAnswer(app: Parameters<typeof serve>[0]): void {
  // @ts-expect-error: a handler gives back answer(body), never the body alone (code C22).
  serve(app, echo, ({ body }) => ({ note: body.note }))
}
