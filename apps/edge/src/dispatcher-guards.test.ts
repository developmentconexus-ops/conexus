import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_ORIGIN, BINDING, CODE, edge, HOST, pageText, SESSION } from './test-edge.ts'

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
  assert.equal(redeemed.headers.get('Location'), '/')
  assert.match(first.headers.get('Location') ?? '', new RegExp(`/apps/open\\?host=${HOST}&`))
})

test('os 303 também levam os cabeçalhos de S24', async () => {
  const response = await edge().fetch('/')
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer')
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff')
  assert.match(
    response.headers.get('Content-Security-Policy') ?? '',
    /frame-ancestors https:\/\/hub\.conexus\.fun$/,
  )
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
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
