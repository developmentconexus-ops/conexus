import assert from 'node:assert/strict'
import { test } from 'node:test'
import Fastify from 'fastify'
import type { Listener } from './access.ts'
import { enforceAccess } from './access.ts'
import { TEST_ORIGIN } from './test-database.ts'

type Route = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  config?: Record<string, unknown>
}

const PUBLIC: Listener = {
  kind: 'PUBLIC',
  publicOrigin: TEST_ORIGIN,
  readSession: async () => ({ kind: 'SIGNED_OUT' }),
}

async function start(
  route: Route,
  onHandle: () => void = () => undefined,
  listener: Listener = PUBLIC,
) {
  const app = Fastify({ exposeHeadRoutes: false })
  enforceAccess(app, listener)
  app.route({
    ...route,
    handler: async () => {
      onHandle()
      return { ok: true }
    },
  })
  await app.ready()
  return app
}

test('tipo: recusa rota sem tipo', async () => {
  await assert.rejects(
    start({ method: 'GET', url: '/orphan' }),
    /INTERNAL_UNEXPECTED route=GET \/orphan /,
  )
})

test('tipo: recusa tipo desconhecido', async () => {
  await assert.rejects(
    start({ method: 'GET', url: '/api/secret', config: { access: 'secret' } }),
    /route=GET \/api\/secret /,
  )
})

test('tipo: recusa o que o tipo não permite', async () => {
  const refused: Route[] = [
    { method: 'POST', url: '/api/write', config: { access: 'public' } },
    { method: 'GET', url: '/other', config: { access: 'public' } },
    { method: 'GET', url: '/api/page', config: { access: 'page' } },
    { method: 'GET', url: '/api', config: { access: 'page' } },
    { method: 'GET', url: '/api/entry', config: { access: 'entry' } },
    { method: 'PUT', url: '/outside', config: { access: 'session' } },
  ]
  for (const route of refused) {
    await assert.rejects(start(route), new RegExp(`route=${route.method} ${route.url} `))
  }
})

test('borda: uma rota edge na escuta pública, ou outra na de borda, o servidor não sobe (S48)', async () => {
  const edge = { method: 'POST', url: '/api/app-sessions', config: { access: 'edge' } } as const
  await assert.rejects(start(edge), /edge access does not live on the PUBLIC listener/)
  for (const access of ['public', 'session', 'entry']) {
    const route = { method: 'GET', url: '/api/other', config: { access } } as const
    await assert.rejects(
      start(route, undefined, { kind: 'EDGE' }),
      new RegExp(`${access} access does not live on the EDGE listener`),
    )
  }
})

test('borda: a rota edge responde sem sessão, cookie nem Origin', async () => {
  let handled = 0
  const route = { method: 'POST', url: '/api/app-sessions', config: { access: 'edge' } } as const
  const app = await start(route, () => handled++, { kind: 'EDGE' })
  const answer = await app.inject({ method: 'POST', url: '/api/app-sessions', payload: {} })
  assert.equal(answer.statusCode, 200)
  assert.equal(handled, 1)
})

test('aceita uma rota pública em /api/', async () => {
  const app = await start({ method: 'GET', url: '/api/ok', config: { access: 'public' } })
  const response = await app.inject({ method: 'GET', url: '/api/ok' })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.json(), { ok: true })
})

const WRITE = {
  method: 'PUT',
  url: '/api/entry',
  headers: {
    origin: 'https://hub.example.test',
    'content-type': 'application/json',
    'cf-connecting-ip': '203.0.113.7',
  },
  payload: '{}',
} as const

test('entrada: a escrita da página do Hub, em JSON e com o endereço do cliente, passa', async () => {
  const app = await start({ method: 'PUT', url: '/api/entry', config: { access: 'entry' } })
  const response = await app.inject(WRITE)
  assert.equal(response.statusCode, 200)
})

const REFUSED: [string, Record<string, string | undefined>, string][] = [
  ['sem Origin', { origin: undefined }, 'REQUEST_ORIGIN_REFUSED'],
  ['de outro site', { origin: 'https://other.example.test' }, 'REQUEST_ORIGIN_REFUSED'],
  ['cross-site', { 'sec-fetch-site': 'cross-site' }, 'REQUEST_ORIGIN_REFUSED'],
  ['sem cf-connecting-ip', { 'cf-connecting-ip': undefined }, 'REQUEST_MALFORMED'],
]
for (const [name, headers, code] of REFUSED) {
  test(`entrada: recusa a escrita ${name} antes do handler`, async () => {
    let handled = false
    const app = await start(
      { method: 'PUT', url: '/api/entry', config: { access: 'entry' } },
      () => {
        handled = true
      },
    )
    const sent = Object.entries({ ...WRITE.headers, ...headers }).filter(([, value]) => value)
    const response = await app.inject({ ...WRITE, headers: Object.fromEntries(sent) })
    assert.equal(response.json().code, code)
    assert.equal(handled, false)
  })
}

const READS_BY_SITE: [string, 'public' | 'session' | 'page', string, number | string][] = [
  ['pública', 'public', 'cross-site', 'REQUEST_ORIGIN_REFUSED'],
  ['pública', 'public', 'same-site', 'REQUEST_ORIGIN_REFUSED'],
  ['com sessão', 'session', 'cross-site', 'REQUEST_ORIGIN_REFUSED'],
  ['pública', 'public', 'same-origin', 200],
  ['pública', 'public', 'none', 200],
  ['a página, aberta de um link noutro site,', 'page', 'cross-site', 200],
]
for (const [name, access, site, expected] of READS_BY_SITE) {
  test(`Fetch Metadata: uma leitura ${name} com Sec-Fetch-Site ${site}: ${expected}`, async () => {
    let handled = false
    const url = access === 'page' ? '/login' : '/api/read'
    const app = await start({ method: 'GET', url, config: { access } }, () => {
      handled = true
    })
    const response = await app.inject({ method: 'GET', url, headers: { 'sec-fetch-site': site } })
    if (typeof expected === 'number') {
      assert.equal(response.statusCode, expected)
    } else {
      assert.equal(response.json().code, expected)
      assert.equal(handled, false)
    }
  })
}
