import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { BINDING, CODE, EXAMPLE_CALL, edge, HOST, pageText, problem, SESSION } from './test-edge.ts'

const COOKIE_ATTRIBUTES = 'Path=/; Secure; HttpOnly; SameSite=Lax'
const HUB_OPEN = 'https://hub.conexus.fun/apps/open'

function hashOf(binding: string): string {
  return createHash('sha256').update(binding).digest('base64url')
}

test('primeira visita: vínculo novo e 303 ao Hub, que vê só o hash dele', async () => {
  const door = edge()
  const response = await door.fetch('/pedidos?aba=1')
  const [cookie] = response.headers.getSetCookie()
  const binding = /^__Host-conexus-binding=([A-Za-z0-9_-]{43}); (.*)$/.exec(cookie ?? '')
  assert.equal(response.status, 303)
  assert.equal(binding?.[2], COOKIE_ATTRIBUTES)
  assert.equal(
    response.headers.get('Location'),
    `${HUB_OPEN}?host=${HOST}&binding=${hashOf(binding?.[1] ?? '')}`,
  )
  assert.equal(door.hubCalls.length, 0)
  assert.equal(door.appCalls.length, 0)
})

test('primeira visita com vínculo: o mesmo, sem cookie novo', async () => {
  const door = edge()
  const response = await door.fetch('/', {
    headers: { Cookie: `__Host-conexus-binding=${BINDING}` },
  })
  assert.equal(response.status, 303)
  assert.deepEqual(response.headers.getSetCookie(), [])
  assert.equal(
    response.headers.get('Location'),
    `${HUB_OPEN}?host=${HOST}&binding=8BtXImJhrjdWuTk24cTmuEn5pbCTP6O5GEO_QZW52WQ`,
  )
  assert.equal(hashOf(BINDING), '8BtXImJhrjdWuTk24cTmuEn5pbCTP6O5GEO_QZW52WQ')
})

test('passagem certa: sessão, vínculo apagado e 303 a /', async () => {
  const door = edge({ hub: () => Response.json({ session: SESSION }, { status: 201 }) })
  const response = await door.fetch(`/__conexus/passagem?code=${CODE}`, {
    headers: { Cookie: `__Host-conexus-binding=${BINDING}` },
  })
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('Location'), '/')
  assert.deepEqual(response.headers.getSetCookie(), [
    `__Host-conexus-app=${SESSION}; ${COOKIE_ATTRIBUTES}`,
    `__Host-conexus-binding=; ${COOKIE_ATTRIBUTES}; Max-Age=0`,
  ])
  const [call] = door.hubCalls
  assert.equal(call?.method, 'POST')
  assert.equal(call?.url, 'http://hub:8081/api/app-sessions')
  assert.deepEqual(await call?.json(), { host: HOST, code: CODE, binding: BINDING })
  assert.equal(door.appCalls.length, 0)
})

test('passagem recusada pelo Hub: 403, o link não vale mais', async () => {
  const door = edge({ hub: () => problem('APP_HANDOFF_INVALID') })
  const response = await door.fetch(`/__conexus/passagem?code=${CODE}`, {
    headers: { Cookie: `__Host-conexus-binding=${BINDING}` },
  })
  assert.equal(response.status, 403)
  assert.deepEqual(response.headers.getSetCookie(), [])
  assert.equal(
    await pageText(response),
    '<h1>Este link de acesso não vale mais.</h1><p>Abra o app pelo Conexus.</p>',
  )
})

test('passagem sem vínculo ou sem código: 403, sem perguntar ao Hub', async () => {
  const door = edge()
  const noBinding = await door.fetch(`/__conexus/passagem?code=${CODE}`)
  const noCode = await door.fetch('/__conexus/passagem', {
    headers: { Cookie: `__Host-conexus-binding=${BINDING}` },
  })
  assert.deepEqual([noBinding.status, noCode.status], [403, 403])
  assert.equal(door.hubCalls.length, 0)
})

test('sessão que o Hub não aceita (401): apagada, e de volta ao Hub', async () => {
  const door = edge({ hub: () => problem('APP_SESSION_INVALID') })
  const response = await door.fetch('/', {
    headers: { Cookie: `__Host-conexus-app=${SESSION}; __Host-conexus-binding=${BINDING}` },
  })
  assert.equal(response.status, 303)
  assert.equal(
    response.headers.get('Location'),
    `${HUB_OPEN}?host=${HOST}&binding=${hashOf(BINDING)}`,
  )
  assert.deepEqual(response.headers.getSetCookie(), [
    `__Host-conexus-app=; ${COOKIE_ATTRIBUTES}; Max-Age=0`,
  ])
  assert.equal(door.appCalls.length, 0)
})

test('sessão viva: o Hub confere a chamada e o app responde', async () => {
  const door = edge()
  const response = await door.fetch('/pedidos', {
    headers: { Cookie: `__Host-conexus-app=${SESSION}` },
  })
  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'Olá, Ana Souza.')
  const [call] = door.hubCalls
  assert.equal(call?.method, 'GET')
  assert.equal(call?.url, `http://hub:8081/api/app-sessions/current?host=${HOST}`)
  assert.equal(call?.headers.get('X-Conexus-App-Session'), SESSION)
})

const MATRIX = [
  [
    'tirado (403)',
    () => problem('APP_ACCESS_REFUSED'),
    403,
    '<h1>Você não tem acesso a este app.</h1>',
  ],
  ['Projeto apagado (404)', () => problem('APP_NOT_FOUND'), 404, '<h1>Este app não existe.</h1>'],
  [
    'banco fora (503)',
    () => problem('DATABASE_UNAVAILABLE'),
    503,
    '<h1>O Conexus está fora do ar.</h1><p>Tente de novo em alguns minutos.</p>',
  ],
  [
    'Hub fora do ar',
    () => Promise.reject(new TypeError('Network connection lost.')),
    503,
    '<h1>O Conexus está fora do ar.</h1><p>Tente de novo em alguns minutos.</p>',
  ],
  [
    'resposta do Hub acima do teto',
    () => Response.json({ ...EXAMPLE_CALL, padding: 'x'.repeat(20_000) }),
    503,
    '<h1>O Conexus está fora do ar.</h1><p>Tente de novo em alguns minutos.</p>',
  ],
  [
    'resposta do Hub fora do contrato',
    () => Response.json({ caller: { personName: 'Ana' } }),
    503,
    '<h1>O Conexus está fora do ar.</h1><p>Tente de novo em alguns minutos.</p>',
  ],
] as const

for (const [state, hub, status, text] of MATRIX) {
  test(`matriz, ${state}: ${status}`, async () => {
    const door = edge({ hub })
    const response = await door.fetch('/', { headers: { Cookie: `__Host-conexus-app=${SESSION}` } })
    assert.equal(response.status, status)
    assert.equal(await pageText(response), text)
    assert.equal(door.appCalls.length, 0)
  })
}

test('matriz, Hub calado: 503 no prazo de 5 s', async () => {
  const door = edge({
    hub: (request) =>
      new Promise((_resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(request.signal.reason))
      }),
  })
  const started = Date.now()
  const response = await door.fetch('/', { headers: { Cookie: `__Host-conexus-app=${SESSION}` } })
  const waited = Date.now() - started
  assert.equal(response.status, 503)
  assert.ok(waited >= 4900 && waited < 6000, `waited ${waited} ms`)
})

test('matriz, o app falha (502), e um host que não é de app (404)', async () => {
  const door = edge({ app: () => Promise.reject(new Error('Worker exceeded CPU time limit.')) })
  const failed = await door.fetch('/', { headers: { Cookie: `__Host-conexus-app=${SESSION}` } })
  assert.equal(failed.status, 502)
  assert.equal(await pageText(failed), '<h1>O app não conseguiu responder agora.</h1>')
  for (const origin of ['https://www.conexusapp.tech', `https://${HOST}.example.com`]) {
    const unknown = await door.fetch('/', {}, origin)
    assert.equal(unknown.status, 404)
    assert.equal(await pageText(unknown), '<h1>Este app não existe.</h1>')
  }
})

test('uma página do despachante: sem script, um estilo pelo hash na CSP', async () => {
  const response = await edge().fetch('/__conexus/outra')
  const html = await response.text()
  const style = /<style>(.*)<\/style>/.exec(html)?.[1] ?? ''
  const hash = createHash('sha256').update(style).digest('base64')
  assert.equal(response.status, 404)
  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8')
  assert.equal(
    response.headers.get('Content-Security-Policy'),
    `default-src 'none'; style-src 'sha256-${hash}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  )
  assert.ok(style.length > 0 && !html.includes('<script'))
  assert.match(html, /^<!doctype html>\n<html lang="pt-BR">/)
})

const LIVE = { Cookie: `__Host-conexus-app=${SESSION}` }

test('app: não recebe os cookies __Host-conexus-* nem o cabeçalho da sessão', async () => {
  const door = edge()
  await door.fetch('/pedidos', {
    headers: {
      Cookie: `__Host-conexus-app=${SESSION}; tema=escuro; __Host-conexus-binding=${BINDING}`,
      'X-Conexus-App-Session': SESSION,
    },
  })
  const [call] = door.appCalls
  assert.equal(call?.request.url, `https://${HOST}.conexusapp.tech/pedidos`)
  assert.equal(call?.request.headers.get('Cookie'), 'tema=escuro')
  assert.equal(call?.request.headers.get('X-Conexus-App-Session'), null)
})

test('app: sem outro cookie, o app não recebe Cookie', async () => {
  const door = edge()
  await door.fetch('/', { headers: LIVE })
  assert.equal(door.appCalls[0]?.request.headers.get('Cookie'), null)
})

test('app: não recebe /__conexus/, que é do despachante', async () => {
  const door = edge()
  const response = await door.fetch('/__conexus/api/pedidos', { headers: LIVE })
  assert.equal(response.status, 404)
  assert.equal(await pageText(response), '<h1>Este app não existe.</h1>')
  assert.equal(door.appCalls.length, 0)
})

test('app: o Set-Cookie dele com o prefixo __Host-conexus- sai, o resto fica', async () => {
  const door = edge({
    app: () => {
      const headers = new Headers()
      headers.append('Set-Cookie', '__Host-conexus-app=forjado; Path=/; Secure')
      headers.append('Set-Cookie', 'tema=claro; Path=/')
      headers.append('Set-Cookie', '__Host-conexus-binding=forjado; Path=/; Secure')
      return new Response('ok', { headers })
    },
  })
  const response = await door.fetch('/', { headers: LIVE })
  assert.deepEqual(response.headers.getSetCookie(), ['tema=claro; Path=/'])
})

test('app: escrita de outro site é 403, a do próprio app passa', async () => {
  const door = edge()
  const crossSite = await door.fetch('/pedidos', {
    method: 'POST',
    headers: {
      ...LIVE,
      'Sec-Fetch-Site': 'same-site',
      Origin: `https://outro--empresa-a.conexusapp.tech`,
    },
  })
  const foreignOrigin = await door.fetch('/pedidos', {
    method: 'POST',
    headers: { ...LIVE, Origin: 'https://outro--empresa-a.conexusapp.tech' },
  })
  const own = await door.fetch('/pedidos', {
    method: 'POST',
    headers: {
      ...LIVE,
      'Sec-Fetch-Site': 'same-origin',
      Origin: `https://${HOST}.conexusapp.tech`,
    },
  })
  assert.deepEqual([crossSite.status, foreignOrigin.status, own.status], [403, 403, 200])
  assert.equal(
    await pageText(crossSite),
    '<h1>O Conexus recusou um pedido que não veio das suas páginas.</h1><p>Abra o Conexus pelo endereço dele.</p>',
  )
  assert.equal(door.appCalls.length, 1)
})

test('app: a CSP do app e os cabeçalhos de S24 substituem os dele', async () => {
  const door = edge({
    app: () =>
      new Response('ok', {
        headers: { 'Content-Security-Policy': 'script-src *', 'Referrer-Policy': 'unsafe-url' },
      }),
  })
  const response = await door.fetch('/', { headers: LIVE })
  assert.equal(
    response.headers.get('Content-Security-Policy'),
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
  )
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer')
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff')
})
