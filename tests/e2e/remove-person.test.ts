import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Browser, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import type { Mail } from './live-hub.ts'
import {
  chooseNickname,
  linkIn,
  liveHub,
  mailProvider,
  PASSWORD,
  personWithPassword,
  reachHub,
  signIn,
  watchConsole,
} from './live-hub.ts'

// Step 6's journey in Chromium: the last owner cannot leave, an owner takes an administrator out,
// the Central invites a new owner and demotes the old one, who leaves, and the new owner forgets
// the password and is refused a leaked one.
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const ERIN = 'erin@example.test'
const COMPANY = 'Empresa A'
const NEW_PASSWORD = 'senha-nova-1'
const LEAKED = '123456789'
const CHOSEN = 'outra-senha-forte-9'
const NOT_FOUND = 'Não encontramos o que você procurou.'

/** Opens an invitation's mail as a new person, creates the password and accepts; a first owner sets the company up. */
async function join(page: Page, mail: Mail, person: { name: string }, firstOwner = false) {
  await page.goto(linkIn(mail))
  await page.getByLabel('Nome').fill(person.name)
  await page.getByLabel('Senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Confirmar senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Criar senha', exact: true }).click()
  await page.getByRole('button', { name: 'Aceitar convite' }).click()
  if (firstOwner) await chooseNickname(page)
  else await page.getByRole('heading', { name: 'Projetos', exact: true }).waitFor()
  await page.getByRole('link', { name: 'Pessoas' }).first().click()
  await page.getByRole('heading', { name: COMPANY, exact: true }).waitFor()
}

async function invite(page: Page, email: string, role: string) {
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('combobox', { name: 'Papel' }).click()
  await page.getByRole('option', { name: role, exact: true }).click()
  await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await page.getByText(`Convite enviado para ${email}.`).waitFor()
}

async function confirm(page: Page, trigger: string, button: string) {
  await page.getByRole('button', { name: trigger, exact: true }).click()
  const dialog = page.getByRole('alertdialog')
  await dialog.getByRole('button', { name: button, exact: true }).click()
  return dialog
}

type Windows = Record<'ana' | 'davi' | 'carla' | 'stranger', Page>
type Mailbox = { next(): Promise<Mail> }

/** The Central registers the client, Davi owns it, invites Carla as administrator, and she invites Erin. */
async function setUp(w: Windows, mail: Mailbox) {
  await w.ana.goto(`${TEST_ORIGIN}/operations/clients/new`)
  await signIn(w.ana, ANA.email, PASSWORD)
  await w.ana.getByLabel('CNPJ').fill('12.ABC.345/01DE-35')
  await w.ana.getByLabel('Razão social').fill(`${COMPANY} Ltda`)
  await w.ana.getByLabel('Nome de exibição').fill(COMPANY)
  await w.ana.getByLabel('E-mail do administrador').fill(DAVI.email)
  await w.ana.getByRole('button', { name: 'Cadastrar cliente' }).click()
  await w.ana.getByRole('heading', { name: COMPANY, exact: true }).waitFor()
  await join(w.davi, await mail.next(), DAVI, true)
  await w.davi.getByRole('heading', { name: 'Pessoas' }).waitFor()
  await invite(w.davi, CARLA.email, 'Administrador')
  await join(w.carla, await mail.next(), CARLA)
  await invite(w.carla, ERIN, 'Membro')
  await mail.next()
}

/** The only owner cannot leave; then Davi takes Carla out and her invitation goes with her. */
async function takeOut(w: Windows) {
  await w.davi.reload()
  await confirm(w.davi, 'Sair da empresa', 'Sair da empresa')
  await w.davi.getByText(/A empresa precisa de pelo menos um dono\./).waitFor()
  await w.davi.getByRole('button', { name: 'Cancelar' }).click()
  await w.davi.getByRole('button', { name: `Tirar da empresa: ${CARLA.name}` }).click()
  const dialog = w.davi.getByRole('alertdialog')
  await dialog.getByText(/O convite que Carla Dias enviou será cancelado\./).waitFor()
  await dialog.getByRole('button', { name: 'Tirar da empresa', exact: true }).click()
  await w.davi.getByRole('listitem').filter({ hasText: CARLA.email }).waitFor({ state: 'detached' })
  await w.davi.getByText(ERIN).waitFor({ state: 'detached' })
  await w.carla.reload()
  await w.carla.getByRole('heading', { name: NOT_FOUND }).waitFor()
  await w.carla.goto(`${TEST_ORIGIN}/`)
  await w.carla.getByText('Você ainda não participa de nenhuma empresa.').waitFor()
}

/** The Central invites Carla as owner, she accepts, and the Central makes Davi an administrator. */
async function centralChanges(w: Windows, mail: Mailbox) {
  await w.ana.goto(`${TEST_ORIGIN}/operations/clients`)
  await w.ana.getByRole('link', { name: new RegExp(COMPANY) }).click()
  await w.ana.getByRole('heading', { name: 'Pessoas' }).waitFor()
  await w.ana.getByRole('listitem').filter({ hasText: DAVI.email }).waitFor()
  await invite(w.ana, CARLA.email, 'Dono')
  await w.carla.goto(linkIn(await mail.next()))
  await w.carla.getByRole('button', { name: 'Aceitar convite' }).click()
  await w.carla.getByRole('heading', { name: 'Projetos', exact: true }).waitFor()
  await w.ana.reload()
  await w.ana.getByRole('button', { name: `Mudar papel: ${DAVI.name}` }).click()
  await w.ana.getByRole('combobox', { name: 'Papel' }).click()
  await w.ana.getByRole('option', { name: 'Administrador', exact: true }).click()
  const change = w.ana.getByRole('alertdialog')
  await change.getByRole('button', { name: 'Mudar papel', exact: true }).click()
  await w.ana
    .getByRole('listitem')
    .filter({ hasText: DAVI.email })
    .getByText('Administrador')
    .waitFor()
  await w.davi.reload()
  await confirm(w.davi, 'Sair da empresa', 'Sair da empresa')
  await w.davi.getByText('Você ainda não participa de nenhuma empresa.').waitFor()
}

/** Carla forgets the password; the leaked one is refused, the link stays, another one passes. */
async function recover(w: Windows, mail: Mailbox) {
  const page = w.stranger
  await page.goto(`${TEST_ORIGIN}/login`)
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await page.getByRole('heading', { name: 'Esqueci minha senha' }).waitFor()
  await page.getByLabel('E-mail').fill(CARLA.email)
  await page.getByRole('button', { name: 'Enviar o link' }).click()
  await page.getByRole('heading', { name: 'Veja o seu e-mail' }).waitFor()
  await page.goto(linkIn(await mail.next()))
  for (const [password, outcome] of [
    [LEAKED, /Esta senha apareceu em vazamentos de dados\./],
    [CHOSEN, 'Senha trocada. Entre com a nova senha.'],
  ] as const) {
    await page.getByLabel('Senha', { exact: true }).fill(password)
    await page.getByLabel('Repita a senha').fill(password)
    await page.getByRole('button', { name: 'Criar a senha' }).click()
    await page.getByText(outcome).waitFor()
  }
  await signIn(page, CARLA.email, CHOSEN)
  await page.getByRole('heading', { name: 'Projetos', exact: true }).waitFor()
  await w.carla.reload()
  await w.carla.getByRole('button', { name: 'Entrar' }).waitFor()
}

test('o roteiro de tirar uma pessoa: o último dono não sai, tirar, a Central convida e rebaixa, sair, esqueci a senha e a senha vazada', async (t) => {
  const mail = await mailProvider(t)
  const { port, database } = await liveHub(t, mail.url)
  database.passwords.leaked.add(LEAKED)
  await personWithPassword(database, ANA)
  const browser: Browser = await chromium.launch()
  t.after(() => browser.close())
  const problems: string[] = []
  async function window(ip: string) {
    const context = await browser.newContext()
    await reachHub(context, port, ip)
    const page = await context.newPage()
    watchConsole(page, problems)
    return page
  }
  const windows = {
    ana: await window('198.51.100.10'),
    davi: await window('203.0.113.9'),
    carla: await window('203.0.113.10'),
    stranger: await window('203.0.113.11'),
  }
  await setUp(windows, mail)
  await takeOut(windows)
  await centralChanges(windows, mail)
  await recover(windows, mail)
  assert.deepEqual(problems, [])
})
