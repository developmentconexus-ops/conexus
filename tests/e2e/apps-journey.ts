// The apps' journeys of steps 9 and 10 share their scenario: the real Hub, Empresa A with Ana its
// owner and Carla a member, its Builder ready, Pedidos with its company database on the test
// server, and the steps of a Builder turn that sends a packed app and of opening the app (testing
// T5, T6, T14). Anthropic is a double that writes what it is asked, and the machine's check program
// is the one thing faked beyond the providers: it passes and leaves the packed app as the version.
import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import type { CheckReport } from '@conexus/app/check'
import { STEP_NAMES } from '@conexus/app/check'
import type { BrowserContext } from 'playwright-core'
import { ASK, versionWriting } from '../../apps/server/src/hub/apps/test-versions.ts'
import { plantAnthropic } from '../../apps/server/src/platform/test-anthropic.ts'
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
import { ask, chooseDefaultModel, KEYS, transcriptOf } from './conversation-journey.ts'
import { hubWindow, openConversation } from './hub-window.ts'
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
import { linkKey } from './model-accounts-journey.ts'

const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
export const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const OWNER_IP = '198.51.100.10'
const FOLDERS = join(import.meta.dirname, '..', '..', 'dist', 'apps')
export const GREEN = '--cor: #0b6e4f'
export const PURPLE = '--cor: #6b2fa3'
export const RECADO = 'Ligar para o fornecedor'

/** The real Hub, Empresa A with Ana its owner and Carla a member, and a browser window for each. */
export async function scenario(t: TestContext) {
  plantAnthropic(t, versionWriting())
  const cloudflare = await cloudflareServer(t)
  const closers: (() => Promise<void>)[] = []
  t.after(async () => {
    for (const close of closers) await close()
  })
  const hub = await liveHub(t, 'http://127.0.0.1:9/unused', cloudflare.url)
  const companyId = await plantCompany(
    hub.database,
    await personWithPassword(hub.database, ANA),
    await personWithPassword(hub.database, CARLA),
  )
  const problems: string[] = []
  async function window(ip: string) {
    const page = await hubWindow(closers, hub.port, ip, problems)
    return { context: page.context(), page }
  }
  const owner = await window(OWNER_IP)
  const member = await window('203.0.113.10')
  return { t, hub, cloudflare, companyId, owner, member, problems }
}

export type Scenario = Awaited<ReturnType<typeof scenario>>
export type Door = Parameters<typeof visitApp>[0]

/**
 * Ana links Anthropic and picks the default model, then creates Pedidos; its company database is
 * then one on the test server, which `db` reaches.
 */
export async function pedidosOf(s: Scenario) {
  const { page } = s.owner
  await page.goto(`${TEST_ORIGIN}/`)
  await signIn(page, ANA.email, PASSWORD)
  await firstEntry(page)
  await page.goto(`${TEST_ORIGIN}/companies/${s.companyId}/settings/model-accounts`)
  await linkKey(page, 'Time 1', KEYS.first)
  await page.getByText('Time 1', { exact: true }).first().waitFor()
  await chooseDefaultModel(page, s.companyId)
  await page.goto(`${TEST_ORIGIN}/companies/${s.companyId}`)
  await createProject(page, 'Pedidos')
  await page.getByTestId('area').getByRole('heading', { name: 'Pedidos', exact: true }).waitFor()
  await page.getByRole('tab', { name: 'Prévia' }).waitFor()
  const url = page.url()
  await page.getByRole('tab', { name: 'Projeto' }).click()
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

const PASSED: CheckReport = {
  ok: true,
  steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
}

/**
 * Ana asks the Builder for a version on a new conversation of Pedidos; the machine's check passes
 * and leaves the packed `folder` where the template's check leaves the version, and the end of the
 * turn sends it. Returns once the conversation says whether it reached the app.
 */
export async function builderSends(s: Scenario, pedidos: string, folder: string) {
  const machine = s.hub.machineFolder
  mkdirSync(machine, { recursive: true })
  writeFileSync(join(machine, 'check-passed.json'), JSON.stringify(PASSED))
  const program = join(machine, 'check')
  writeFileSync(
    program,
    [
      '#!/bin/sh',
      // Called as `check --root <app folder>`.
      'out="$2/node_modules/.conexus/version"',
      'rm -rf "$out" && mkdir -p "$(dirname "$out")"',
      `cp -r '${join(FOLDERS, folder)}' "$out"`,
      `cat '${machine}/check-passed.json'`,
    ].join('\n'),
  )
  chmodSync(program, 0o755)
  const { page } = s.owner
  await page.goto(pedidos)
  await page.getByRole('combobox', { name: 'Conversas' }).waitFor()
  await openConversation(page, () => page.getByRole('button', { name: 'Nova conversa' }).click())
  await ask(page, `${ASK}${folder} ${Date.now()}`)
  await transcriptOf(page)
    .getByText(/^Prévia (pronta\.|não atualizada: )/)
    .waitFor()
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
