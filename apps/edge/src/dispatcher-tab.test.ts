import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import {
  APP_ORIGIN,
  CODE,
  EXAMPLE_CALL,
  edge,
  HOST,
  pageText,
  problem,
  SESSION,
} from './test-edge.ts'

// The app's own tab coming back with a live Hub session: app, Hub, the pass, its landing and the
// app again, all 303s. Safari drops a `Partitioned` cookie set at the end of a redirect chain that
// left the site and came back (WebKit bug 306194, Safari 26.2 on macOS and iOS), so a tab whose
// session cookie is partitioned never keeps the pass's session. A browser that keeps no session from the pass gets a
// page at its second round, never a chain run until "too many redirects".
const HUB = 'https://hub.conexus.fun'
const MAX_HOPS = 16
const SESSION_COOKIE = '__Host-conexus-app'
const PASS = ['/', 'hub', '/__conexus/passagem', '/__conexus/entrada']

/** Whether a browser stores one `Set-Cookie` line, after `crossings` changes of site in the chain. */
type Keeps = (name: string, attributes: readonly string[], crossings: number) => boolean

/** A tab's cookie jar on the app's host, from `held`, keeping what `keeps` lets it. */
function tab(keeps: Keeps, held: Record<string, string> = {}) {
  const jar = new Map(Object.entries(held))
  return {
    header: () => [...jar].map(([name, value]) => `${name}=${value}`).join('; '),
    store(lines: readonly string[], crossings: number) {
      for (const line of lines) {
        const [pair = '', ...attributes] = line.split('; ')
        const at = pair.indexOf('=')
        const name = pair.slice(0, at)
        if (!keeps(name, attributes, crossings)) continue
        if (attributes.includes('Max-Age=0')) jar.delete(name)
        else jar.set(name, pair.slice(at + 1))
      }
    },
  }
}

/** Safari at the top level. */
function safariTab() {
  return tab(
    (_name, attributes, crossings) => !(attributes.includes('Partitioned') && crossings >= 2),
  )
}

/** A browser that never stores the app's session cookie, whatever its shape, nor deletes `held`'s. */
function refusingTab(held?: Record<string, string>) {
  return tab((name) => name !== SESSION_COOKIE, held)
}

/** The Hub's `/apps/open` with a live session: straight back to the app with a pass. */
function hubOpens(url: URL): string {
  const host = url.searchParams.get('host')
  return `https://${host}.conexusapp.tech/__conexus/passagem?code=${CODE}`
}

/** Follows the 303s as a tab does, from the app's address, until a page or `MAX_HOPS`. */
async function visit(door: ReturnType<typeof edge>, tab: ReturnType<typeof safariTab>) {
  const hops: string[] = []
  let at = new URL('/', APP_ORIGIN)
  let crossings = 0
  for (let hop = 0; hop < MAX_HOPS; hop += 1) {
    hops.push(at.origin === APP_ORIGIN ? at.pathname : 'hub')
    if (at.origin === HUB) {
      at = new URL(hubOpens(at))
      crossings += 1
      continue
    }
    const site = hop === 0 ? 'none' : 'cross-site'
    const cookie = tab.header()
    const response = await door.fetch(`${at.pathname}${at.search}`, {
      headers: {
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Site': site,
        ...(cookie === '' ? {} : { Cookie: cookie }),
      },
    })
    tab.store(response.headers.getSetCookie(), crossings)
    const location = response.headers.get('Location')
    if (response.status !== 303 || location === null) return { hops, response }
    const next = new URL(location, at)
    if (next.origin !== at.origin) crossings += 1
    at = next
  }
  return { hops, response: undefined }
}

/** A Hub that trades the pass for `SESSION` and admits only that session. */
function liveHub(request: Request): Response {
  const url = new URL(request.url)
  if (url.pathname === '/api/app-sessions')
    return Response.json({ session: SESSION }, { status: 201 })
  if (request.headers.get('X-Conexus-App-Session') !== SESSION)
    return problem('APP_SESSION_INVALID')
  return Response.json(EXAMPLE_CALL)
}

test('aba que volta ao app com o Hub aberto: a passagem leva ao app, sem laço de redirecionamentos', async () => {
  const { hops, response } = await visit(edge({ hub: liveHub }), safariTab())
  assert.deepEqual(hops, [...PASS, '/'])
  assert.equal(await response?.text(), 'Olá, Ana Souza.')
})

test('aba com a sessão do app vencida e o Hub aberto: apagada, e o app abre na volta', async () => {
  const tab = safariTab()
  tab.store([`__Host-conexus-app=${'v'.repeat(43)}; Path=/; Secure; HttpOnly; SameSite=Lax`], 0)
  const { hops, response } = await visit(edge({ hub: liveHub }), tab)
  assert.deepEqual(hops, [...PASS, '/'])
  assert.equal(await response?.text(), 'Olá, Ana Souza.')
})

/** The lines the dispatcher logged while `run` ran. */
async function logged<T>(run: () => Promise<T>): Promise<{ result: T; lines: unknown[] }> {
  const lines: string[] = []
  const original = console.log
  console.log = (line: string) => lines.push(line)
  try {
    return { result: await run(), lines: lines.map((line) => JSON.parse(line)) }
  } finally {
    console.log = original
  }
}

const NOT_KEPT_LINE = {
  level: 30,
  msg: 'EDGE_SESSION_NOT_KEPT',
  status: 401,
  host: HOST,
  rounds: 2,
}

test('navegador que não guarda a sessão do app: a segunda volta é a página, não o laço', async () => {
  const door = edge({ hub: liveHub })
  const { result, lines } = await logged(() => visit(door, refusingTab()))
  assert.deepEqual(result.hops, PASS)
  assert.ok(result.response)
  assert.equal(result.response.status, 401)
  assert.equal(
    await pageText(result.response),
    '<h1>Este navegador não guardou a sua entrada.</h1><a href="/">Tentar de novo</a>',
  )
  assert.deepEqual(lines, [NOT_KEPT_LINE])
  assert.equal(door.appCalls.length, 0)
})

test('navegador que devolve sempre a sessão antiga, sem apagá-la nem trocá-la: a página, não o laço', async () => {
  const stale = refusingTab({ [SESSION_COOKIE]: 'v'.repeat(43) })
  const { result, lines } = await logged(() => visit(edge({ hub: liveHub }), stale))
  assert.deepEqual(result.hops, PASS)
  assert.equal(result.response?.status, 401)
  assert.deepEqual(lines, [NOT_KEPT_LINE])
})

function hashOf(session: string): string {
  return createHash('sha256').update(session).digest('base64url')
}

test('entrada com a sessão que a passagem gravou: 303 a /, sem cookie nem pergunta ao Hub', async () => {
  const door = edge()
  const response = await door.fetch(`/__conexus/entrada?sessao=${hashOf(SESSION)}`, {
    headers: { Cookie: `__Host-conexus-app=${SESSION}` },
  })
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('Location'), '/')
  assert.deepEqual(response.headers.getSetCookie(), [])
  assert.deepEqual([door.hubCalls.length, door.appCalls.length], [0, 0])
})

test('entrada sem a sessão, com outra ou sem o hash, também na Prévia: a página 401, sem o Hub', async () => {
  const door = edge()
  const mark = `sessao=${hashOf(SESSION)}`
  const answers = await Promise.all([
    door.fetch(`/__conexus/entrada?${mark}`),
    door.fetch(`/__conexus/entrada?${mark}`, {
      headers: { Cookie: `__Host-conexus-app=${'v'.repeat(43)}` },
    }),
    door.fetch('/__conexus/entrada', { headers: { Cookie: `__Host-conexus-app=${SESSION}` } }),
    door.fetch(`/__conexus/entrada?${mark}`, { headers: { 'Sec-Fetch-Dest': 'iframe' } }),
  ])
  for (const response of answers) {
    assert.equal(response.status, 401)
    assert.equal(
      await pageText(response),
      '<h1>Este navegador não guardou a sua entrada.</h1><a href="/">Tentar de novo</a>',
    )
  }
  assert.deepEqual([door.hubCalls.length, door.appCalls.length], [0, 0])
})
