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
  chooseNickname,
  closeBrowser,
  createProject,
  leaveWelcome,
  liveHub,
  mailProvider,
  openHome,
  PASSWORD,
  personWithPassword,
  reachHub,
  sidebarOf,
  signIn,
  watchConsole,
} from './live-hub.ts'

// Step 12.2's journey, the founder's script in Chromium: the new owner prepares the company in the
// four welcome steps, lands on Início with the card of what is missing, creates a Projeto, finds it
// in the sidebar, and looks through Configurações. The Central, the Hub and the screens are real.
const OPERATOR = { name: 'Olga Reis', email: 'olga@example.test', role: 'admin' }
const OWNER = { name: 'Davi Costa', email: 'davi@example.test' }
const GUEST = 'ana@example.test'
const COMPANY = 'Padaria Teste'

/** The Central registers the company and the new owner creates the password and accepts. */
async function ownerArrives(
  operator: Page,
  owner: Page,
  next: Parameters<typeof ownerInvitationLink>[0],
) {
  await operator.goto(`${TEST_ORIGIN}/`)
  await signIn(operator, OPERATOR.email, PASSWORD)
  await operator.getByRole('heading', { name: 'Clientes', exact: true }).waitFor()
  await registerClient(
    operator,
    { cnpj: '12.ABC.345/01DE-35', legalName: 'Padaria Teste Ltda', name: COMPANY },
    OWNER.email,
  )
  await owner.goto(await ownerInvitationLink(next, COMPANY, OWNER.email))
  await createPassword(owner, OWNER.name)
  await acceptFirstOwnerInvitation(owner, COMPANY)
}

/** Step 1 shows the name and the suggested nickname; steps 2 and 3 as the script says. */
async function welcome(page: Page) {
  await page.getByText('Passo 1 de 4').waitFor()
  assert.equal(await page.getByRole('definition').textContent(), COMPANY)
  assert.match(await page.getByLabel('Apelido').inputValue(), /^[a-z0-9-]{3,}$/)
  await chooseNickname(page)
  await page.getByText('Passo 2 de 4').waitFor()
  await page.getByRole('link', { name: 'Fazer depois', exact: true }).click()
  await page.getByRole('heading', { name: 'Convide sua equipe', exact: true }).waitFor()
  await page.getByText('Passo 3 de 4').waitFor()
  await page.getByLabel('E-mail').fill(GUEST)
  await page.getByRole('combobox', { name: 'Papel' }).click()
  await page.getByRole('option', { name: 'Membro', exact: true }).click()
  await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await page.getByText(`Convite enviado para ${GUEST}.`).waitFor()
  await page.getByRole('link', { name: 'Continuar', exact: true }).click()
  await page.getByText('Passo 4 de 4').waitFor()
  await leaveWelcome(page)
}

/** Início: the sidebar, the card with the model account missing, and a Projeto made from it. */
async function home(page: Page) {
  const bar = sidebarOf(page)
  await bar.getByText(COMPANY, { exact: true }).waitFor()
  await bar.getByRole('link', { name: 'Configurações', exact: true }).waitFor()
  await bar.getByRole('button', { name: `Conta de ${OWNER.name}` }).waitFor()
  const card = page.getByRole('region', { name: 'Termine de preparar a empresa' })
  await card.getByText('Conta de modelo: falta').waitFor()
  await card.getByText('Convidar equipe: feito').waitFor()
  await createProject(page, 'Encomendas')
  await page.getByRole('heading', { name: 'Encomendas', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Abrir a barra lateral' }).waitFor()
  await openHome(page)
  await page.getByRole('button', { name: 'Recolher a barra lateral' }).waitFor()
  await bar.getByText('Projetos recentes').waitFor()
  await bar.getByRole('link', { name: 'Encomendas' }).waitFor()
  await page
    .getByRole('main')
    .getByRole('link', { name: /Encomendas/ })
    .waitFor()
}

/** The card's "Continuar" opens Contas de modelo; the index searches, and Aparência holds the theme. */
async function settings(page: Page) {
  await page.getByRole('link', { name: 'Continuar', exact: true }).click()
  await page.getByRole('heading', { name: 'Contas de modelo', exact: true }).waitFor()
  const index = sidebarOf(page)
  await index.getByText('Você', { exact: true }).waitFor()
  await index.getByText(COMPANY, { exact: true }).waitFor()
  await index.getByLabel('Buscar nas configurações').fill('tema')
  await index.getByRole('link', { name: 'Aparência', exact: true }).waitFor()
  assert.equal(await index.getByRole('link', { name: 'Pessoas e convites' }).count(), 0)
  await index.getByRole('link', { name: 'Aparência', exact: true }).click()
  await page.getByRole('radio', { name: 'Escuro' }).click()
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
  await page.reload()
  await page.getByRole('heading', { name: 'Aparência', exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
  await index.getByLabel('Buscar nas configurações').fill('')
  await index.getByRole('link', { name: 'Pessoas e convites', exact: true }).click()
  await page.getByRole('heading', { name: 'Pessoas e convites', exact: true }).waitFor()
  const pending = page.getByRole('heading', { name: 'Convites pendentes' }).locator('..')
  await pending.getByText(GUEST).waitFor()
}

test('o roteiro da casa: o dono novo prepara a empresa em quatro passos, cria um Projeto e passeia por Configurações', async (t) => {
  const mail = await mailProvider(t)
  const { port, database } = await liveHub(t, mail.url)
  await personWithPassword(database, OPERATOR)
  const browser: Browser = await chromium.launch()
  t.after(() => closeBrowser(browser))
  const problems: string[] = []
  const operatorContext = await browser.newContext()
  const ownerContext = await browser.newContext()
  await reachHub(operatorContext, port, '198.51.100.10')
  await reachHub(ownerContext, port, '203.0.113.9')
  const operator = await operatorContext.newPage()
  const owner = await ownerContext.newPage()
  watchConsole(operator, problems)
  watchConsole(owner, problems)

  await ownerArrives(operator, owner, mail.next)
  await welcome(owner)
  await home(owner)
  await settings(owner)
  assert.deepEqual(problems, [])
})
