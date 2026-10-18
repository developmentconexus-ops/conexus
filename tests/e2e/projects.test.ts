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

// Step 7's journey in Chromium, with Neon at its HTTP door: a member creates the company's first
// Project, which prepares its database; a repeated name is refused; the owner deletes a Project
// the member cannot; the Central deletes the company, and its database goes with it.
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }
const COMPANY = 'Empresa A'
const NEW_PASSWORD = 'senha-nova-1'
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
}

type Windows = Record<'ana' | 'davi' | 'carla', Page>
type Mailbox = { next(): Promise<Mail> }
type Neon = { projects(): unknown[] }

/** The Central registers Empresa A, Davi owns it and invites Carla as member. */
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
  await w.davi.getByRole('link', { name: 'Pessoas' }).first().click()
  await w.davi.getByLabel('E-mail').fill(CARLA.email)
  await w.davi.getByRole('combobox', { name: 'Papel' }).click()
  await w.davi.getByRole('option', { name: 'Membro', exact: true }).click()
  await w.davi.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await w.davi.getByText(`Convite enviado para ${CARLA.email}.`).waitFor()
  await join(w.carla, await mail.next(), CARLA)
}

/** The member, who has one company, lands on its Projects; the first Project prepares the database. */
async function firstProjects(carla: Page, neon: Neon) {
  await carla.goto(`${TEST_ORIGIN}/`)
  await carla.getByText('Nenhum Projeto ainda.').waitFor()
  await createProject(carla, 'Pedidos')
  await carla.getByRole('link', { name: /Pedidos/ }).waitFor()
  assert.equal(neon.projects().length, 1)
  await createProject(carla, 'pedidos')
  await carla.getByText('Já existe um Projeto com esse nome nesta empresa.').waitFor()
  await createProject(carla, 'Estoque')
  await carla.getByRole('link', { name: /Estoque/ }).waitFor()
  assert.equal(neon.projects().length, 1, 'a second Project does not touch Neon')
}

/** The member does not see the deletion; the owner deletes Pedidos by typing its name. */
async function deletePedidos(w: Windows, neon: Neon) {
  await w.carla.getByRole('link', { name: /Pedidos/ }).click()
  await w.carla.getByRole('heading', { name: 'Pedidos', exact: true }).waitFor()
  assert.equal(await w.carla.getByRole('button', { name: 'Apagar Projeto' }).count(), 0)
  await w.davi.goto(`${TEST_ORIGIN}/`)
  await w.davi.getByRole('link', { name: /Pedidos/ }).click()
  await w.davi.getByRole('button', { name: 'Apagar Projeto' }).click()
  const dialog = w.davi.getByRole('alertdialog')
  const confirm = dialog.getByRole('button', { name: 'Apagar Projeto' })
  assert.equal(await confirm.isDisabled(), true)
  await dialog.getByLabel('Digite o nome do Projeto').fill('Pedidos')
  await confirm.click()
  await w.davi.getByText('Projeto apagado.').waitFor()
  assert.equal(await w.davi.getByRole('link', { name: /Pedidos/ }).count(), 0)
  await w.davi.getByRole('link', { name: /Estoque/ }).waitFor()
  assert.equal(neon.projects().length, 1, 'deleting a Project leaves the database')
}

/** The Central deletes the company: its Projects and its database go, and the member finds nothing. */
async function deleteCompany(w: Windows, neon: Neon) {
  await w.ana.goto(`${TEST_ORIGIN}/operations/clients`)
  await w.ana.getByRole('link', { name: new RegExp(COMPANY) }).click()
  await w.ana.getByRole('button', { name: 'Apagar cliente' }).click()
  const dialog = w.ana.getByRole('alertdialog')
  await dialog.getByText('Os Projetos e o banco da empresa também serão apagados.').waitFor()
  await dialog.getByLabel('Digite o nome do cliente').fill(COMPANY)
  await dialog.getByRole('button', { name: 'Apagar cliente' }).click()
  await w.ana.getByText('Cliente apagado.').waitFor()
  assert.deepEqual(neon.projects(), [], 'the database left with the company')
  await w.carla.reload()
  await w.carla.getByRole('heading', { name: NOT_FOUND }).waitFor()
}

async function createProject(page: Page, name: string) {
  await page.getByLabel('Nome do Projeto').fill(name)
  await page.getByRole('button', { name: 'Criar Projeto', exact: true }).click()
}

test('o roteiro de Projetos: criar, nome repetido, apagar por quem pode e a empresa apagada leva o banco', async (t) => {
  const mail = await mailProvider(t)
  const { port, database, neon } = await liveHub(t, mail.url)
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
  const w = {
    ana: await window('198.51.100.10'),
    davi: await window('203.0.113.9'),
    carla: await window('203.0.113.10'),
  }
  await setUp(w, mail)
  assert.deepEqual(neon.projects(), [], 'no database before the first Project')
  await firstProjects(w.carla, neon)
  await deletePedidos(w, neon)
  await deleteCompany(w, neon)
  assert.deepEqual(problems, [])
})
