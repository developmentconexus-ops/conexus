import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { test } from 'node:test'
import type { Browser, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import type { LiveDatabase, Mail } from './live-hub.ts'
import {
  closeBrowser,
  linkIn,
  liveHub,
  mailProvider,
  openSettings,
  PASSWORD,
  personWithPassword,
  reachHub,
  signIn,
  waitForHome,
  watchConsole,
} from './live-hub.ts'

// The founder's invitation journey, run in Chromium against a real Hub on a real database.
const NEW_PASSWORD = 'senha-nova-1'
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }

/** Ana, with a password, owns Empresa Teste, as a client's first owner is left by step 4.2. */
async function ownerOfCompany(database: LiveDatabase) {
  const id = await personWithPassword(database, ANA)
  const companyId = randomBytes(16).toString('hex')
  await database.asOwner(
    `insert into auth.company (id, name, slug, created_at, attempt_key, nickname)
      values ($1, 'Empresa Teste', $1, now(), $1, 'empresa-teste')`,
    [companyId],
  )
  await database.asOwner(
    `insert into auth.member (id, company_id, user_id, role, created_at)
      values ($1, $2, $3, 'owner', now())`,
    [randomBytes(16).toString('hex'), companyId, id],
  )
}

/** Ana opens Empresa Teste and invites Davi as Administrador. */
async function anaInvites(page: Page) {
  await page.goto(`${TEST_ORIGIN}/`)
  await signIn(page, ANA.email, PASSWORD)
  await waitForHome(page)
  await openSettings(page, 'Pessoas e convites')
  await page.getByText('Dono', { exact: true }).waitFor()
  await page.getByLabel('E-mail').fill(DAVI.email)
  await page.getByRole('combobox', { name: 'Papel' }).click()
  await page.getByRole('option', { name: 'Administrador' }).click()
  await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await page.getByText(`Convite enviado para ${DAVI.email}.`).waitFor()
  const pending = page.getByRole('heading', { name: 'Convites pendentes' }).locator('..')
  await pending.getByText(DAVI.email).waitFor()
}

/** Davi creates his password in the invitation, then explicitly joins the company. */
async function daviJoins(page: Page, mail: { next(): Promise<Mail> }) {
  const invitation = await mail.next()
  assert.equal(invitation.subject, 'Convite para Empresa Teste')
  assert.equal(invitation.to, DAVI.email)
  const invitationLink = linkIn(invitation)
  await page.goto(invitationLink)
  await page.getByLabel('Nome').fill(DAVI.name)
  await page.getByLabel('Senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Criar senha', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Senha criada. Você já entrou.' }).waitFor()
  await page
    .getByRole('heading', { name: 'Ana Lima convidou você para Empresa Teste como Administrador.' })
    .waitFor()
  await page.getByRole('button', { name: 'Aceitar convite' }).click()
  await waitForHome(page)
  await openSettings(page, 'Pessoas e convites')
  assert.equal(
    await page.getByRole('main').getByRole('row').filter({ hasText: ANA.email }).count(),
    1,
  )
  assert.equal(
    await page.getByRole('main').getByRole('row').filter({ hasText: DAVI.email }).count(),
    1,
  )
  await page.goto(invitationLink)
  await page.getByRole('heading', { name: 'Você já faz parte de Empresa Teste.' }).waitFor()
}

test('o roteiro de uso: convidar, criar a senha, aceitar e ver a empresa com as duas pessoas', async (t) => {
  const mail = await mailProvider(t)
  const browser: Browser = await chromium.launch()
  t.after(() => closeBrowser(browser))
  const { port, database } = await liveHub(t, mail.url)
  await ownerOfCompany(database)
  const problems: string[] = []
  const anaContext = await browser.newContext()
  const daviContext = await browser.newContext()
  await reachHub(anaContext, port, '198.51.100.10')
  await reachHub(daviContext, port, '203.0.113.9')
  const anaPage = await anaContext.newPage()
  const daviPage = await daviContext.newPage()
  watchConsole(anaPage, problems)
  watchConsole(daviPage, problems)
  await anaInvites(anaPage)
  await daviJoins(daviPage, mail)
  assert.deepEqual(problems, [])
})
