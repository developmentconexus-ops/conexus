import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Browser, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  closeBrowser,
  liveHub,
  openSettings,
  PASSWORD,
  personWithPassword,
  plantCompany,
  reachHub,
  signIn,
  waitForHome,
  watchConsole,
} from './live-hub.ts'
import {
  anthropicTokens,
  enter,
  KEY,
  linkKey,
  linkSignIn,
  OWN_KEY,
  pick,
  queueRows,
  rowsText,
} from './model-accounts-journey.ts'

// Step 11's journey in Chromium: the Conexus opens kinds for Empresa A, its owner links an API key,
// a Claude subscription and a Google account, orders and pauses them, gives one to a member, who
// reads her order and links a key of her own, and the owner removes the first key.
const ANA = { name: 'Ana Lima', email: 'ana@example.test', role: 'admin' }
const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const CARLA = { name: 'Carla Dias', email: 'carla@example.test' }

/** Step 1: Empresa A gets two kinds; Empresa B, which has none, offers only the API key. */
async function openKinds(ana: Page, companyA: string, companyB: string) {
  await ana.goto(`${TEST_ORIGIN}/operations/clients`)
  await signIn(ana, ANA.email, PASSWORD)
  await ana.getByRole('link', { name: /Empresa A/ }).click()
  const kinds = ana.getByRole('region', { name: 'Tipos de conta' })
  for (const kind of ['Assinatura Claude', 'Google']) {
    await kinds.getByLabel(kind).click()
    await kinds.getByRole('checkbox', { name: kind, checked: true }).waitFor()
  }
  await ana.reload()
  assert.equal(await kinds.getByLabel('Assinatura Claude').isChecked(), true)
  assert.equal(await kinds.getByLabel('Google').isChecked(), true)
  await ana.goto(`${TEST_ORIGIN}/operations/clients/${companyB}`)
  await kinds.getByText('Chave de API · sempre ligada').waitFor()
  assert.equal(await kinds.getByLabel('Assinatura Claude').count(), 1)
  assert.equal(await kinds.getByLabel('Assinatura Claude').isChecked(), false)
  assert.equal(await kinds.getByLabel('Google').isChecked(), false)
  assert.ok(companyA)
}

/** Steps 2 and 3: a key, the Claude subscription's code and Google's sign-in, all in Empresa A. */
async function linkAccounts(owner: Page, companyA: string) {
  await enter(owner, DAVI.email, `/companies/${companyA}/settings/model-accounts`)
  await owner.getByText('Nenhuma conta ligada').waitFor()
  await linkKey(owner, 'Time 1', KEY)
  await owner.getByText('Time 1 · chave …x7Qa · ligada').first().waitFor()
  await linkSignIn(owner, 'Assinatura Claude', 'Time 2', (state) => `codigo-1#${state}`)
  await owner.getByText('Time 2 · Assinatura Claude · ligada').first().waitFor()
  await linkSignIn(
    owner,
    'Google',
    'Google 1',
    (state) => `http://localhost:51121/oauth-callback?state=${state}&code=c-1`,
  )
  await owner.getByText('Google 1 · Google · ligada').first().waitFor()
}

/** Step 4: Time 2 goes up, Time 1 pauses, and a Claude Sonnet model becomes the default. */
async function arrange(owner: Page) {
  await owner.getByRole('button', { name: 'Subir Time 2' }).click()
  await owner.getByRole('button', { name: 'Subir Time 1' }).waitFor({ state: 'detached' })
  await owner.getByRole('button', { name: 'Pausar Time 1' }).click()
  await owner.getByRole('button', { name: 'Retomar Time 1' }).waitFor()
  const [first, second] = await rowsText(queueRows(owner, 'Anthropic'))
  assert.match(first ?? '', /^Time 2.*Assinatura Claude · ligada · para todos/)
  assert.match(second ?? '', /^Time 1.*chave …x7Qa · pausada/)
  await pick(owner, owner, 'Fornecedor do modelo padrão', 'Anthropic')
  await owner.getByLabel('Buscar modelo').fill('sonnet')
  await pick(owner, owner, 'Modelo padrão', /sonnet/i)
  const chosen = await owner.getByText(/^Escolhido: anthropic\/.*sonnet/i).innerText()
  await owner.getByRole('button', { name: 'Salvar modelo padrão' }).click()
  await owner
    .getByRole('button', { name: 'Salvar modelo padrão' })
    .and(owner.locator(':disabled'))
    .waitFor()
  await owner.reload()
  assert.equal(await owner.getByText(/^Escolhido: /).innerText(), chosen)
}

/** Step 5: Time 2 goes to Carla, who reads her order and links a key of her own. */
async function giveAndRead(owner: Page, member: Page, companyA: string) {
  await owner.getByRole('button', { name: 'Dar Time 2 a pessoas' }).click()
  const dialog = owner.getByRole('alertdialog')
  await dialog.getByLabel(CARLA.name).check()
  await dialog.getByRole('button', { name: 'Salvar', exact: true }).click()
  await owner.getByText(`reservada para ${CARLA.name}`).waitFor()
  await enter(member, CARLA.email, `/companies/${companyA}`)
  await waitForHome(member)
  await openSettings(member, 'Minhas contas de modelo')
  await member.getByText('Sua ordem para Anthropic: Time 2, Time 1').waitFor()
  await linkKey(member, 'Carla 1', OWN_KEY)
  await member.getByText('Carla 1 · chave …y9Zb · ligada').first().waitFor()
  await member.getByText('Sua ordem para Anthropic: Carla 1, Time 2, Time 1').waitFor()
}

/** Step 6: removing Time 1 tells the owner to end the key at the provider's console too. */
async function removeFirst(owner: Page) {
  await owner.getByRole('button', { name: 'Remover Time 1' }).click()
  const dialog = owner.getByRole('alertdialog')
  await dialog.getByText(/Apague também a chave no Console da Anthropic\./).waitFor()
  await dialog.getByRole('button', { name: 'Remover conta', exact: true }).click()
  await owner.getByRole('button', { name: 'Remover Time 1' }).waitFor({ state: 'detached' })
}

test('o roteiro da conta de modelo: tipos, chave, assinatura Claude, Google, fila, padrão, dar a uma pessoa e remover', async (t) => {
  anthropicTokens(t)
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  await personWithPassword(database, ANA)
  const davi = await personWithPassword(database, DAVI)
  const carla = await personWithPassword(database, CARLA)
  const companyA = await plantCompany(database, davi, carla)
  const companyB = await plantCompany(database, davi, carla)
  await database.asOwner(`update auth.company set nickname = 'acme' where id = $1`, [companyA])
  await database.asOwner(
    `update auth.company set name = 'Empresa B', slug = 'b', nickname = 'beta' where id = $1`,
    [companyB],
  )
  for (const [id, cnpj] of [
    [companyA, '11222333000181'],
    [companyB, '12345678000195'],
  ]) {
    await database.asOwner(
      `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
        values ($1, $2, 'Empresa Teste Ltda', $1, now())`,
      [id, cnpj],
    )
  }
  const browser: Browser = await chromium.launch()
  t.after(() => closeBrowser(browser))
  const problems: string[] = []
  async function window(ip: string) {
    const context = await browser.newContext()
    await reachHub(context, port, ip)
    const page = await context.newPage()
    watchConsole(page, problems)
    return page
  }
  const ana = await window('198.51.100.10')
  const owner = await window('203.0.113.9')
  const member = await window('203.0.113.10')
  await openKinds(ana, companyA, companyB)
  await linkAccounts(owner, companyA)
  await arrange(owner)
  await giveAndRead(owner, member, companyA)
  await removeFirst(owner)
  for (const page of [ana, owner, member]) {
    const text = await page.locator('body').innerText()
    assert.equal(text.includes(KEY) || text.includes(OWN_KEY), false)
  }
  assert.deepEqual(problems, [])
})
