import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import {
  BINDING,
  CODE,
  edge,
  frameAncestorsOf,
  HUB_ORIGIN,
  PREVIEW_HOST,
  PREVIEW_ORIGIN,
  pageText,
  problem,
  SESSION,
} from './test-edge.ts'

// The app on the Prévia's host, inside the Hub's frame (step 14.1, U2): partitioned cookies, the
// Hub as the one frame ancestor, the entry page that hands the Hub the binding's hash, and a page
// that sends to the Hub when the host is opened anywhere else.
const LIVE = { Cookie: `__Host-conexus-app=${SESSION}` }

function hashOf(binding: string): string {
  return createHash('sha256').update(binding).digest('base64url')
}

function inPreview(path: string, init: RequestInit = {}, doubles: Parameters<typeof edge>[0] = {}) {
  return edge(doubles).fetch(path, init, PREVIEW_ORIGIN)
}

const IN_FRAME = { 'Sec-Fetch-Dest': 'iframe', 'Sec-Fetch-Site': 'cross-site' }
const PARTITIONED =
  /^__Host-conexus-(binding|app)=[^;]*; Path=\/; Secure; HttpOnly; SameSite=None; Partitioned(; Max-Age=0)?$/

test('cookies particionados no host da Prévia: o vínculo, a sessão e o apagar, nunca Lax', async () => {
  const first = await inPreview('/', { headers: IN_FRAME })
  const redeemed = await inPreview(
    `/__conexus/passagem?code=${CODE}`,
    { headers: { ...IN_FRAME, Cookie: `__Host-conexus-binding=${BINDING}` } },
    { hub: () => Response.json({ session: SESSION }, { status: 201 }) },
  )
  const expired = await inPreview(
    '/',
    { headers: { ...IN_FRAME, ...LIVE } },
    { hub: () => problem('APP_SESSION_INVALID') },
  )
  const cookies = [first, redeemed, expired].map((response) => response.headers.getSetCookie())
  assert.deepEqual(
    cookies.map((lines) => lines.map((line) => /^[^=]*/.exec(line)?.[0])),
    [
      ['__Host-conexus-binding'],
      ['__Host-conexus-app'],
      ['__Host-conexus-app', '__Host-conexus-binding'],
    ],
  )
  for (const line of cookies.flat()) assert.match(line, PARTITIONED)
  assert.match(cookies[2]?.[0] ?? '', /; Max-Age=0$/)
})

test('só o Hub emoldura o host da Prévia: toda resposta leva a origem do Hub como ancestral', async () => {
  const live = { headers: { ...IN_FRAME, ...LIVE } }
  const answers = [
    await inPreview('/', { headers: IN_FRAME }),
    await inPreview('/'),
    await inPreview('/__conexus/entry.js'),
    await inPreview('/', live),
    await inPreview('/__conexus/outra', live),
    await inPreview('/__conexus/passagem'),
    await inPreview('/', live, { missingScript: true }),
    await inPreview('/', live, { hub: () => problem('APP_NOT_FOUND') }),
    await inPreview('/', { method: 'POST', headers: { Origin: 'https://fora.example' } }),
  ]
  assert.deepEqual(
    answers.map((response) => response.status),
    [200, 401, 200, 200, 404, 403, 502, 404, 403],
  )
  for (const response of answers) assert.equal(frameAncestorsOf(response), HUB_ORIGIN)
})

/** The entry page's data, as its script reads them from the `#entry` element. */
function entryOf(html: string) {
  const element = /<div id="entry" data-hub="([^"]*)" data-host="([^"]*)" data-binding="([^"]*)">/
  const [, hub, host, binding] = element.exec(html) ?? []
  return { hub, host, binding }
}

/** Runs the entry script against a page and a parent window, as the browser would. */
async function runEntryScript(dataset: object) {
  const script = await (await inPreview('/__conexus/entry.js')).text()
  const sent: { message: unknown; targetOrigin: unknown }[] = []
  const document = { getElementById: (id: string) => (id === 'entry' ? { dataset } : null) }
  const parent = {
    postMessage: (message: unknown, targetOrigin: unknown) => sent.push({ message, targetOrigin }),
  }
  new Function('document', 'parent', script)(document, parent)
  return sent
}

test('entrada no quadro: sem sessão, a página que diz ao Hub o hash do vínculo e o host da Prévia', async () => {
  const door = edge()
  const fresh = await door.fetch('/pedidos', { headers: IN_FRAME }, PREVIEW_ORIGIN)
  const [cookie] = fresh.headers.getSetCookie()
  const binding = /^__Host-conexus-binding=([A-Za-z0-9_-]{43});/.exec(cookie ?? '')?.[1] ?? ''
  const html = await fresh.text()
  assert.equal(fresh.status, 200)
  assert.equal(fresh.headers.get('Content-Type'), 'text/html; charset=utf-8')
  assert.equal(fresh.headers.get('Cache-Control'), 'no-store')
  assert.deepEqual(entryOf(html), { hub: HUB_ORIGIN, host: PREVIEW_HOST, binding: hashOf(binding) })
  assert.match(html, /<script src="\/__conexus\/entry\.js"><\/script>/)
  const kept = await door.fetch(
    '/',
    { headers: { ...IN_FRAME, Cookie: `__Host-conexus-binding=${BINDING}` } },
    PREVIEW_ORIGIN,
  )
  assert.deepEqual(kept.headers.getSetCookie(), [])
  assert.equal(entryOf(await kept.text()).binding, hashOf(BINDING))
  assert.equal(door.hubCalls.length, 0)

  const script = await door.fetch('/__conexus/entry.js', {}, PREVIEW_ORIGIN)
  assert.equal(script.status, 200)
  assert.equal(script.headers.get('Content-Type'), 'text/javascript; charset=utf-8')
  const sent = await runEntryScript({
    hub: HUB_ORIGIN,
    host: PREVIEW_HOST,
    binding: hashOf(BINDING),
  })
  assert.deepEqual(sent, [
    {
      message: { type: 'conexus-entry', host: PREVIEW_HOST, binding: hashOf(BINDING) },
      targetOrigin: HUB_ORIGIN,
    },
  ])
})

test('fora do quadro, o host da Prévia é a página que leva ao Hub: sem redirecionar, sem cookie, sem perguntar ao Hub', async (t) => {
  const logged = t.mock.method(console, 'log', () => undefined)
  const outside: Record<string, string>[] = [
    { 'Sec-Fetch-Dest': 'document' },
    { 'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Site': 'same-origin' },
    {},
  ]
  for (const headers of outside) {
    const door = edge()
    const page = await door.fetch('/pedidos', { headers }, PREVIEW_ORIGIN)
    assert.equal(page.status, 401)
    assert.equal(page.headers.get('Location'), null)
    assert.deepEqual(page.headers.getSetCookie(), [])
    assert.equal(
      await pageText(page),
      `<h1>A Prévia abre dentro do Conexus.</h1><a href="${HUB_ORIGIN}">Abrir o Conexus</a>`,
    )
    assert.equal(door.hubCalls.length, 0)
  }
  // A call from inside the Prévia whose session the Hub refused: the same page, and only the lines
  // that delete the session.
  const refused = edge({ hub: () => problem('APP_SESSION_INVALID') })
  const call = await refused.fetch(
    '/api/itens',
    { headers: { 'Sec-Fetch-Dest': 'empty', ...LIVE } },
    PREVIEW_ORIGIN,
  )
  assert.equal(call.status, 401)
  assert.deepEqual(call.headers.getSetCookie(), [
    '__Host-conexus-app=; Path=/; Secure; HttpOnly; SameSite=None; Partitioned; Max-Age=0',
  ])
  assert.equal(refused.hubCalls.length, 1)
  const lines = logged.mock.calls.map((each) => JSON.parse(String(each.arguments[0])))
  assert.deepEqual(
    lines,
    Array(4).fill({ level: 30, msg: 'EDGE_PREVIEW_OUTSIDE_HUB', status: 401, host: PREVIEW_HOST }),
  )
})

test('só o Hub: a mensagem da entrada vai à origem do Hub, e a sessão válida abre o app no quadro', async () => {
  const sent = await runEntryScript({ hub: HUB_ORIGIN, host: PREVIEW_HOST, binding: 'x' })
  assert.deepEqual(
    sent.map((each) => each.targetOrigin),
    [HUB_ORIGIN],
  )
  const framed = await inPreview('/', { headers: { ...IN_FRAME, ...LIVE } })
  assert.equal(await framed.text(), 'Olá, Ana Souza.')
  assert.equal(frameAncestorsOf(framed), HUB_ORIGIN)
})
