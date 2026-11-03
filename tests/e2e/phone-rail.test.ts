import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  closeBrowser,
  createProject,
  liveHub,
  PASSWORD,
  personWithPassword,
  plantCompany,
  reachHub,
  signIn,
  waitForHome,
  watchConsole,
} from './live-hub.ts'

// The phone's menu on a real Hub, touched as a person touches it: every place of the rail opens its
// page from whichever page the person is on, and the bell opens its panel.
const OWNER = { name: 'Davi Costa', email: 'davi@example.test', role: 'admin' }
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const PLACES = [
  { link: 'Início', path: '' },
  { link: 'Projetos', path: '/projects' },
  { link: 'Integrações', path: '/integrations' },
  { link: 'Automações', path: '/automations' },
  { link: 'Configurações', path: '/settings' },
]

/** Opens the drawer and returns its rail, whose tiles the Projeto's own list never repeats. */
async function openDrawer(page: Page) {
  await page.getByRole('button', { name: 'Abrir navegação' }).tap()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  return drawer.locator('[data-slot="sidebar-rail-column"]')
}

test('o menu do celular: tocar num lugar do rail abre a página dele, de qualquer página, e o sino abre o painel', async (t) => {
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const owner = await personWithPassword(database, OWNER)
  const ana = await personWithPassword(database, ANA)
  const companyId = await plantCompany(database, owner, ana)
  await database.asOwner(`update auth.company set nickname = 'acme' where id = $1`, [companyId])
  const problems: string[] = []
  const browser = await chromium.launch()
  t.after(() => closeBrowser(browser))
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  await reachHub(context, port, '203.0.113.9')
  const page = await context.newPage()
  watchConsole(page, problems)
  const home = `/companies/${companyId}`
  await page.goto(`${TEST_ORIGIN}/`)
  await signIn(page, OWNER.email, PASSWORD)
  await page.waitForURL((url) => url.pathname.startsWith('/companies/'))
  await page.goto(`${TEST_ORIGIN}${home}`)
  await waitForHome(page)
  await createProject(page, 'Encomendas')
  const projectUrl = new URL(page.url()).pathname
  const starts = [`${home}/integrations`, projectUrl, home]
  for (const start of starts) {
    for (const place of PLACES) {
      await page.goto(`${TEST_ORIGIN}${start}`)
      const rail = await openDrawer(page)
      await rail.getByRole('link', { name: place.link, exact: true }).tap()
      const wanted = `${home}${place.path}`
      await page.waitForURL((url) => url.pathname === wanted)
      await page.getByRole('dialog', { name: 'Navegação' }).waitFor({ state: 'hidden' })
    }
    await page.goto(`${TEST_ORIGIN}${start}`)
    const rail = await openDrawer(page)
    await rail.getByRole('button', { name: /^Notificações/ }).tap()
    await page.getByRole('heading', { name: 'Notificações', exact: true }).waitFor()
    await page.goto(`${TEST_ORIGIN}${start}`)
    const foot = await openDrawer(page)
    await foot.getByRole('button', { name: `Conta de ${OWNER.name}` }).tap()
    await page.getByRole('menuitem', { name: /Sair do Conexus/ }).waitFor()
  }
  assert.deepEqual(problems, [])
})
