// The apps' journeys of steps 9 and 10 share their scenario: the real Hub, Empresa A with Ana its
// owner and Carla a member, Pedidos with its company database on the test server, and the steps
// of sending a folder and opening the app (testing T5, T6, T14).
import assert from 'node:assert/strict'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import type { BrowserContext, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { createCompanyDatabase } from '../../apps/server/src/platform/test-company-postgres.ts'
import { TEST_APPS_DOMAIN, TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  cloudflareServer,
  dbExport,
  EDGE_HUB,
  edgeEnv,
  Jar,
  namespace,
  visitApp,
} from './apps-edge.ts'
import {
  chooseNickname,
  closeBrowser,
  liveHub,
  openOnHub,
  PASSWORD,
  personWithPassword,
  plantCompany,
  reachHub,
  signIn,
  watchConsole,
} from './live-hub.ts'

const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
export const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const OWNER_IP = '198.51.100.10'
const FOLDERS = join(import.meta.dirname, '..', '..', 'dist', 'apps')
export const GREEN = '--cor: #0b6e4f'
export const PURPLE = '--cor: #6b2fa3'
export const RECADO = 'Ligar para o fornecedor'

/** The real Hub, Empresa A with Ana its owner and Carla a member, and a browser window for each. */
export async function scenario(t: TestContext) {
  const cloudflare = await cloudflareServer(t)
  const hub = await liveHub(t, 'http://127.0.0.1:9/unused', cloudflare.url)
  await plantCompany(
    hub.database,
    await personWithPassword(hub.database, ANA),
    await personWithPassword(hub.database, CARLA),
  )
  const browser = await chromium.launch()
  t.after(() => closeBrowser(browser))
  const problems: string[] = []
  async function window(ip: string) {
    const context = await browser.newContext()
    await reachHub(context, hub.port, ip)
    const page = await context.newPage()
    watchConsole(page, problems)
    return { context, page }
  }
  const owner = await window(OWNER_IP)
  const member = await window('203.0.113.10')
  return { t, hub, cloudflare, owner, member, problems }
}

export type Scenario = Awaited<ReturnType<typeof scenario>>
export type Door = Parameters<typeof visitApp>[0]

/** Ana creates Pedidos; its company database is then one on the test server, which `db` reaches. */
export async function pedidosOf(s: Scenario) {
  const { page } = s.owner
  await page.goto(`${TEST_ORIGIN}/`)
  await signIn(page, ANA.email, PASSWORD)
  await chooseNickname(page)
  await page.getByLabel('Nome do Projeto').fill('Pedidos')
  await page.getByRole('button', { name: 'Criar Projeto', exact: true }).click()
  await page.getByRole('link', { name: /Pedidos/ }).click()
  await page.getByRole('heading', { name: 'Pedidos', exact: true }).waitFor()
  const address = await page.getByText(`.${TEST_APPS_DOMAIN}`).textContent()
  const label = (address ?? '').replace(`.${TEST_APPS_DOMAIN}`, '')
  const [neonProject] = s.hub.neon.projects()
  assert.ok(neonProject, 'the first Projeto made the company database')
  const companyDatabase = await createCompanyDatabase(s.t)
  s.hub.neon.ownedBy(neonProject.id, companyDatabase)
  const key = s.hub.config.appLoginKey.reveal()
  const door: Door = {
    env: edgeEnv(s.hub.edgePort, key, namespace(s.t, s.cloudflare)),
    exports: dbExport(companyDatabase, key),
    label,
  }
  return { url: page.url(), door, companyDatabase }
}

export async function sendFolder(page: Page, settings: string, folder: string) {
  await page.goto(settings)
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Enviar versão' }).click()
  await (await chooser).setFiles(join(FOLDERS, folder))
}

/** The Hub's handoff, asked as the browser that holds Ana's Hub session would ask it. */
async function handoff(s: Scenario, context: BrowserContext, open: URL) {
  const cookies = await context.cookies(TEST_ORIGIN)
  const cookie = cookies.map(({ name, value }) => `${name}=${value}`).join('; ')
  const answered = await openOnHub(s.hub.port, `${open.pathname}${open.search}`, cookie)
  assert.equal(answered.status, 303)
  return new URL(answered.location)
}

/** Abrir app: the dispatcher sends to the Hub, the Hub's pass comes back, and the app answers. */
export async function openApp(s: Scenario, door: Door, color: string) {
  const app = new Jar()
  const first = await visitApp(door, app, '/')
  assert.equal(first.status, 303)
  const open = new URL(first.headers.get('location') ?? '')
  assert.equal(`${open.origin}${open.pathname}`, `${EDGE_HUB}/apps/open`)
  const pass = await handoff(s, s.owner.context, open)
  assert.equal((await visitApp(door, app, `${pass.pathname}${pass.search}`)).status, 303)
  const page = await visitApp(door, app, '/')
  assert.equal(page.status, 200)
  assert.match(page.text, /<h1>Recados<\/h1>/)
  const style = await visitApp(door, app, '/style.css')
  assert.ok(style.text.includes(color), `the version on the air has ${color}`)
  return app
}

export async function recados(door: Door, app: Jar): Promise<string[]> {
  const listed = await visitApp(door, app, '/api/listarRecados', {})
  assert.equal(listed.status, 200)
  return JSON.parse(listed.text).map((recado: { texto: string }) => recado.texto)
}
