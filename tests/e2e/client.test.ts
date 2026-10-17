import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Browser, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import type { Mail } from './live-hub.ts'
import {
  linkIn,
  liveHub,
  mailProvider,
  PASSWORD,
  personWithPassword,
  reachHub,
  signIn,
  watchConsole,
} from './live-hub.ts'

// Step 4.2's journey in Chromium: the operator registers a client in the Operations Central, and
// its administrator joins as the first owner; then a second client with the same administrator.
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const NEW_PASSWORD = 'senha-nova-1'

/** The operator registers a client from the account menu and sees it awaiting its administrator. */
async function register(page: Page, client: { cnpj: string; legalName: string; name: string }) {
  await page.getByRole('button', { name: `Conta de ${ANA.name}` }).click()
  await page.getByRole('menuitem', { name: 'Central de Operação' }).click()
  await page.getByRole('link', { name: 'Cadastrar cliente' }).click()
  await page.getByLabel('CNPJ').fill(client.cnpj)
  await page.getByLabel('Razão social').fill(client.legalName)
  await page.getByLabel('Nome de exibição').fill(client.name)
  await page.getByLabel('E-mail do administrador').fill(DAVI.email)
  await page.getByRole('button', { name: 'Cadastrar cliente' }).click()
  await page.getByRole('heading', { name: client.name, exact: true }).waitFor()
  await page.getByText('Aguardando o administrador').first().waitFor()
}

/** The first owner's mail: from Conexus, as the first owner of `company`. */
async function ownerMail(next: () => Promise<Mail>, company: string): Promise<string> {
  const mail = await next()
  const words = `Conexus convidou você para ser o primeiro dono de ${company}`
  assert.deepEqual([mail.to, mail.subject], [DAVI.email, words])
  assert.ok(mail.text.includes(words), mail.text)
  return linkIn(mail)
}

async function accept(page: Page, company: string) {
  await page
    .getByRole('heading', { name: `Conexus convidou você para ser o primeiro dono de ${company}.` })
    .waitFor()
  await page.getByRole('button', { name: 'Aceitar convite' }).click()
  await page.getByRole('heading', { name: 'Projetos', exact: true }).waitFor()
  await page.getByRole('link', { name: 'Pessoas' }).first().click()
  await page.getByRole('heading', { name: company, exact: true }).waitFor()
}

test('o roteiro da Central: cadastrar, o administrador cria a senha e entra como primeiro dono; um segundo cliente com o mesmo administrador', async (t) => {
  const mail = await mailProvider(t)
  const { port, database } = await liveHub(t, mail.url)
  await personWithPassword(database, ANA)
  const browser: Browser = await chromium.launch()
  t.after(() => browser.close())
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
  await ana.getByRole('heading', { name: 'Suas empresas' }).waitFor()
  await register(ana, {
    cnpj: '12.ABC.345/01DE-35',
    legalName: 'Empresa Teste Ltda',
    name: 'Empresa Teste',
  })
  await davi.goto(await ownerMail(mail.next, 'Empresa Teste'))
  await davi.getByLabel('Nome').fill(DAVI.name)
  await davi.getByLabel('Senha', { exact: true }).fill(NEW_PASSWORD)
  await davi.getByLabel('Confirmar senha', { exact: true }).fill(NEW_PASSWORD)
  await davi.getByRole('button', { name: 'Criar senha', exact: true }).click()
  await accept(davi, 'Empresa Teste')

  await register(ana, {
    cnpj: '11.222.333/0001-81',
    legalName: 'Outra Empresa Ltda',
    name: 'Outra Empresa',
  })
  await davi.goto(await ownerMail(mail.next, 'Outra Empresa'))
  await accept(davi, 'Outra Empresa')
  await davi.goto(`${TEST_ORIGIN}/`)
  for (const company of ['Empresa Teste', 'Outra Empresa']) {
    await davi.getByRole('link', { name: `${company} Dono` }).waitFor()
  }

  await ana.goto(`${TEST_ORIGIN}/operations/clients`)
  await ana.getByText('Ativo', { exact: true }).nth(1).waitFor()
  assert.equal(await ana.getByText('Ativo', { exact: true }).count(), 2)
  await ana.goto(`${TEST_ORIGIN}/`)
  await ana.getByText('Você ainda não participa de nenhuma empresa.').waitFor()
  assert.deepEqual(problems, [])
})
