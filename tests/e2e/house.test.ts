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
import type { LiveDatabase } from './live-hub.ts'
import {
  chooseNickname,
  closeBrowser,
  createProject,
  leaveWelcome,
  linkIn,
  liveHub,
  mailProvider,
  openHome,
  openSettings,
  PASSWORD,
  personWithPassword,
  plantCompany,
  reachHub,
  sidebarOf,
  signIn,
  waitForHome,
  watchConsole,
} from './live-hub.ts'
import { KEY, linkKey } from './model-accounts-journey.ts'

// The founder's script of the house in Chromium: the new owner prepares the company in the four
// welcome steps, lands on Início with the card of what is missing, creates a Projeto, looks through
// Configurações and links an account; Ana accepts, reads who can, switches company, signs out and
// in, and on a phone opens the drawer and the dark theme. The Central, the Hub and screens are real.
const OPERATOR = { name: 'Olga Reis', email: 'olga@example.test', role: 'admin' }
const OWNER = { name: 'Davi Costa', email: 'davi@example.test' }
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const GUEST = ANA.email
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

/** Script step 4's end, from Configurações' index: a company account linked, Início has no card. */
async function linkAccount(page: Page) {
  await sidebarOf(page).getByRole('link', { name: 'Contas de modelo', exact: true }).click()
  await page.getByRole('heading', { name: 'Contas de modelo', exact: true }).waitFor()
  await linkKey(page, 'Conta da padaria', KEY)
  await page.getByText('Conta da padaria · chave …x7Qa · ligada').first().waitFor()
  await sidebarOf(page).getByRole('link', { name: 'Voltar', exact: true }).click()
  await waitForHome(page)
  assert.equal(await page.getByRole('region', { name: 'Termine de preparar a empresa' }).count(), 0)
}

/** Ana, a member of Empresa A already, with the password the invitation asks her to enter with. */
async function anaInEmpresaA(database: LiveDatabase) {
  const ana = await personWithPassword(database, ANA)
  const carla = await personWithPassword(database, {
    name: 'Carla Dias',
    email: 'carla@example.test',
  })
  const companyId = await plantCompany(database, carla, ana)
  await database.asOwner(`update auth.company set nickname = 'empresa-a' where id = $1`, [
    companyId,
  ])
}

/** Script step 5: Ana accepts and lands on Padaria Teste's Início, no steps or card; reads who can. */
async function anaAccepts(page: Page, next: () => Promise<Parameters<typeof linkIn>[0]>) {
  await page.goto(linkIn(await next()))
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()
  await signIn(page, ANA.email, PASSWORD)
  await page.getByRole('button', { name: 'Aceitar convite' }).click()
  await waitForHome(page)
  await sidebarOf(page).getByText(COMPANY, { exact: true }).waitFor()
  assert.equal(await page.getByText(/Passo \d de 4/).count(), 0)
  assert.equal(await page.getByRole('region', { name: 'Termine de preparar a empresa' }).count(), 0)
  await openSettings(page, 'Contas de modelo')
  await page
    .getByText('Só o dono ou um administrador muda as contas de modelo da empresa.')
    .waitFor()
  await page.getByText('Conta da padaria').waitFor()
}

/** Script step 6: the switch to Empresa A is remembered across signing out and in; then a phone. */
async function anaSwitches(page: Page) {
  await sidebarOf(page).getByRole('link', { name: 'Voltar', exact: true }).click()
  await waitForHome(page)
  await page.getByRole('button', { name: `Trocar de empresa. Agora: ${COMPANY}` }).click()
  await page.getByRole('menuitem', { name: 'Empresa A' }).click()
  await sidebarOf(page).getByText('Empresa A', { exact: true }).waitFor()
  await page.getByRole('button', { name: `Conta de ${ANA.name}` }).click()
  await page.getByRole('menuitem', { name: 'Sair do Conexus' }).click()
  await signIn(page, ANA.email, PASSWORD)
  await waitForHome(page)
  await sidebarOf(page).getByText('Empresa A', { exact: true }).waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  await drawer.getByRole('button', { name: `Conta de ${ANA.name}` }).click()
  await page.getByRole('menuitemradio', { name: 'Escuro' }).click()
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
}

test('o roteiro da casa: o dono prepara a empresa, cria um Projeto e liga uma conta; Ana aceita, troca de empresa, sai, entra e usa o celular', async (t) => {
  const mail = await mailProvider(t)
  const { port, database } = await liveHub(t, mail.url)
  await personWithPassword(database, OPERATOR)
  await anaInEmpresaA(database)
  const browser: Browser = await chromium.launch()
  t.after(() => closeBrowser(browser))
  const problems: string[] = []
  const operatorContext = await browser.newContext()
  const ownerContext = await browser.newContext()
  await reachHub(operatorContext, port, '198.51.100.10')
  await reachHub(ownerContext, port, '203.0.113.9')
  const anaContext = await browser.newContext()
  await reachHub(anaContext, port, '203.0.113.20')
  const operator = await operatorContext.newPage()
  const owner = await ownerContext.newPage()
  const ana = await anaContext.newPage()
  for (const page of [operator, owner, ana]) watchConsole(page, problems)

  await ownerArrives(operator, owner, mail.next)
  await welcome(owner)
  await home(owner)
  await settings(owner)
  await linkAccount(owner)
  await anaAccepts(ana, mail.next)
  await anaSwitches(ana)
  assert.deepEqual(problems, [])
})
