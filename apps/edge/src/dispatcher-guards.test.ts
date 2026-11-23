import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  APP_ORIGIN,
  BINDING,
  CODE,
  edge,
  frameAncestorsOf,
  HOST,
  HUB_ORIGIN,
  PREVIEW_ORIGIN,
  pageText,
  SESSION,
} from './test-edge.ts'

const LIVE = { Cookie: `__Host-conexus-app=${SESSION}` }
const REFUSED =
  '<h1>O Conexus recusou um pedido que não veio das suas páginas.</h1><p>Abra o Conexus pelo endereço dele.</p>'

test('escrita: Sec-Fetch-Site que não é same-origin é 403, mesmo com a Origin certa', async () => {
  const door = edge()
  for (const site of ['same-site', 'cross-site', 'none']) {
    const response = await door.fetch('/pedidos', {
      method: 'POST',
      headers: { ...LIVE, 'Sec-Fetch-Site': site, Origin: APP_ORIGIN },
    })
    assert.equal(response.status, 403, site)
    assert.equal(await pageText(response), REFUSED)
  }
  assert.equal(door.appCalls.length, 0)
})

test('escrita: sem Origin é 403, com ou sem Sec-Fetch-Site; com a Origin exata passa', async () => {
  const door = edge()
  const bare = await door.fetch('/pedidos', { method: 'POST', headers: LIVE })
  const sameSite = await door.fetch('/pedidos', {
    method: 'DELETE',
    headers: { ...LIVE, 'Sec-Fetch-Site': 'same-origin' },
  })
  const exact = await door.fetch('/pedidos', {
    method: 'PUT',
    headers: { ...LIVE, Origin: APP_ORIGIN },
  })
  assert.deepEqual([bare.status, sameSite.status, exact.status], [403, 403, 200])
  assert.equal(door.appCalls.length, 1)
})

test('GET de outro site é atendido: a passagem do Hub e a primeira visita', async () => {
  const door = edge({ hub: () => Response.json({ session: SESSION }, { status: 201 }) })
  const headers = { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://hub.conexus.fun' }
  const redeemed = await door.fetch(`/__conexus/passagem?code=${CODE}`, {
    headers: { ...headers, Cookie: `__Host-conexus-binding=${BINDING}` },
  })
  const first = await door.fetch('/pedidos', { headers })
  assert.deepEqual([redeemed.status, first.status], [303, 303])
  assert.match(redeemed.headers.get('Location') ?? '', /^\/__conexus\/entrada\?sessao=/)
  assert.match(first.headers.get('Location') ?? '', new RegExp(`/apps/open\\?host=${HOST}&`))
})

test('os 303 também levam os cabeçalhos de S24', async () => {
  const response = await edge().fetch('/')
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer')
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff')
  assert.equal(frameAncestorsOf(response), "'none'")
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
})

test('uma página de falha leva o ancestral do seu host: none no do app e fora de app, o Hub no da Prévia', async (t) => {
  t.mock.method(console, 'log', () => undefined)
  t.mock.method(console, 'error', () => undefined)
  const foreign = { method: 'POST', headers: { Origin: 'https://fora.example' } }
  const unknown = await edge().fetch('/', {}, 'https://www.conexusapp.tech')
  const refused = [
    await edge().fetch('/', foreign),
    await edge().fetch('/', foreign, PREVIEW_ORIGIN),
  ]
  // A throw the dispatcher did not expect: the binding's random secret cannot be drawn.
  t.mock.method(crypto, 'getRandomValues', () => {
    throw new Error('sem entropia')
  })
  const broken = [
    await edge().fetch('/'),
    await edge().fetch('/', { headers: { 'Sec-Fetch-Dest': 'iframe' } }, PREVIEW_ORIGIN),
  ]
  assert.deepEqual(
    [unknown, ...refused, ...broken].map((page) => [page.status, frameAncestorsOf(page)]),
    [
      [404, "'none'"],
      [403, "'none'"],
      [403, HUB_ORIGIN],
      [500, "'none'"],
      [500, HUB_ORIGIN],
    ],
  )
})

test('app: Set-Cookie com espaço antes do prefixo __Host-conexus- não vira cookie do app', async () => {
  const door = edge({
    app: () => {
      const headers = new Headers()
      headers.append('Set-Cookie', ' \t__Host-conexus-app=forjado; Path=/; Secure')
      headers.append('Set-Cookie', 'tema=claro; Path=/')
      return new Response('ok', { headers })
    },
  })
  const response = await door.fetch('/', { headers: LIVE })
  assert.deepEqual(response.headers.getSetCookie(), ['tema=claro; Path=/'])
})

test('matriz, o Worker do app não existe no namespace: 502, não a página 500', async () => {
  const door = edge({ missingScript: true })
  const response = await door.fetch('/', { headers: LIVE })
  assert.equal(response.status, 502)
  assert.equal(await pageText(response), '<h1>O app não conseguiu responder agora.</h1>')
})
