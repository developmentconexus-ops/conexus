import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
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
  PASSWORD,
  personWithPassword,
  plantCompany,
  reachHub,
  signIn,
  watchConsole,
} from './live-hub.ts'

// Step 9's journey: the owner sends Recados from the Projeto's Configurações in Chromium, writes a
// recado through the real dispatcher, sends a second version, puts the first back and deletes the
// Projeto. Cloudflare's API and Neon's are faked at their HTTP doors; the app's `db` runs on the
// test server with the login the Hub made. The app's visits carry their cookies by hand, as step 8's
// journey does: a browser route is never called for a redirect's next request (testing T5, T6, T14).
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const OWNER_IP = '198.51.100.10'
const FOLDERS = join(import.meta.dirname, '..', '..', 'dist', 'apps')
const GREEN = '--cor: #0b6e4f'
const PURPLE = '--cor: #6b2fa3'
const RECADO = 'Ligar para o fornecedor'

/** The real Hub, Empresa A with Ana its owner and Carla a member, and a browser window for each. */
async function scenario(t: TestContext) {
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

type Scenario = Awaited<ReturnType<typeof scenario>>
type Door = Parameters<typeof visitApp>[0]

/** Ana creates Pedidos; its company database is then one on the test server, which `db` reaches. */
async function pedidosOf(s: Scenario) {
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
  return { url: page.url(), door }
}

async function sendFolder(page: Page, settings: string, folder: string) {
  await page.goto(settings)
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Enviar versão' }).click()
  await (await chooser).setFiles(join(FOLDERS, folder))
}

/** The Hub's handoff, asked as the browser that holds Ana's Hub session would ask it. */
async function handoff(s: Scenario, context: BrowserContext, query: URLSearchParams) {
  const cookies = await context.cookies(TEST_ORIGIN)
  // The web's ban on the global `fetch` (web W9) is about the screens; a test is a client of the Hub.
  const response = await globalThis.fetch(`http://127.0.0.1:${s.hub.port}/api/apps/handoffs`, {
    method: 'POST',
    headers: {
      origin: TEST_ORIGIN,
      'cf-connecting-ip': OWNER_IP,
      [ATTEMPT_KEY_HEADER]: randomUUID(),
      'content-type': 'application/json',
      cookie: cookies.map(({ name, value }) => `${name}=${value}`).join('; '),
    },
    body: JSON.stringify({ host: query.get('host'), binding: query.get('binding') }),
  })
  assert.equal(response.status, 201)
  const { location } = Object(await response.json())
  return new URL(location)
}

/** Abrir app: the dispatcher sends to the Hub, the Hub's pass comes back, and the app answers. */
async function openApp(s: Scenario, door: Door, color: string) {
  const app = new Jar()
  const first = await visitApp(door, app, '/')
  assert.equal(first.status, 303)
  const open = new URL(first.headers.get('location') ?? '')
  assert.equal(`${open.origin}${open.pathname}`, `${EDGE_HUB}/apps/open`)
  const pass = await handoff(s, s.owner.context, open.searchParams)
  assert.equal((await visitApp(door, app, `${pass.pathname}${pass.search}`)).status, 303)
  const page = await visitApp(door, app, '/')
  assert.equal(page.status, 200)
  assert.match(page.text, /<h1>Recados<\/h1>/)
  const style = await visitApp(door, app, '/style.css')
  assert.ok(style.text.includes(color), `the version on the air has ${color}`)
  return app
}

async function recados(door: Door, app: Jar): Promise<string[]> {
  const listed = await visitApp(door, app, '/api/listarRecados', {})
  assert.equal(listed.status, 200)
  return JSON.parse(listed.text).map((recado: { texto: string }) => recado.texto)
}

/** 1. Configurações: nothing sent yet; Recados 1 goes on the air. The member has no Configurações. */
async function firstVersion(s: Scenario, pedidos: string) {
  const { page } = s.owner
  await page.goto(`${pedidos}/settings`)
  await page.getByText('Nenhuma versão enviada. O endereço mostra o app de exemplo.').waitFor()
  await sendFolder(page, `${pedidos}/settings`, 'recados-1')
  await page.getByText('Versão 1 · no ar').waitFor()
  await s.member.page.goto(`${TEST_ORIGIN}/`)
  await signIn(s.member.page, CARLA.email, PASSWORD)
  await s.member.page.getByRole('link', { name: /Pedidos/ }).click()
  await s.member.page.getByRole('link', { name: 'Abrir app' }).waitFor()
  assert.equal(await s.member.page.getByRole('link', { name: 'Configurações' }).count(), 0)
}

/** 4. Voltar para esta, on Versão 1: the warning says the data stay as they are. */
async function putVersionOneBack(page: Page, pedidos: string) {
  await page.goto(`${pedidos}/settings`)
  await page.getByRole('button', { name: 'Voltar para esta' }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByText('Os dados ficam como estão.').waitFor()
  await dialog.getByRole('button', { name: 'Voltar para a Versão 1' }).click()
  await page.getByText('Versão 1 · no ar').waitFor()
}

/** 5. Deleting Pedidos says the app, its database and its versions go. */
async function deletePedidos(page: Page, pedidos: string) {
  await page.goto(pedidos)
  await page.getByRole('button', { name: 'Apagar Projeto' }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByText('O app, o banco dele e as versões vão junto com o Projeto.').waitFor()
  await dialog.getByLabel('Digite o nome do Projeto').fill('Pedidos')
  await dialog.getByRole('button', { name: 'Apagar Projeto' }).click()
  await page.getByText('Projeto apagado.').waitFor()
}

test('o roteiro de Enviar um app: enviar, gravar, segunda versão, voltar e apagar o Projeto', async (t) => {
  const s = await scenario(t)
  const { page } = s.owner
  const pedidos = await pedidosOf(s)
  await firstVersion(s, pedidos.url)
  // 2. Abrir app: Recados; a recado written stays for the next visit.
  const app = await openApp(s, pedidos.door, GREEN)
  const written = await visitApp(pedidos.door, app, '/api/escreverRecado', { texto: RECADO })
  assert.equal(written.status, 200)
  assert.deepEqual(await recados(pedidos.door, app), [RECADO])
  // 3. Recados 2: another colour, and the recado is there.
  await sendFolder(page, `${pedidos.url}/settings`, 'recados-2')
  await page.getByText('Versão 2 · no ar').waitFor()
  assert.deepEqual(await recados(pedidos.door, await openApp(s, pedidos.door, PURPLE)), [RECADO])
  await putVersionOneBack(page, pedidos.url)
  assert.deepEqual(await recados(pedidos.door, await openApp(s, pedidos.door, GREEN)), [RECADO])
  await deletePedidos(page, pedidos.url)
  const gone = await visitApp(pedidos.door, app, '/')
  assert.equal(gone.status, 404)
  assert.match(gone.text, /Este app não existe\./)
  assert.deepEqual(s.cloudflare.workers(), [], 'every version left with the Projeto')
  assert.deepEqual(s.cloudflare.bearers(), [s.hub.config.cloudflareAppsToken.reveal()])
  assert.deepEqual(s.problems, [])
})
