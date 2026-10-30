import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { request as toHub } from 'node:http'
import { createServer } from 'node:https'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import example from '../../apps/edge/example/src/index.ts'
import { serveDispatch } from '../../apps/edge/src/dispatch.ts'
import { AppsDomain, PublicOrigin } from '../../apps/server/src/platform/config.ts'
import {
  closeBrowser,
  liveHub,
  PASSWORD,
  personWithPassword,
  plantCompany,
  signIn,
  waitForHome,
  watchConsole,
} from './live-hub.ts'

// Step 9.1's journey in one Chromium, which holds both sites as a person's browser does: the Hub
// and the apps' host are names the browser resolves to one local TLS server, which hands the Hub's
// requests to the real Hub and the apps' to the real dispatcher. Nothing is routed inside the
// browser, so its cookies, its redirects and its Fetch Metadata are its own (testing T14).
const HUB_HOST = 'hub.conexus.fun'
const APPS_DOMAIN = 'conexusapp.tech'
const HUB = `https://${HUB_HOST}`
const LABEL = 'pedidos--acme'
const APP = `https://${LABEL}.${APPS_DOMAIN}`
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
/** A tab opens the published version, and Pedidos has none: the dispatcher's own page (step 17). */
const NOT_PUBLISHED = 'Este app ainda não foi publicado.'

/** What the Hub received from the browser, one request each. */
type Seen = {
  path: string
  status: number
  signedIn: boolean
  site: string
  mode: string
  dest: string
}

/** A certificate for both names, made for this run; the browser is told to accept it. */
function certificate(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-tls-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const [key, cert] = [join(dir, 'key.pem'), join(dir, 'cert.pem')]
  execFileSync(
    'openssl',
    [
      ...['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes'],
      ...['-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=conexus-test'],
      ...['-addext', `subjectAltName=DNS:${HUB_HOST},DNS:*.${APPS_DOMAIN}`],
    ],
    { stdio: 'ignore' },
  )
  return { key: readFileSync(key), cert: readFileSync(cert) }
}

/** The dispatcher's bindings: the Hub's edge port, and a namespace that runs the example app. */
function edgeEnv(edgePort: number) {
  return {
    HUB_PUBLIC_ORIGIN: HUB,
    APPS_DOMAIN,
    APP_LOGIN_KEY: 'k'.repeat(43),
    HUB: {
      fetch(input: RequestInfo | URL, init?: RequestInit) {
        const url = new URL(new Request(input).url)
        return globalThis.fetch(`http://127.0.0.1:${edgePort}${url.pathname}${url.search}`, init)
      },
      connect(): Socket {
        throw new Error('the dispatcher never opens a socket to the Hub')
      },
    },
    DISPATCHER: {
      get(_name: string, args: { props: Parameters<typeof example.fetch>[2]['props'] }) {
        return { fetch: async (request: Request) => example.fetch(request, {}, args), connect }
      },
    },
  } satisfies Env
}

function connect(): Socket {
  throw new Error('the example app opens no socket')
}

/** No version is on the air in this journey, so no call reaches a version's `db`. */
const NO_VERSION = {
  Db(): never {
    throw new Error('no version is on the air in this journey')
  },
  Connectors(): never {
    throw new Error('no version is on the air in this journey')
  },
}

async function bodyOf(incoming: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of incoming) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

/** The Tunnel's part: the request to the Hub's public port, with the client's address it adds. */
function passToHub(
  port: number,
  incoming: IncomingMessage,
  outgoing: ServerResponse,
  seen: Seen[],
) {
  const headers = { ...incoming.headers, 'cf-connecting-ip': '203.0.113.10' }
  const forward = toHub(
    { host: '127.0.0.1', port, path: incoming.url, method: incoming.method, headers },
    (answer) => {
      seen.push({
        path: incoming.url ?? '',
        status: answer.statusCode ?? 0,
        signedIn: /__Host-conexus_session=/.test(incoming.headers.cookie ?? ''),
        site: String(incoming.headers['sec-fetch-site']),
        mode: String(incoming.headers['sec-fetch-mode']),
        dest: String(incoming.headers['sec-fetch-dest']),
      })
      outgoing.writeHead(answer.statusCode ?? 502, answer.rawHeaders)
      answer.pipe(outgoing)
    },
  )
  incoming.pipe(forward)
}

/** Cloudflare's part: the request on an app's host, as the dispatcher's Worker receives it. */
async function passToDispatcher(
  edgePort: number,
  incoming: IncomingMessage,
  outgoing: ServerResponse,
) {
  const headers = new Headers()
  for (let at = 0; at < incoming.rawHeaders.length; at += 2) {
    headers.append(incoming.rawHeaders[at] ?? '', incoming.rawHeaders[at + 1] ?? '')
  }
  const read = incoming.method === 'GET' || incoming.method === 'HEAD'
  const request = new Request(`https://${incoming.headers.host}${incoming.url}`, {
    method: incoming.method,
    headers,
    body: read ? undefined : new Uint8Array(await bodyOf(incoming)),
    redirect: 'manual',
  })
  const answer = await serveDispatch(request, edgeEnv(edgePort), NO_VERSION)
  const lines: string[] = []
  for (const [name, value] of answer.headers) {
    if (name !== 'set-cookie') lines.push(name, value)
  }
  for (const cookie of answer.headers.getSetCookie()) lines.push('set-cookie', cookie)
  outgoing.writeHead(answer.status, lines)
  outgoing.end(Buffer.from(await answer.arrayBuffer()))
}

async function scenario(t: TestContext, options: { bypassCSP?: boolean } = {}) {
  const closers: (() => Promise<void>)[] = []
  t.after(async () => {
    for (const close of closers) await close()
  })
  const hub = await liveHub(t, 'http://127.0.0.1:9/unused', undefined, {
    publicOrigin: PublicOrigin.parse(HUB),
    appsDomain: AppsDomain.parse(APPS_DOMAIN),
  })
  const ana = await personWithPassword(hub.database, ANA)
  const carla = await personWithPassword(hub.database, CARLA)
  const companyId = await plantCompany(hub.database, ana, carla)
  await hub.database.asOwner(`update auth.company set nickname = 'acme' where id = $1`, [companyId])
  const seen: Seen[] = []
  const server = createServer(certificate(t), (incoming, outgoing) => {
    if (incoming.headers.host === HUB_HOST) return passToHub(hub.port, incoming, outgoing, seen)
    void passToDispatcher(hub.edgePort, incoming, outgoing)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  closers.push(async () => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const tls = `127.0.0.1:${address.port}`
  const browser = await chromium.launch({
    args: [
      `--host-resolver-rules=MAP ${HUB_HOST} ${tls}, MAP *.${APPS_DOMAIN} ${tls}, MAP * ~NOTFOUND`,
    ],
  })
  closers.unshift(() => closeBrowser(browser))
  const context = await browser.newContext({ ignoreHTTPSErrors: true, ...options })
  const page = await context.newPage()
  const problems: string[] = []
  watchConsole(page, problems)
  return { hub, browser, page, seen, problems, companyId }
}

type Scenario = Awaited<ReturnType<typeof scenario>>

/** Carla makes Pedidos through the Hub's door, as its screen would. */
async function createPedidos(s: Scenario, page: Page) {
  const made = await page.evaluate(
    async ({ path, key, header }) => {
      const answer = await globalThis.fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [header]: key },
        body: JSON.stringify({ name: 'Pedidos' }),
      })
      return answer.status
    },
    {
      path: `/api/companies/${s.companyId}/projects`,
      key: randomUUID(),
      header: ATTEMPT_KEY_HEADER,
    },
  )
  assert.equal(made, 201)
}

test('passagem: o endereço do app sem sessão do Hub leva a Entrar e, logo depois, ao app', async (t) => {
  const s = await scenario(t)
  const { page } = s
  await page.goto(`${HUB}/login`)
  await signIn(page, CARLA.email, PASSWORD)
  await waitForHome(page)
  await createPedidos(s, page)
  await page.context().clearCookies()
  await page.goto(`${APP}/`)
  await page.getByRole('heading', { name: 'Entrar no Conexus' }).waitFor()
  assert.equal(new URL(page.url()).pathname, '/login')
  const before = s.seen.length
  await signIn(page, CARLA.email, PASSWORD)
  await page.getByText(NOT_PUBLISHED).waitFor()
  assert.equal(new URL(page.url()).origin, APP)
  const documents = s.seen.slice(before).filter((one) => one.dest === 'document')
  assert.deepEqual(
    documents.map(({ path, status, signedIn }) => [new URL(path, HUB).pathname, status, signedIn]),
    [['/apps/open', 303, true]],
  )
  assert.deepEqual(s.problems, [])
})

test('passagem: o Hub abre o app numa aba nova e ele vai direto ao app, numa navegação vinda do app; um fetch do app é recusado', async (t) => {
  const s = await scenario(t, { bypassCSP: true })
  const { page } = s
  await page.goto(`${HUB}/login`)
  await signIn(page, CARLA.email, PASSWORD)
  await waitForHome(page)
  await createPedidos(s, page)
  // The Hub's page opens the app's address in a new tab as Abrir app does; the link itself shows
  // only once a Builder version is on the air, and the apps journey clicks it (`versions.test.ts`).
  // No version is published here, so the dispatcher answers with its not-published page.
  const before = s.seen.length
  const projectAddress = page.url()
  const [app] = await Promise.all([
    page.context().waitForEvent('page'),
    page.evaluate((url) => window.open(url, '_blank', 'noopener,noreferrer'), `${APP}/`),
  ])
  await app.getByText(NOT_PUBLISHED).waitFor()
  assert.equal(page.url(), projectAddress)
  const opened = s.seen.slice(before).filter((one) => one.dest === 'document')
  assert.deepEqual(
    opened.map((one) => ({ ...one, path: new URL(one.path, HUB).pathname })),
    [
      {
        path: '/apps/open',
        status: 303,
        signedIn: true,
        site: 'cross-site',
        mode: 'navigate',
        dest: 'document',
      },
    ],
  )
  // The app's own policy keeps its page from calling the Hub at all; with it set aside in Carla's
  // signed-in browser, the call still reaches the Hub as a fetch, without the Hub's cookie, which
  // its SameSite withholds, and the Hub refuses it.
  const prober = await page.context().newPage()
  await prober.goto(`${APP}/__conexus/nada`)
  const asked = s.seen.length
  const fetched = await prober.evaluate(
    (url) =>
      globalThis.fetch(url, { credentials: 'include' }).then(
        (answer) => answer.status,
        () => 'refused',
      ),
    `${HUB}/apps/open?host=${LABEL}&binding=${'b'.repeat(43)}`,
  )
  assert.equal(fetched, 'refused')
  assert.deepEqual(
    s.seen.slice(asked).map(({ status, mode, signedIn }) => [status, mode, signedIn]),
    [[403, 'cors', false]],
  )
  assert.deepEqual(s.problems, [])
})
