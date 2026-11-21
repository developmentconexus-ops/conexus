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
// app again, all 303s. In WebKit a `Partitioned` cookie is not reliably sent back to a tab after a redirect chain
// (WebKit bugs 316066 and 306194). The jar models what the founder's loop showed, not either bug:
// the partitioned session that the pass's answer writes never comes back. A browser that keeps no
// session from the pass gets a page at its second round, never a chain run until "too many redirects".
const HUB = 'https://hub.conexus.fun'
const MAX_HOPS = 16
const SESSION_COOKIE = '__Host-conexus-app'
const PASS = ['/', 'hub', '/__conexus/passagem', '/__conexus/entrada']

/**
 * How a browser keeps the tab's cookies. `partitions`: a `Partitioned` cookie is kept apart from an
 * unpartitioned one of the same name (CHIPS); `returnsLatePartitioned`: a partitioned cookie written
 * after the Hub comes back; `writesSession`: a line of the app session is stored or deleted at all.
 */
type Browser = { partitions: boolean; returnsLatePartitioned: boolean; writesSession: boolean }
const WEBKIT: Browser = { partitions: true, returnsLatePartitioned: false, writesSession: true }
const CHROMIUM: Browser = { partitions: true, returnsLatePartitioned: true, writesSession: true }
const NO_CHIPS: Browser = { partitions: false, returnsLatePartitioned: true, writesSession: true }
const REFUSING: Browser = { partitions: true, returnsLatePartitioned: true, writesSession: false }

/**
 * A tab's cookie jar on the app's host, at the top level, holding `held` app session pair from the
 * start; the older cookie is sent first.
 */
function tabOf(browser: Browser, held?: string) {
  const jar = new Map<string, string>(held === undefined ? [] : [[SESSION_COOKIE, held]])
  return {
    header: () => [...jar.values()].join('; '),
    store(lines: readonly string[], crossings: number) {
      for (const line of lines) {
        const [pair = '', ...attributes] = line.split('; ')
        if (!browser.writesSession && pair.startsWith(`${SESSION_COOKIE}=`)) continue
        const partitioned = browser.partitions && attributes.includes('Partitioned')
        const key = `${pair.slice(0, pair.indexOf('='))}${partitioned ? '; Partitioned' : ''}`
        if (attributes.includes('Max-Age=0')) jar.delete(key)
        else if (!partitioned || crossings < 2 || browser.returnsLatePartitioned) jar.set(key, pair)
      }
    },
  }
}

/** The Hub's `/apps/open` with a live session: straight back to the app with a pass. */
function hubOpens(url: URL): string {
  const host = url.searchParams.get('host')
  return `https://${host}.conexusapp.tech/__conexus/passagem?code=${CODE}`
}

/** Follows the 303s as a tab does, from the app's address, until a page or `MAX_HOPS`. */
async function visit(door: ReturnType<typeof edge>, tab: ReturnType<typeof tabOf>) {
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

const STALE = `__Host-conexus-app=${'v'.repeat(43)}; Path=/; Secure; HttpOnly`

/** The app session cookies the tab sends once the app opened. */
function sessionsOf(tab: ReturnType<typeof tabOf>): string[] {
  return tab
    .header()
    .split('; ')
    .filter((pair) => pair.startsWith('__Host-conexus-app='))
}

test('aba que volta ao app com o Hub aberto: a passagem leva ao app, sem laço de redirecionamentos', async () => {
  const tab = tabOf(WEBKIT)
  const { hops, response } = await visit(edge({ hub: liveHub }), tab)
  assert.deepEqual(hops, [...PASS, '/'])
  assert.equal(await response?.text(), 'Olá, Ana Souza.')
  assert.deepEqual(sessionsOf(tab), [`__Host-conexus-app=${SESSION}`])
})

test('aba com a sessão do app vencida e o Hub aberto: apagada, e o app abre na volta', async () => {
  const tab = tabOf(WEBKIT)
  tab.store([`${STALE}; SameSite=Lax`], 0)
  const { hops, response } = await visit(edge({ hub: liveHub }), tab)
  assert.deepEqual(hops, [...PASS, '/'])
  assert.equal(await response?.text(), 'Olá, Ana Souza.')
})

test('aba com a sessão particionada de antes, vencida: as duas formas saem, e fica só a nova', async () => {
  const tab = tabOf(CHROMIUM)
  tab.store([`${STALE}; SameSite=None; Partitioned`], 0)
  const { hops, response } = await visit(edge({ hub: liveHub }), tab)
  assert.deepEqual(hops, [...PASS, '/'])
  assert.equal(await response?.text(), 'Olá, Ana Souza.')
  assert.deepEqual(sessionsOf(tab), [`__Host-conexus-app=${SESSION}`])
})

test('navegador que ignora Partitioned: apagar a forma antiga não leva a sessão nova', async () => {
  const tab = tabOf(NO_CHIPS)
  const { hops, response } = await visit(edge({ hub: liveHub }), tab)
  assert.deepEqual(hops, [...PASS, '/'])
  assert.equal(await response?.text(), 'Olá, Ana Souza.')
  assert.deepEqual(sessionsOf(tab), [`__Host-conexus-app=${SESSION}`])
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
  const { result, lines } = await logged(() => visit(door, tabOf(REFUSING)))
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
  const stale = tabOf(REFUSING, `${SESSION_COOKIE}=${'v'.repeat(43)}`)
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
