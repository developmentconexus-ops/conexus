import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { BINDING, CODE, edge, HOST, problem, SESSION } from './test-edge.ts'

// The app inside the Hub's Prévia (step 14.1, U2): partitioned cookies, the Hub as the one frame
// ancestor, and the entry page that hands the Hub the binding's hash.
const HUB = 'https://hub.conexus.fun'
const LIVE = { Cookie: `__Host-conexus-app=${SESSION}` }

function hashOf(binding: string): string {
  return createHash('sha256').update(binding).digest('base64url')
}

const IN_FRAME = { 'Sec-Fetch-Dest': 'iframe', 'Sec-Fetch-Site': 'cross-site' }
const DISPATCHER_COOKIE =
  /^__Host-conexus-(binding|app)=[^;]*; Path=\/; Secure; HttpOnly; SameSite=None; Partitioned(; Max-Age=0)?$/

test('cookies particionados: o vínculo, a sessão e o apagar de cada um', async () => {
  const first = await edge().fetch('/')
  const redeemed = await edge({
    hub: () => Response.json({ session: SESSION }, { status: 201 }),
  }).fetch(`/__conexus/passagem?code=${CODE}`, {
    headers: { Cookie: `__Host-conexus-binding=${BINDING}` },
  })
  const expired = await edge({ hub: () => problem('APP_SESSION_INVALID') }).fetch('/', {
    headers: { ...IN_FRAME, Cookie: `__Host-conexus-app=${SESSION}` },
  })
  const cookies = [first, redeemed, expired].flatMap((response) => response.headers.getSetCookie())
  assert.equal(cookies.length, 5)
  for (const cookie of cookies) assert.match(cookie, DISPATCHER_COOKIE)
})

/** The value of the `frame-ancestors` directive, the policy's last. */
function frameAncestorsOf(response: Response): string | undefined {
  const policy = response.headers.get('Content-Security-Policy') ?? ''
  return /(?:^|; )frame-ancestors ([^;]*)$/.exec(policy)?.[1]
}

test('o Hub pode emoldurar: toda resposta do host do app, só o Hub como ancestral', async () => {
  const live = { headers: LIVE }
  const answers = [
    await edge().fetch('/'),
    await edge().fetch('/', { headers: IN_FRAME }),
    await edge().fetch('/__conexus/entry.js'),
    await edge().fetch('/', live),
    await edge().fetch('/__conexus/outra', live),
    await edge().fetch('/__conexus/passagem'),
    await edge({ missingScript: true }).fetch('/', live),
    await edge({ hub: () => problem('APP_NOT_FOUND') }).fetch('/', live),
    await edge().fetch('/', {}, 'https://www.conexusapp.tech'),
    await edge().fetch('/', { method: 'POST', headers: { Origin: 'https://fora.example' } }),
  ]
  assert.deepEqual(
    answers.map((response) => response.status),
    [303, 200, 200, 200, 404, 403, 502, 404, 404, 403],
  )
  for (const response of answers) assert.equal(frameAncestorsOf(response), HUB)
})

/** The entry page's data, as its script reads them from the `#entry` element. */
function entryOf(html: string) {
  const element = /<div id="entry" data-hub="([^"]*)" data-host="([^"]*)" data-binding="([^"]*)">/
  const [, hub, host, binding] = element.exec(html) ?? []
  return { hub, host, binding }
}

/** Runs the entry script against a page and a parent window, as the browser would. */
async function runEntryScript(dataset: object) {
  const script = await (await edge().fetch('/__conexus/entry.js')).text()
  const sent: { message: unknown; targetOrigin: unknown }[] = []
  const document = { getElementById: (id: string) => (id === 'entry' ? { dataset } : null) }
  const parent = {
    postMessage: (message: unknown, targetOrigin: unknown) => sent.push({ message, targetOrigin }),
  }
  new Function('document', 'parent', script)(document, parent)
  return sent
}

test('entrada no iframe: sem sessão, a página que diz ao Hub o hash do vínculo; sem o cabeçalho, o 303', async () => {
  const door = edge()
  const fresh = await door.fetch('/pedidos', { headers: IN_FRAME })
  const [cookie] = fresh.headers.getSetCookie()
  const binding = /^__Host-conexus-binding=([A-Za-z0-9_-]{43});/.exec(cookie ?? '')?.[1] ?? ''
  const html = await fresh.text()
  assert.equal(fresh.status, 200)
  assert.equal(fresh.headers.get('Content-Type'), 'text/html; charset=utf-8')
  assert.equal(fresh.headers.get('Cache-Control'), 'no-store')
  assert.deepEqual(entryOf(html), { hub: HUB, host: HOST, binding: hashOf(binding) })
  assert.match(html, /<script src="\/__conexus\/entry\.js"><\/script>/)
  const kept = await door.fetch('/', {
    headers: { ...IN_FRAME, Cookie: `__Host-conexus-binding=${BINDING}` },
  })
  assert.deepEqual(kept.headers.getSetCookie(), [])
  assert.equal(entryOf(await kept.text()).binding, hashOf(BINDING))
  const top = await door.fetch('/', { headers: { 'Sec-Fetch-Dest': 'document' } })
  assert.equal(top.status, 303)
  assert.match(top.headers.get('Location') ?? '', /^https:\/\/hub\.conexus\.fun\/apps\/open\?/)
  assert.equal(door.hubCalls.length, 0)

  const script = await door.fetch('/__conexus/entry.js')
  assert.equal(script.status, 200)
  assert.equal(script.headers.get('Content-Type'), 'text/javascript; charset=utf-8')
  const sent = await runEntryScript({ hub: HUB, host: HOST, binding: hashOf(BINDING) })
  assert.deepEqual(sent, [
    { message: { type: 'conexus-entry', host: HOST, binding: hashOf(BINDING) }, targetOrigin: HUB },
  ])
})

test('só o Hub: a mensagem da entrada vai à origem do Hub, e a sessão válida abre o app no iframe', async () => {
  const sent = await runEntryScript({ hub: HUB, host: HOST, binding: 'x' })
  assert.deepEqual(
    sent.map((each) => each.targetOrigin),
    [HUB],
  )
  const door = edge()
  const framed = await door.fetch('/', { headers: { ...IN_FRAME, ...LIVE } })
  assert.equal(await framed.text(), 'Olá, Ana Souza.')
  assert.equal(frameAncestorsOf(framed), HUB)
})
