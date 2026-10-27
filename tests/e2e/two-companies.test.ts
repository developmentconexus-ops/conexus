import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Browser, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import type { Mail } from './live-hub.ts'
import {
  closeBrowser,
  firstEntry,
  linkIn,
  liveHub,
  mailProvider,
  openSettings,
  PASSWORD,
  personWithPassword,
  reachHub,
  sidebarOf,
  signIn,
  waitForHome,
  watchConsole,
} from './live-hub.ts'

// Step 5's journey in Chromium: two companies, the crossed refusal, the operator deletes B, B's
// owner still signs in and A stays.
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const OWNERS = {
  A: { name: 'Davi Costa', email: 'davi@example.test', company: 'Empresa A' },
  B: { name: 'Edu Lima', email: 'edu@example.test', company: 'Empresa B' },
}
const CNPJ = { A: '12.ABC.345/01DE-35', B: '11.222.333/0001-81' }
const NEW_PASSWORD = 'senha-nova-1'
const NOT_FOUND = 'Não encontramos o que você procurou.'

async function register(page: Page, cnpj: string, name: string, email: string) {
  await page.goto(`${TEST_ORIGIN}/operations/clients/new`)
  await page.getByLabel('CNPJ').fill(cnpj)
  await page.getByLabel('Razão social').fill(`${name} Ltda`)
  await page.getByLabel('Nome de exibição').fill(name)
  await page.getByLabel('E-mail do administrador').fill(email)
  await page.getByRole('button', { name: 'Cadastrar cliente' }).click()
  await page.getByRole('heading', { name, exact: true }).waitFor()
}

/** The owner creates a password from the invitation's mail and accepts; returns the link. */
async function join(page: Page, next: () => Promise<Mail>, owner: typeof OWNERS.A) {
  const link = linkIn(await next())
  await page.goto(link)
  await page.getByLabel('Nome').fill(owner.name)
  await page.getByLabel('Senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Criar senha', exact: true }).click()
  await page.getByRole('button', { name: 'Aceitar convite' }).click()
  await firstEntry(page)
  await sidebarOf(page).getByText(owner.company, { exact: true }).waitFor()
  return link
}

test('o roteiro de duas empresas: a recusa cruzada, apagar B, o dono de B ainda entra e A segue', async (t) => {
  const mail = await mailProvider(t)
  const browser: Browser = await chromium.launch()
  t.after(() => closeBrowser(browser))
  const { port, database } = await liveHub(t, mail.url)
  await personWithPassword(database, ANA)
  const problems: string[] = []
  async function window(ip: string) {
    const context = await browser.newContext()
    await reachHub(context, port, ip)
    const page = await context.newPage()
    watchConsole(page, problems)
    return page
  }
  const ana = await window('198.51.100.10')
  const davi = await window('203.0.113.9')
  const edu = await window('203.0.113.10')

  await ana.goto(`${TEST_ORIGIN}/`)
  await signIn(ana, ANA.email, PASSWORD)
  await ana.getByRole('heading', { name: 'Clientes', exact: true }).waitFor()
  await register(ana, CNPJ.A, OWNERS.A.company, OWNERS.A.email)
  await join(davi, mail.next, OWNERS.A)
  await register(ana, CNPJ.B, OWNERS.B.company, OWNERS.B.email)
  const linkB = await join(edu, mail.next, OWNERS.B)
  const addressB = edu.url()

  // Davi owns one company, so the entry opens its Início; B's address is not found for him.
  await davi.goto(`${TEST_ORIGIN}/`)
  await waitForHome(davi)
  await davi.goto(addressB)
  await davi.getByRole('heading', { name: NOT_FOUND }).waitFor()

  await ana.goto(`${TEST_ORIGIN}/operations/clients`)
  await ana.getByRole('link', { name: new RegExp(OWNERS.B.company) }).click()
  await ana.getByRole('button', { name: 'Apagar cliente' }).click()
  const dialog = ana.getByRole('alertdialog')
  const confirm = dialog.getByRole('button', { name: 'Apagar cliente' })
  assert.equal(await confirm.isDisabled(), true)
  await dialog.getByLabel('Digite o nome do cliente').fill(OWNERS.B.company)
  await confirm.click()
  await ana.getByText('Cliente apagado.').waitFor()
  await ana.getByRole('link', { name: new RegExp(OWNERS.A.company) }).waitFor()
  assert.equal(await ana.getByRole('link', { name: new RegExp(OWNERS.B.company) }).count(), 0)
  await register(ana, CNPJ.B, 'Empresa B Nova', 'fabi@example.test')

  await edu.reload()
  await edu.getByRole('heading', { name: NOT_FOUND }).waitFor()
  await edu.goto(`${TEST_ORIGIN}/`)
  await edu.getByRole('heading', { name: 'Você ainda não está em nenhuma empresa.' }).waitFor()
  await edu.getByRole('button', { name: 'Sair do Conexus' }).click()
  await signIn(edu, OWNERS.B.email, NEW_PASSWORD)
  await edu.getByRole('heading', { name: 'Você ainda não está em nenhuma empresa.' }).waitFor()
  await edu.goto(linkB)
  await edu.getByRole('heading', { name: NOT_FOUND }).waitFor()

  await davi.goto(`${TEST_ORIGIN}/`)
  await waitForHome(davi)
  await openSettings(davi, 'Pessoas e convites')
  assert.deepEqual(problems, [])
})
