import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import type { Operation } from '@conexus/hub-api'
import { z } from 'zod'
import { createServer, serve, withCookies } from './http.ts'
import { TEST_ORIGIN, testConfig, unreachableDatabaseUrl } from './test-database.ts'

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
  const app = await createServer(testConfig(await unreachableDatabaseUrl()), tmpdir())
  serve(app, echo, ({ body }) => withCookies({ note: body.note }, ['a=1; Path=/', 'b=2; Path=/']))
  serve(app, forget, () => withCookies(undefined, ['a=; Max-Age=0; Path=/']))
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
