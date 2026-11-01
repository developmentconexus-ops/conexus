import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createServer, get } from 'node:http'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { mercadoLivreFake, sankhyaFake } from '@conexus/connectors'
import {
  ATTEMPT_KEY_HEADER,
  createProject as createProjectOperation,
  Problem,
  REDIRECT_PATH,
} from '@conexus/hub-api'
import { hashPassword } from 'better-auth/crypto'
import type { Browser, BrowserContext, Page } from 'playwright-core'
import { testBuilderPorts } from '../../apps/server/src/builder/runs/test-runs.ts'
import { createStatus } from '../../apps/server/src/hub/status/public.ts'
import { createEdgeHub, createHub, identityOf, subjectsOf } from '../../apps/server/src/main.ts'
import { createCloudflareApps } from '../../apps/server/src/platform/cloudflare.ts'
import { createCompanyPostgres } from '../../apps/server/src/platform/company-postgres.ts'
import type { Config } from '../../apps/server/src/platform/config.ts'
import { ConnectorApps } from '../../apps/server/src/platform/config-connectors.ts'
import { closeListeners } from '../../apps/server/src/platform/lifecycle.ts'
import { createNeonProjects } from '../../apps/server/src/platform/neon.ts'
import { pgTransport } from '../../apps/server/src/platform/test-company-postgres.ts'
import {
  createTestDatabase,
  TEST_ORIGIN,
  testConfig,
} from '../../apps/server/src/platform/test-database.ts'
import { neonServer } from '../../apps/server/src/platform/test-neon.ts'

// What the founder's journeys share: a real Hub on a real database, serving the built screens, and
// the browser reaching it by its public name. Only the mail provider, Neon, Cloudflare and the
// Sankhya are faked, at their HTTP doors (testing T14, T16).
export const PASSWORD = 'senha-certa-1'
const silent = { info: () => undefined, error: () => undefined }

export type Mail = { to: string; subject: string; text: string }

/** The provider's door: each message is kept, and `next` resolves with the next one to arrive. */
export async function mailProvider(t: TestContext) {
  const arrived: Mail[] = []
  const waiting: ((mail: Mail) => void)[] = []
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      const mail = { to: body.to, subject: body.subject, text: body.text }
      const waiter = waiting.shift()
      if (waiter) waiter(mail)
      else arrived.push(mail)
      response.writeHead(200, { 'content-type': 'application/json' })
      const result = { delivered: [body.to], permanent_bounces: [], queued: [] }
      response.end(JSON.stringify({ success: true, result }))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  return {
    url: `http://127.0.0.1:${address.port}/email/sending/send`,
    next: () =>
      new Promise<Mail>((resolve) => {
        const mail = arrived.shift()
        if (mail) resolve(mail)
        else waiting.push(resolve)
      }),
  }
}

/** The screens `npm run e2e` builds once before any file runs (pree2e), served by every Hub here. */
const WEB_ROOT = join(import.meta.dirname, '..', '..', 'apps', 'web', 'dist')

function portOf(server: Awaited<ReturnType<typeof createHub>>): number {
  const address = server.server.address()
  assert.ok(address !== null && typeof address === 'object')
  return address.port
}

/**
 * The Hub in this process, on the CI database, serving the built screens on its public port and the
 * dispatcher's calls on its edge port; `names` are its public origin and apps' domain, when a
 * browser reaches it by the names the dispatcher is built with. `machineFolder` is the test
 * machine's folder, where a journey puts the check program the machine runs.
 */
export async function liveHub(
  t: TestContext,
  mailUrl: string,
  cloudflareUrl?: string,
  names: Partial<Pick<Config, 'publicOrigin' | 'appsDomain'>> = {},
) {
  assert.ok(existsSync(join(WEB_ROOT, 'index.html')), 'the screens are not built: run npm run e2e')
  // Hooks run in the order they were added: the Hub closes before its databases end.
  const closing = { hub: (): Promise<unknown> => Promise.resolve() }
  t.after(() => closing.hub())
  const database = await createTestDatabase(t)
  const neon = await neonServer(t)
  // The kit's Sankhya double, whose switches the QA flips through `sankhya.switches`.
  const sankhya = sankhyaFake()
  const sankhyaServed = await sankhya.serve()
  t.after(() => sankhyaServed.close())
  const base = { ...testConfig(database.runtimeUrl, mailUrl, neon.url, cloudflareUrl), ...names }
  // The kit's Mercado Livre double, sending the person back to this Hub's return page, and its
  // invented app as the installation's apps file holds it (S40): `mercadoLivre.switches` for the QA.
  const mercadoLivre = mercadoLivreFake({ redirectUri: `${base.publicOrigin}${REDIRECT_PATH}` })
  const mercadoLivreServed = await mercadoLivre.serve()
  t.after(() => mercadoLivreServed.close())
  const config = {
    ...base,
    connectorOrigins: new Map([
      ['sankhya', sankhyaServed.origin],
      ['mercado-livre', mercadoLivreServed.origin],
    ]),
    connectorApps: ConnectorApps.parse(JSON.stringify({ 'mercado-livre': mercadoLivre.app })),
  }
  const status = createStatus({ version: config.version, database: database.database })
  const identity = identityOf({ database: database.database, config, log: silent })
  const { machinesOf, repository, copy, folder } = testBuilderPorts(config)
  const subjects = subjectsOf({
    ...{ machinesOf, repository, copy },
    database: database.database,
    mastraPool: database.mastraPool,
    config,
    identity,
    neon: createNeonProjects({ config, log: silent }),
    companyPostgres: createCompanyPostgres({
      transport: pgTransport,
      appLoginKey: config.appLoginKey,
    }),
    cloudflare: createCloudflareApps({ config, log: silent }),
    log: silent,
  })
  const { apps, conversations, connectors } = subjects
  const app = await createHub(config, { status, identity, ...subjects, webRoot: WEB_ROOT })
  closing.hub = function closeHub() {
    return closeListeners([app], () => conversations.close())
  }
  const edge = await createEdgeHub(config, { apps, connectors })
  t.after(() => edge.close())
  await app.listen({ host: '127.0.0.1', port: 0 })
  await edge.listen({ host: '127.0.0.1', port: 0 })
  return {
    port: portOf(app),
    edgePort: portOf(edge),
    database,
    neon,
    sankhya,
    mercadoLivre,
    config,
    machineFolder: folder,
  }
}

/**
 * The handoff as the browser asks it after the dispatcher's 303, a navigation from the app's host,
 * which Node's fetch cannot send: it always says `cors`. The pass is in the answer's `Location`.
 */
export function openOnHub(port: number, path: string, cookie: string) {
  const headers = {
    cookie,
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-dest': 'document',
  }
  return new Promise<{ status: number; location: string }>((resolve, reject) => {
    get(`http://127.0.0.1:${port}${path}`, { headers }, (response) => {
      response.resume()
      resolve({ status: response.statusCode ?? 0, location: response.headers.location ?? '' })
    }).on('error', reject)
  })
}

/**
 * The browser reaches the Hub by its public name, over the Hub's real HTTP door; Cloudflare's
 * header is set as the tunnel sets it.
 */
export async function reachHub(context: BrowserContext, port: number, ip: string) {
  await context.route(`${TEST_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = request.url().replace(TEST_ORIGIN, `http://127.0.0.1:${port}`)
    const headers = { ...(await request.allHeaders()), 'cf-connecting-ip': ip }
    return route.fulfill({ response: await route.fetch({ url, headers }) })
  })
}

/**
 * Ends the browser once every context has let go of `reachHub`'s route, so a fetch still in flight
 * when the test ends is dropped instead of failing on a closed target.
 */
export async function closeBrowser(browser: Browser) {
  for (const context of browser.contexts()) await context.unrouteAll({ behavior: 'ignoreErrors' })
  await browser.close()
}

/** What would show in the console as a refusal of the page itself, never as a refusal it shows. */
export function watchConsole(page: Page, problems: string[]) {
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (/Content Security Policy/.test(message.text())) problems.push(message.text())
  })
}

export async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

/** Início, once the company's page has opened (its title; the sidebar and the cards come with it). */
export async function waitForHome(page: Page) {
  await page.getByRole('heading', { name: 'O que vamos construir?', exact: true }).waitFor()
}

/** Welcome step 1: the first owner of a company the Central made keeps the suggested nickname. */
export async function chooseNickname(page: Page) {
  await page.getByRole('heading', { name: 'Sua empresa', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Salvar e continuar', exact: true }).click()
  await page.getByRole('heading', { name: 'Ligue uma conta de modelo', exact: true }).waitFor()
}

/** A welcome step's way on: "Continuar" once the step is done, else "Fazer depois". */
async function moveOn(page: Page) {
  const done = page.getByRole('link', { name: 'Continuar', exact: true })
  await done.or(page.getByRole('link', { name: 'Fazer depois', exact: true })).click()
}

/** Welcome steps 2 to 4 as the company stands: each step's way on, then "Ir para o início sem pedir nada". */
async function finishWelcome(page: Page) {
  await moveOn(page)
  await page.getByRole('heading', { name: 'Convide sua equipe', exact: true }).waitFor()
  await moveOn(page)
  await leaveWelcome(page)
}

/** Welcome step 4: "Ir para o início sem pedir nada". */
export async function leaveWelcome(page: Page) {
  const title = page.getByRole('heading', { name: 'O que vamos construir primeiro?', exact: true })
  await title.waitFor()
  await page.getByRole('link', { name: 'Ir para o início sem pedir nada', exact: true }).click()
  await waitForHome(page)
}

/** The first entry of a company the Central made, as its first owner leaves it: Início opens. */
export async function firstEntry(page: Page) {
  await chooseNickname(page)
  await finishWelcome(page)
}

/** Início again, from any page of the company's frame, by the sidebar's first link (inside a Projeto, the way back to the company). */
export async function openHome(page: Page) {
  await sidebarOf(page).getByRole('link').first().click()
  await waitForHome(page)
}

/** The company's sidebar, whose links the page's own content never repeats under another name. */
export function sidebarOf(page: Page) {
  return page.getByRole('navigation', { name: 'Navegação' })
}

/** From any page of a company's frame: Configurações in the sidebar, then the section in its index. */
export async function openSettings(page: Page, section: string) {
  await sidebarOf(page).getByRole('link', { name: 'Configurações', exact: true }).click()
  await sidebarOf(page).getByRole('link', { name: section, exact: true }).click()
  await page.getByRole('heading', { name: section, exact: true }).waitFor()
}

/**
 * A new Projeto, created from the company page through the Hub's door as Início's name step sends
 * it, then opened; returns the refusal's code when the Hub refuses. Início creates a Projeto only
 * with a first request to the Builder (step 13.1), which `start.test.tsx` proves; these scripts
 * need the Projeto alone.
 */
export async function createProject(page: Page, name: string): Promise<string | undefined> {
  const companyId = new URL(page.url()).pathname.split('/')[2]
  const answer = await page.evaluate(
    async (sent) => {
      const response = await globalThis.fetch(sent.path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [sent.header]: sent.key },
        body: JSON.stringify({ name: sent.name }),
      })
      return { status: response.status, body: await response.json() }
    },
    {
      path: `/api/companies/${companyId}/projects`,
      header: ATTEMPT_KEY_HEADER,
      key: randomUUID(),
      name,
    },
  )
  if (answer.status !== 201) return Problem.parse(answer.body).code
  const { project } = createProjectOperation.success.body.parse(answer.body)
  await page.goto(`${TEST_ORIGIN}/companies/${companyId}/projects/${project.id}`)
  return undefined
}

/** A Projeto's card in the page's content, which opens it; the sidebar lists it too. */
export async function openProject(page: Page, name: string) {
  await page
    .getByRole('main')
    .getByRole('link', { name: new RegExp(name) })
    .click()
  await page.getByTestId('area').getByRole('heading', { name, exact: true }).waitFor()
}

export function linkIn(mail: Mail): string {
  const link = mail.text.match(/https:\/\/\S+/)?.[0]
  assert.ok(link, 'the e-mail carries no link')
  return link
}

export type LiveDatabase = Awaited<ReturnType<typeof liveHub>>['database']

/** A person with a password, as the first-person command or an accepted invitation leaves them. */
export async function personWithPassword(
  database: LiveDatabase,
  who: { name: string; email: string; role?: string },
): Promise<string> {
  const id = randomBytes(16).toString('hex')
  await database.asOwner('insert into auth.user (id, name, email, role) values ($1, $2, $3, $4)', [
    id,
    who.name,
    who.email,
    who.role ?? 'user',
  ])
  await database.asOwner(
    `insert into auth.account (id, account_id, provider_id, user_id, password, updated_at)
      values ($1, $2, 'credential', $2, $3, now())`,
    [randomBytes(16).toString('hex'), id, await hashPassword(PASSWORD)],
  )
  return id
}

/** Empresa A with Ana its owner and Carla a member, and no nickname yet. */
export async function plantCompany(database: LiveDatabase, owner: string, member: string) {
  const companyId = randomUUID().replaceAll('-', '')
  await database.asOwner(
    `insert into auth.company (id, name, slug, created_at, attempt_key, nickname)
      values ($1, 'Empresa A', $1, now(), $1, null)`,
    [companyId],
  )
  for (const [user, role] of [
    [owner, 'owner'],
    [member, 'member'],
  ]) {
    await database.asOwner(
      `insert into auth.member (id, company_id, user_id, role, created_at)
        values ($1, $2, $3, $4, now())`,
      [randomUUID().replaceAll('-', ''), companyId, user, role],
    )
  }
  return companyId
}
