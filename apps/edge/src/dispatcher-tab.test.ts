import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_ORIGIN, CODE, EXAMPLE_CALL, edge, problem, SESSION } from './test-edge.ts'

// The app's own tab coming back with a live Hub session: app, Hub, the pass and the app again, all
// 303s. Safari drops a `Partitioned` cookie set at the end of a redirect chain that left the site
// and came back (WebKit bug 306194, Safari 26.2 on macOS and iOS), so a tab whose session cookie is
// partitioned never keeps the pass's session and runs the chain until "too many redirects".
const HUB = 'https://hub.conexus.fun'
const MAX_HOPS = 16

/** A tab's cookie jar on the app's host, as Safari keeps it at the top level. */
function safariTab() {
  const jar = new Map<string, string>()
  return {
    header: () => [...jar].map(([name, value]) => `${name}=${value}`).join('; '),
    store(lines: readonly string[], crossings: number) {
      for (const line of lines) {
        const [pair = '', ...attributes] = line.split('; ')
        const at = pair.indexOf('=')
        if (attributes.includes('Max-Age=0')) jar.delete(pair.slice(0, at))
        else if (!(attributes.includes('Partitioned') && crossings >= 2)) {
          jar.set(pair.slice(0, at), pair.slice(at + 1))
        }
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
  assert.deepEqual(hops, ['/', 'hub', '/__conexus/passagem', '/'])
  assert.equal(await response?.text(), 'Olá, Ana Souza.')
})

test('aba com a sessão do app vencida e o Hub aberto: apagada, e o app abre na volta', async () => {
  const tab = safariTab()
  tab.store([`__Host-conexus-app=${'v'.repeat(43)}; Path=/; Secure; HttpOnly; SameSite=Lax`], 0)
  const { hops, response } = await visit(edge({ hub: liveHub }), tab)
  assert.deepEqual(hops, ['/', 'hub', '/__conexus/passagem', '/'])
  assert.equal(await response?.text(), 'Olá, Ana Souza.')
})
