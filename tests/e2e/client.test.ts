import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Browser, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  acceptFirstOwnerInvitation,
  createPassword,
  ownerInvitationLink,
  registerClient,
} from './central-journey.ts'
import {
  closeBrowser,
  firstEntry,
  liveHub,
  mailProvider,
  openSettings,
  PASSWORD,
  personWithPassword,
  reachHub,
  sidebarOf,
  signIn,
  watchConsole,
} from './live-hub.ts'

// Step 4.2's journey in Chromium: the operator registers a client in the Operations Central, and
// its administrator joins as the first owner; then a second client with the same administrator.
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }

async function accept(page: Page, company: string) {
  await acceptFirstOwnerInvitation(page, company)
  await firstEntry(page)
  await sidebarOf(page).getByText(company, { exact: true }).waitFor()
  await openSettings(page, 'Pessoas e convites')
}

test('o roteiro da Central: cadastrar, o administrador cria a senha e entra como primeiro dono; um segundo cliente com o mesmo administrador', async (t) => {
  const mail = await mailProvider(t)
  const { port, database } = await liveHub(t, mail.url)
  await personWithPassword(database, ANA)
  const browser: Browser = await chromium.launch()
  t.after(() => closeBrowser(browser))
  const problems: string[] = []
  const anaContext = await browser.newContext()
  const daviContext = await browser.newContext()
  await reachHub(anaContext, port, '198.51.100.10')
  await reachHub(daviContext, port, '203.0.113.9')
  const ana = await anaContext.newPage()
  const davi = await daviContext.newPage()
  watchConsole(ana, problems)
  watchConsole(davi, problems)

  await ana.goto(`${TEST_ORIGIN}/`)
  await signIn(ana, ANA.email, PASSWORD)
  await ana.getByRole('heading', { name: 'Clientes', exact: true }).waitFor()
  await registerClient(
    ana,
    { cnpj: '12.ABC.345/01DE-35', legalName: 'Empresa Teste Ltda', name: 'Empresa Teste' },
    DAVI.email,
  )
  await davi.goto(await ownerInvitationLink(mail.next, 'Empresa Teste', DAVI.email))
  await createPassword(davi, DAVI.name)
  await accept(davi, 'Empresa Teste')

  await registerClient(
    ana,
    { cnpj: '11.222.333/0001-81', legalName: 'Outra Empresa Ltda', name: 'Outra Empresa' },
    DAVI.email,
  )
  await davi.goto(await ownerInvitationLink(mail.next, 'Outra Empresa', DAVI.email))
  await accept(davi, 'Outra Empresa')
  await davi.goto(`${TEST_ORIGIN}/`)
  await sidebarOf(davi).getByText('Outra Empresa', { exact: true }).waitFor()
  await davi.getByRole('button', { name: 'Trocar de empresa. Agora: Outra Empresa' }).click()
  for (const company of ['Empresa Teste', 'Outra Empresa']) {
    await davi.getByRole('menuitem', { name: company }).waitFor()
  }

  await ana.goto(`${TEST_ORIGIN}/operations/clients`)
  await ana.getByText('Ativo', { exact: true }).nth(1).waitFor()
  assert.equal(await ana.getByText('Ativo', { exact: true }).count(), 2)
  await ana.goto(`${TEST_ORIGIN}/`)
  await ana.getByRole('heading', { name: 'Clientes', exact: true }).waitFor()
  assert.equal(await ana.getByRole('button', { name: /Ir para uma empresa/ }).count(), 0)
  assert.deepEqual(problems, [])
})
