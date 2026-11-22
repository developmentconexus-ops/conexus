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
import type { Exports } from '../../apps/edge/src/dispatch.ts'
import { serveDispatch } from '../../apps/edge/src/dispatch.ts'
import { AppsDomain, PublicOrigin } from '../../apps/server/src/platform/config.ts'
import { NO_TOOLS } from './apps-edge.ts'
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

// The Prévia on its own host (step "A Prévia em endereço próprio", criterion 18), in one Chromium
// that holds the Hub and both of the app's hosts as a person's browser does: the names resolve to
// one local TLS server, which hands the Hub's requests to the real Hub and the apps' to the real
// dispatcher, as `app-open.test.ts` does. Its cookies, frames and Fetch Metadata are the browser's
// own (testing T14). The namespace answers each version's Worker with a page that names it.
const HUB_HOST = 'hub.conexus.fun'
const APPS_DOMAIN = 'conexusapp.tech'
const HUB = `https://${HUB_HOST}`
const LABEL = 'pedidos--acme'
const PREVIEW = `${LABEL}--previa`
const APP = `https://${LABEL}.${APPS_DOMAIN}`
const PREVIEW_APP = `https://${PREVIEW}.${APPS_DOMAIN}`
/** A page of the Hub's site that frames the published app, as any other site could try. */
const FRAMING_PATH = '/__teste/moldura'
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const SESSION_COOKIE = '__Host-conexus-app'

/** A certificate for the Hub and every app host, made for this run; the browser accepts it. */
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

/** The namespace: each version's Worker answers a page with its number, by its Worker's name. */
function versionsNamespace(numbers: Map<string, number>): Env['DISPATCHER'] {
  return {
    get(name: string) {
      const number = numbers.get(name)
      assert.ok(number !== undefined, `no version runs as ${name}`)
      return {
        fetch: async () =>
          new Response(
            `<!doctype html><html lang="pt-BR"><title>Pedidos</title><h1>Versão ${number}</h1></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          ),
        connect(): Socket {
          throw new Error('no app opens a socket')
        },
      }
    },
  }
}

/** The page this journey's versions answer never calls its `db` nor its connectors. */
const UNUSED: Exports = {
  Db: () => ({
    query: async () => assert.fail('no version reads its db here'),
    batch: async () => assert.fail('no version writes its db here'),
  }),
  Connectors: () => ({
    call: async () => assert.fail('no version calls a connector here'),
    connections: async () => assert.fail('no version lists connections here'),
  }),
}

function edgeEnv(edgePort: number, numbers: Map<string, number>) {
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
    DISPATCHER: versionsNamespace(numbers),
    ...NO_TOOLS,
  } satisfies Env
}

/** The Tunnel's part: the request to the Hub's public port, with the client's address it adds. */
function passToHub(port: number, incoming: IncomingMessage, outgoing: ServerResponse) {
  const headers = { ...incoming.headers, 'cf-connecting-ip': '203.0.113.10' }
  const forward = toHub(
    { host: '127.0.0.1', port, path: incoming.url, method: incoming.method, headers },
    (answer) => {
      outgoing.writeHead(answer.statusCode ?? 502, answer.rawHeaders)
      answer.pipe(outgoing)
    },
  )
  incoming.pipe(forward)
}

/** Cloudflare's part: the request on an app's host, as the dispatcher's Worker receives it. */
async function passToDispatcher(env: Env, incoming: IncomingMessage, outgoing: ServerResponse) {
  const headers = new Headers()
  for (let at = 0; at < incoming.rawHeaders.length; at += 2) {
    headers.append(incoming.rawHeaders[at] ?? '', incoming.rawHeaders[at + 1] ?? '')
  }
  const chunks: Buffer[] = []
  for await (const chunk of incoming) chunks.push(Buffer.from(chunk))
  const read = incoming.method === 'GET' || incoming.method === 'HEAD'
  const request = new Request(`https://${incoming.headers.host}${incoming.url}`, {
    method: incoming.method,
    headers,
    body: read ? undefined : new Uint8Array(Buffer.concat(chunks)),
    redirect: 'manual',
  })
  const answer = await serveDispatch(request, env, UNUSED)
  const lines: string[] = []
  for (const [name, value] of answer.headers) {
    if (name !== 'set-cookie') lines.push(name, value)
  }
  for (const cookie of answer.headers.getSetCookie()) lines.push('set-cookie', cookie)
  outgoing.writeHead(answer.status, lines)
  outgoing.end(Buffer.from(await answer.arrayBuffer()))
}

/** Carla makes Pedidos through the Hub's door, as its screen would, and gets its id. */
async function createPedidos(page: Page, companyId: string): Promise<string> {
  const made = await page.evaluate(
    async ({ path, key, header }) => {
      const answer = await globalThis.fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [header]: key },
        body: JSON.stringify({ name: 'Pedidos' }),
      })
      return { status: answer.status, body: await answer.json() }
    },
    { path: `/api/companies/${companyId}/projects`, key: randomUUID(), header: ATTEMPT_KEY_HEADER },
  )
  assert.equal(made.status, 201)
  return String(Object(Object(made.body).project).id)
}

/**
 * Pedidos with version 1 published and version 2 on the Prévia, planted as the Builder and
 * Publicar leave them; the company's database named as Neon would have, so a call names its host.
 */
async function plantVersions(
  database: Awaited<ReturnType<typeof liveHub>>['database'],
  ids: { companyId: string; projectId: string; sentBy: string },
  numbers: Map<string, number>,
) {
  const { companyId, projectId, sentBy } = ids
  await database.asOwner(
    'insert into apps.app (project_id, company_id) values ($1, $2) on conflict do nothing',
    [projectId, companyId],
  )
  const versions: string[] = []
  for (const number of [1, 2]) {
    const id = randomUUID().replaceAll('-', '')
    await database.asOwner(
      `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
         sent_by, attempt_key, created_at)
       values ($1, $2, $3, $4, 'ready', '{}'::jsonb, repeat('0', 64), $5, $1, now())`,
      [id, companyId, projectId, number, sentBy],
    )
    numbers.set(`v-${id}`, number)
    versions.push(id)
  }
  await database.asOwner(
    'update apps.app set published_version_id = $1, live_version_id = $2 where project_id = $3',
    [...versions, projectId],
  )
  await database.asOwner(
    "update projects.company_database set host = 'db.test.invalid' where company_id = $1",
    [companyId],
  )
}

async function scenario(t: TestContext) {
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
  const numbers = new Map<string, number>()
  const env = edgeEnv(hub.edgePort, numbers)
  const server = createServer(certificate(t), (incoming, outgoing) => {
    if (incoming.headers.host === HUB_HOST && incoming.url === FRAMING_PATH) {
      outgoing.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      outgoing.end(`<!doctype html><iframe src="${APP}/__conexus/nada"></iframe>`)
      return
    }
    if (incoming.headers.host === HUB_HOST) return passToHub(hub.port, incoming, outgoing)
    void passToDispatcher(env, incoming, outgoing)
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
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()
  const problems: string[] = []
  watchConsole(page, problems)
  return { hub, context, page, problems, companyId, carla, numbers }
}

/** The Prévia's frame on the Projeto's page, once it shows `number`. */
async function previewShows(page: Page, number: number) {
  await page
    .frameLocator('iframe[title="Prévia"]')
    .getByRole('heading', { name: `Versão ${number}` })
    .waitFor()
}

test('a Prévia no seu host: a versão 2 no Hub e a 1 numa aba, cada uma na sua; cookies e molduras por host', async (t) => {
  const s = await scenario(t)
  const { page, context } = s
  await page.goto(`${HUB}/login`)
  await signIn(page, CARLA.email, PASSWORD)
  await waitForHome(page)
  const projectId = await createPedidos(page, s.companyId)
  const ids = { companyId: s.companyId, projectId, sentBy: s.carla }
  await plantVersions(s.hub.database, ids, s.numbers)

  // The Prévia loads its own host, and the bar shows that address and the Prévia's version.
  await page.goto(`${HUB}/companies/${s.companyId}/projects/${projectId}`)
  await previewShows(page, 2)
  const bar = page.getByRole('region', { name: 'Prévia' })
  await bar.getByText(`${PREVIEW}.${APPS_DOMAIN}`, { exact: true }).waitFor()
  await bar.getByText('versão 2', { exact: true }).waitFor()

  // The published app in a tab of the same browser, at the same time.
  const tab = await context.newPage()
  await tab.goto(`${APP}/`)
  await tab.getByRole('heading', { name: 'Versão 1' }).waitFor()
  assert.equal(new URL(tab.url()).origin, APP)
  await tab.reload()
  await tab.getByRole('heading', { name: 'Versão 1' }).waitFor()
  await page.reload()
  await previewShows(page, 2)

  // Each host keeps its own session: the tab's `Lax` and unpartitioned, the Prévia's partitioned.
  const sessions = (await context.cookies())
    .filter((cookie) => cookie.name === SESSION_COOKIE)
    .map(({ domain, sameSite, partitionKey }) => ({
      domain,
      sameSite,
      partitioned: !!partitionKey,
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain))
  assert.deepEqual(sessions, [
    { domain: `${PREVIEW}.${APPS_DOMAIN}`, sameSite: 'None', partitioned: true },
    { domain: `${LABEL}.${APPS_DOMAIN}`, sameSite: 'Lax', partitioned: false },
  ])

  // A page that frames the published app gets nothing: its host says no one may frame it.
  const framing = await context.newPage()
  const refused = framing.waitForEvent('console', (message) =>
    message.text().includes("frame-ancestors 'none'"),
  )
  await framing.goto(`${HUB}${FRAMING_PATH}`)
  await refused
  const [, framed] = framing.frames()
  assert.ok(framed)
  assert.equal(await framed.locator('h1').count(), 0)

  // The Prévia's address in a tab: the short page that leads to the Hub, with no redirect.
  const outside = await context.newPage()
  const answered = await outside.goto(`${PREVIEW_APP}/`)
  assert.equal(answered?.status(), 401)
  assert.equal(new URL(outside.url()).origin, PREVIEW_APP)
  await outside.getByRole('heading', { name: 'A Prévia abre dentro do Conexus.' }).waitFor()
  const link = outside.getByRole('link', { name: 'Abrir o Conexus' })
  assert.equal(await link.getAttribute('href'), HUB)
  assert.deepEqual(s.problems, [])
})
