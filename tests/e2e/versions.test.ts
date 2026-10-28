import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright-core'
import { TEST_APPS_DOMAIN, TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { visitApp } from './apps-edge.ts'
import type { Scenario } from './apps-journey.ts'
import {
  builderSends,
  CARLA,
  GREEN,
  openApp,
  PURPLE,
  pedidosOf,
  publishVersion,
  RECADO,
  recados,
  scenario,
} from './apps-journey.ts'
import { openProject, PASSWORD, signIn, waitForHome } from './live-hub.ts'

// Step 9's journey, with the Builder as the one who sends since step 14.1: the owner's Builder
// turns send Recados, the Projeto's Versões in Chromium list them under the conversation's numbers,
// a recado is written through the real dispatcher, a second version goes, the first is put back and
// the Projeto is deleted. Cloudflare's API and Neon's are faked at their HTTP doors; the app's `db`
// runs on the test server with the login the Hub made. The app's visits carry their cookies by
// hand, as step 8's journey does: a browser route is never called for a redirect's next request
// (testing T5, T6, T14).
/** 1. Versões: nothing on the app yet; Recados 1 goes to the Prévia. The member sees the list too. */
async function firstVersion(s: Scenario, pedidos: string) {
  const { page } = s.owner
  await page.goto(`${pedidos}?lens=project&section=versions`)
  await page
    .getByText(
      'Nenhuma versão foi ao app ainda. Cada versão do Builder que monta aparece aqui; até lá, o endereço mostra o app de exemplo.',
    )
    .waitFor()
  await builderSends(s, pedidos, 'recados-1')
  await page.goto(`${pedidos}?lens=project&section=versions`)
  await page.getByText('Versão 1 · no ar').waitFor()
  await s.member.page.goto(`${TEST_ORIGIN}/`)
  await signIn(s.member.page, CARLA.email, PASSWORD)
  await waitForHome(s.member.page)
  await openProject(s.member.page, 'Pedidos')
  await s.member.page.getByRole('link', { name: 'Abrir app' }).waitFor()
  await s.member.page.goto(`${pedidos}?lens=project&section=versions`)
  await s.member.page.getByText('Versão 1 · no ar').waitFor()
}

/**
 * Abrir app, once a version is on the air, opens the app's address in a new tab and leaves the Hub
 * where it was (step 14.1, criterion 28). This browser reaches only the Hub, so the tab's first
 * request is answered here; the app's own pages are the dispatcher's, visited by hand below.
 */
async function opensAppTab(page: Page, pedidos: string, label: string) {
  await page.goto(pedidos)
  const address = `https://${label}.${TEST_APPS_DOMAIN}/`
  await page
    .context()
    .route(address, (route) => route.fulfill({ contentType: 'text/html', body: '' }))
  const link = page.getByRole('link', { name: 'Abrir app' })
  assert.equal(await link.getAttribute('href'), address)
  const at = page.url()
  const [tab] = await Promise.all([page.context().waitForEvent('page'), link.click()])
  await tab.waitForURL(address)
  assert.equal(page.url(), at)
  await tab.close()
}

/** 4. Voltar para esta, on Versão 1: the warning says the data stay as they are. */
async function putVersionOneBack(page: Page, pedidos: string) {
  await page.goto(`${pedidos}?lens=project&section=versions`)
  await page.getByRole('button', { name: 'Voltar para esta' }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByText('Os dados ficam como estão.').waitFor()
  await dialog.getByRole('button', { name: 'Voltar para a Versão 1' }).click()
  await dialog.waitFor({ state: 'hidden' })
}

/** 5. Deleting Pedidos says the app, its database and its versions go. */
async function deletePedidos(page: Page, pedidos: string) {
  await page.goto(`${pedidos}?lens=project`)
  await page.getByRole('button', { name: 'Apagar Projeto' }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByText('O app, o banco dele e as versões vão junto com o Projeto.').waitFor()
  await dialog.getByLabel('Digite o nome do Projeto').fill('Pedidos')
  await dialog.getByRole('button', { name: 'Apagar Projeto' }).click()
  await page.getByText('Projeto apagado.').waitFor()
}

test('o roteiro de Enviar um app: o Builder envia, gravar, segunda versão, voltar e apagar o Projeto', async (t) => {
  const s = await scenario(t)
  const { page } = s.owner
  const pedidos = await pedidosOf(s)
  await firstVersion(s, pedidos.url)
  await opensAppTab(page, pedidos.url, pedidos.door.label)
  // 2. Publicar, then Abrir app: Recados; a recado written stays for the next visit.
  await publishVersion(s, pedidos.url, 1)
  const app = await openApp(s, pedidos.door, GREEN)
  const written = await visitApp(pedidos.door, app, '/api/escreverRecado', { texto: RECADO })
  assert.equal(written.status, 200)
  assert.deepEqual(await recados(pedidos.door, app), [RECADO])
  // 3. Recados 2: another colour, and the recado is there.
  await builderSends(s, pedidos.url, 'recados-2')
  await page.goto(`${pedidos.url}?lens=project&section=versions`)
  await page.getByText('Versão 2 · no ar').waitFor()
  await publishVersion(s, pedidos.url, 2)
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
