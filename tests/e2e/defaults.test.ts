import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { hubWindow } from './hub-window.ts'
import {
  createProject,
  liveHub,
  openProject,
  personWithPassword,
  plantCompany,
  waitForHome,
} from './live-hub.ts'
import { enter, linkKey, pickModel } from './model-accounts-journey.ts'

// Step 12.3's script in Chromium, on a real Hub: Empresa A with a Claude key and an OpenAI key of
// the company. The owner sets GPT 5 · Médio for the company; Ana, a member, starts there, chooses
// Claude Sonnet and Alto for herself, loses her Claude account when the owner pauses it, and goes
// back to the company's. No provider is called: a conversation's start is read, never answered.
const OWNER = { name: 'Davi Costa', email: 'davi@example.test', role: 'admin' }
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const CLAUDE_KEY = 'sk-ant-api03-planted-key-for-defaults-x7Qa'
const OPENAI_KEY = 'sk-proj-planted-key-for-defaults-9aZ1'
function START(text: string) {
  return `Uma conversa nova começa em: ${text}`
}

/** A new conversation's composer: once it opens, its button names the model and the level `expected`. */
async function newConversationChoice(page: Page, companyId: string, expected: string | RegExp) {
  await page.goto(`${TEST_ORIGIN}/companies/${companyId}`)
  await openProject(page, 'Encomendas')
  const created = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/conversations'),
  )
  await page.getByRole('button', { name: 'Nova conversa' }).click()
  const response = await created
  assert.equal(response.status(), 201)
  const { conversation } = await response.json()
  await page.waitForURL(new RegExp(`/conversations/${conversation.id}`))
  const choice = page.getByRole('combobox', { name: 'Modelo e raciocínio' })
  await choice.filter({ hasText: expected }).waitFor()
}

/** Step 1: the owner chooses GPT 5 and Médio in Padrões da empresa and saves it. */
async function companyDefault(owner: Page, companyId: string) {
  await owner.goto(`${TEST_ORIGIN}/companies/${companyId}/settings/defaults`)
  await owner.getByText('A empresa ainda não tem padrão', { exact: false }).waitFor()
  await pickModel(owner, owner, 'Modelo e raciocínio', 'OpenAI', 'gpt-5')
  await owner.getByRole('combobox', { name: 'Modelo e raciocínio' }).click()
  const slider = owner.getByRole('slider', { name: 'Raciocínio' })
  await slider.waitFor()
  await slider.press('Home')
  await slider.press('ArrowRight')
  assert.equal(await slider.getAttribute('aria-valuetext'), 'Médio')
  await owner.keyboard.press('Escape')
  await owner.getByRole('button', { name: 'Salvar padrão' }).click()
  await owner.getByText(START('GPT 5 · Médio — padrão da empresa')).waitFor()
}

/** Steps 3 to 5, Ana's side: her own default, the order line, the lost account, and the way back. */
async function ownDefault(ana: Page, owner: Page, companyId: string, base: string) {
  await ana.goto(`${base}/my-defaults`)
  await ana.getByText(START('GPT 5 · Médio — padrão da empresa')).waitFor()
  await ana.getByText('Você segue o padrão da empresa.').waitFor()
  assert.equal(await ana.getByRole('button', { name: 'Usar o da empresa' }).count(), 0)
  await pickModel(ana, ana, 'Modelo e raciocínio', 'Anthropic', 'sonnet')
  await ana.getByRole('combobox', { name: 'Modelo e raciocínio' }).click()
  const slider = ana.getByRole('slider', { name: 'Raciocínio' })
  await slider.waitFor()
  await slider.press('End')
  await ana.keyboard.press('Escape')
  await ana.getByRole('button', { name: 'Salvar padrão' }).click()
  await ana.getByText(/^Uma conversa nova começa em: .*sonnet.* — seu padrão$/i).waitFor()
  await ana.getByText('Conta usada primeiro (Anthropic): Claude da empresa').waitFor()
  await newConversationChoice(ana, companyId, /sonnet.*·\s*Muito alto/i)

  const accounts = `${TEST_ORIGIN}/companies/${companyId}/settings/model-accounts`
  await owner.goto(accounts)
  await owner.getByRole('button', { name: 'Pausar Claude da empresa' }).click()
  await owner.getByRole('button', { name: 'Retomar Claude da empresa' }).waitFor()
  await ana.goto(`${base}/my-defaults`)
  await ana
    .getByText(
      'Você não tem conta disponível para Anthropic agora: as conversas novas começam no padrão da empresa.',
    )
    .waitFor()
  await newConversationChoice(ana, companyId, /GPT 5\s*·\s*Médio/)
  await owner.getByRole('button', { name: 'Retomar Claude da empresa' }).click()
  await owner.getByRole('button', { name: 'Pausar Claude da empresa' }).waitFor()

  await ana.goto(`${base}/my-defaults`)
  await ana.getByRole('button', { name: 'Usar o da empresa' }).click()
  await ana.getByText(START('GPT 5 · Médio — padrão da empresa')).waitFor()
}

test('o roteiro dos padrões: o dono escolhe os da empresa, Ana os dela, e a conta pausada leva de volta ao da empresa', async (t) => {
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const owner = await personWithPassword(database, OWNER)
  const ana = await personWithPassword(database, ANA)
  const companyId = await plantCompany(database, owner, ana)
  await database.asOwner(`update auth.company set nickname = 'acme' where id = $1`, [companyId])
  const problems: string[] = []
  const closers: (() => Promise<void>)[] = []
  async function window(ip: string, who: string) {
    const page = await hubWindow(closers, port, ip, problems)
    await enter(page, who, `/companies/${companyId}`)
    await waitForHome(page)
    return page
  }
  try {
    await script(window, companyId)
  } finally {
    for (const close of closers) await close()
  }
  assert.deepEqual(problems, [])
})

async function script(window: (ip: string, who: string) => Promise<Page>, companyId: string) {
  const ownerPage = await window('203.0.113.9', OWNER.email)
  const anaPage = await window('203.0.113.10', ANA.email)
  const base = `${TEST_ORIGIN}/companies/${companyId}/settings`
  await ownerPage.goto(`${base}/model-accounts`)
  await linkKey(ownerPage, 'Claude da empresa', CLAUDE_KEY)
  await ownerPage.getByText('Claude da empresa · chave …x7Qa · ligada').first().waitFor()
  await linkKey(ownerPage, 'OpenAI da empresa', OPENAI_KEY, 'OpenAI')
  await ownerPage.getByText('OpenAI da empresa · chave …9aZ1 · ligada').first().waitFor()
  await ownerPage.goto(`${TEST_ORIGIN}/companies/${companyId}`)
  await createProject(ownerPage, 'Encomendas')
  await ownerPage.getByRole('heading', { name: 'Encomendas', exact: true }).waitFor()
  await companyDefault(ownerPage, companyId)

  // Step 2: Ana, a member, only reads the company's default and starts on it.
  await anaPage.goto(`${base}/defaults`)
  await anaPage.getByText('Só o dono ou um administrador muda os padrões da empresa.').waitFor()
  assert.equal(await anaPage.getByRole('button', { name: 'Salvar padrão' }).count(), 0)
  await newConversationChoice(anaPage, companyId, /GPT 5\s*·\s*Médio/)
  await ownDefault(anaPage, ownerPage, companyId, base)

  // Step 5, the narrow screen and the dark theme: nothing scrolls sideways.
  await anaPage.setViewportSize({ width: 390, height: 844 })
  await anaPage.emulateMedia({ colorScheme: 'dark' })
  await anaPage.goto(`${base}/my-defaults`)
  await anaPage.getByText(START('GPT 5 · Médio — padrão da empresa')).waitFor()
  const width = await anaPage.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
  assert.ok((width[0] ?? 0) <= (width[1] ?? 0))
}
