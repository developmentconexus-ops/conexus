import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { visitApp } from './apps-edge.ts'
import type { Scenario } from './apps-journey.ts'
import {
  CARLA,
  GREEN,
  openApp,
  PURPLE,
  pedidosOf,
  RECADO,
  recados,
  scenario,
  sendFolder,
} from './apps-journey.ts'
import { openProject, PASSWORD, signIn, waitForHome } from './live-hub.ts'

// Step 9's journey: the owner sends Recados from the Projeto's Configurações in Chromium, writes a
// recado through the real dispatcher, sends a second version, puts the first back and deletes the
// Projeto. Cloudflare's API and Neon's are faked at their HTTP doors; the app's `db` runs on the
// test server with the login the Hub made. The app's visits carry their cookies by hand, as step 8's
// journey does: a browser route is never called for a redirect's next request (testing T5, T6, T14).
/** 1. Configurações: nothing sent yet; Recados 1 goes on the air. The member has no Configurações. */
async function firstVersion(s: Scenario, pedidos: string) {
  const { page } = s.owner
  await page.goto(`${pedidos}/settings`)
  await page.getByText('Nenhuma versão enviada. O endereço mostra o app de exemplo.').waitFor()
  await sendFolder(page, `${pedidos}/settings`, 'recados-1')
  await page.getByText('Versão 1 · no ar').waitFor()
  await s.member.page.goto(`${TEST_ORIGIN}/`)
  await signIn(s.member.page, CARLA.email, PASSWORD)
  await waitForHome(s.member.page)
  await openProject(s.member.page, 'Pedidos')
  await s.member.page.getByRole('link', { name: 'Abrir app' }).waitFor()
  const content = s.member.page.getByRole('main')
  assert.equal(await content.getByRole('link', { name: 'Configurações' }).count(), 0)
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
