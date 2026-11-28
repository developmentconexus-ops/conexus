// The apps' journeys of steps 9 and 10 share their scenario: the real Hub, Empresa A with Ana its
// owner and Carla a member, Pedidos with its company database on the test server, and the steps of
// sending a packed app through the Hub's apps door and of opening the app (testing T5, T6, T14).
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { Manifest, mediaTypeOf } from '@conexus/app-contract'
import { CompanyId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import type { BrowserContext } from 'playwright-core'
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
import { hubWindow } from './hub-window.ts'
import {
  createProject,
  firstEntry,
  liveHub,
  openOnHub,
  PASSWORD,
  personWithPassword,
  plantCompany,
  signIn,
} from './live-hub.ts'

const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
export const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const OWNER_IP = '198.51.100.10'
const send = globalThis.fetch
const FOLDERS = join(import.meta.dirname, '..', '..', 'dist', 'apps')
export const GREEN = '--cor: #0b6e4f'
export const PURPLE = '--cor: #6b2fa3'
export const RECADO = 'Ligar para o fornecedor'

/** The real Hub, Empresa A with Ana its owner and Carla a member, and a browser window for each. */
export async function scenario(t: TestContext) {
  const cloudflare = await cloudflareServer(t)
  const closers: (() => Promise<void>)[] = []
  t.after(async () => {
    for (const close of closers) await close()
  })
  const hub = await liveHub(t, 'http://127.0.0.1:9/unused', cloudflare.url)
  const anaId = await personWithPassword(hub.database, ANA)
  const companyId = await plantCompany(
    hub.database,
    anaId,
    await personWithPassword(hub.database, CARLA),
  )
  const problems: string[] = []
  async function window(ip: string) {
    const page = await hubWindow(closers, hub.port, ip, problems)
    return { context: page.context(), page }
  }
  const owner = await window(OWNER_IP)
  const member = await window('203.0.113.10')
  return { t, hub, cloudflare, anaId, companyId, owner, member, problems }
}

export type Scenario = Awaited<ReturnType<typeof scenario>>
export type Door = Parameters<typeof visitApp>[0]

/** Ana creates Pedidos; its company database is then one on the test server, which `db` reaches. */
export async function pedidosOf(s: Scenario) {
  const { page } = s.owner
  await page.goto(`${TEST_ORIGIN}/`)
  await signIn(page, ANA.email, PASSWORD)
  await firstEntry(page)
  await page.goto(`${TEST_ORIGIN}/companies/${s.companyId}`)
  await createProject(page, 'Pedidos')
  await page.getByRole('heading', { name: 'Pedidos', exact: true }).waitFor()
  await page.getByRole('tab', { name: 'Prévia' }).waitFor()
  const url = page.url()
  await page
    .getByRole('navigation', { name: 'Navegação' })
    .getByRole('link', { name: 'Sobre' })
    .click()
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
  return { url, door, companyDatabase }
}

function filesOf(folder: string): string[] {
  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .filter((path) => statSync(join(folder, path)).isFile())
    .map((path) => path.split('\\').join('/'))
}

/**
 * Sends the packed app `folder` (`npm run app:pack`) to Pedidos as Ana, the next number of the
 * Projeto, through the apps' door a Builder turn's end called. Returns once the Prévia has it.
 */
export async function sendPacked(s: Scenario, pedidos: string, folder: string) {
  const [, companyId, projectId] =
    new URL(pedidos).pathname.match(/companies\/(\w+)\/projects\/(\w+)/) ?? []
  const root = join(FOLDERS, folder)
  const manifest = Manifest.parse(JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')))
  const files = filesOf(root)
    .filter((path) => path !== 'manifest.json')
    .map((path) => ({
      path,
      mediaType: mediaTypeOf(path),
      base64: readFileSync(join(root, path)).toString('base64'),
    }))
  const [last] = await s.hub.database.asOwner(
    'select coalesce(max(number), 0) as number from apps.app_version where project_id = $1',
    [projectId],
  )
  const number = Number(last?.number) + 1
  const sent = await s.hub.apps.sendFromBuilder({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
    personId: PersonId.parse(s.anaId),
    runId: RunId.parse(randomUUID()),
    number,
    folder: { manifest, files },
  })
  assert.equal(sent?.state, 'ready', JSON.stringify(sent))
  return number
}

/** The Hub's handoff, asked as the browser that holds Ana's Hub session would ask it. */
async function handoff(s: Scenario, context: BrowserContext, open: URL) {
  const cookies = await context.cookies(TEST_ORIGIN)
  const cookie = cookies.map(({ name, value }) => `${name}=${value}`).join('; ')
  const answered = await openOnHub(s.hub.port, `${open.pathname}${open.search}`, cookie)
  assert.equal(answered.status, 303)
  return new URL(answered.location)
}

/**
 * Publicar, as the Versões tab's request: the app's tab opens the published version, and the
 * Prévia's versions are no longer what a tab gets (step 17).
 */
export async function publishVersion(s: Scenario, pedidos: string, number: number) {
  const [, companyId, projectId] =
    new URL(pedidos).pathname.match(/companies\/(\w+)\/projects\/(\w+)/) ?? []
  const cookies = await s.owner.context.cookies(TEST_ORIGIN)
  const answered = await send(
    `http://127.0.0.1:${s.hub.port}/api/companies/${companyId}/projects/${projectId}/published-version`,
    {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        origin: TEST_ORIGIN,
        cookie: cookies.map(({ name, value }) => `${name}=${value}`).join('; '),
      },
      body: JSON.stringify({ number }),
    },
  )
  assert.equal(answered.status, 200, await answered.text())
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
