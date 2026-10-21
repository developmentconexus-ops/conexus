import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { Locator, Page } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { PASSWORD, signIn } from './live-hub.ts'

export const KEY = 'sk-ant-api03-planted-key-for-tests-x7Qa'
export const OWN_KEY = 'sk-ant-api03-planted-own-key-for-tests-y9Zb'
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token'

/** Anthropic's token endpoint, doubled in the Hub's own `fetch`; every other address goes through. */
export function anthropicTokens(t: TestContext) {
  const original = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    if (String(input) !== TOKEN_URL) return original(input, init)
    const tokens = {
      access_token: 'sk-ant-oat01-planted-access',
      refresh_token: 'sk-ant-ort01-planted-refresh',
      expires_in: 28_800,
    }
    return Response.json(tokens)
  }
  t.after(() => {
    globalThis.fetch = original
  })
}

/** Signs in from the home address, and once the session is open goes to `path`. */
export async function enter(page: Page, email: string, path: string) {
  await page.goto(`${TEST_ORIGIN}/`)
  await signIn(page, email, PASSWORD)
  await page.getByRole('button', { name: /^Conta de / }).waitFor()
  await page.goto(`${TEST_ORIGIN}${path}`)
}

/** The rows of one provider's queue, in the order shown. */
export function queueRows(page: Page, provider: string): Locator {
  const heading = page.getByRole('heading', { name: provider, level: 3 })
  return page.locator('div', { has: heading }).last().getByRole('listitem')
}

export async function rowsText(rows: Locator): Promise<string[]> {
  const texts = await rows.allInnerTexts()
  return texts.map((text) => text.replaceAll(/\s+/g, ' ').trim())
}

/** Picks `option` in the UI's select labelled `label`; its list opens at the page's end. */
async function pick(page: Page, scope: Locator | Page, label: string, option: string | RegExp) {
  await scope.getByLabel(label, { exact: true }).click()
  await page.getByRole('option', { name: option }).first().click()
}

/** Picks the first model `search` finds under `provider` in the picker named `name`; its popup holds the search. */
export async function pickModel(
  page: Page,
  scope: Locator | Page,
  name: string,
  provider: string,
  search: string,
) {
  await scope.getByRole('combobox', { name, exact: true }).click()
  await page.getByLabel('Buscar modelo').fill(search)
  await page.getByRole('group', { name: provider }).getByRole('option').first().click()
}

/** Opens "Ligar conta" and links an API key of `provider` (Anthropic unless said). */
export async function linkKey(page: Page, label: string, key: string, provider = 'Anthropic') {
  await page.getByRole('button', { name: 'Ligar conta', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Ligar conta' })
  await panel.getByLabel('Buscar fornecedor').fill(provider)
  await pick(page, panel, 'Fornecedor', provider)
  await panel.getByLabel('Nome da conta').fill(label)
  await panel.getByLabel('Chave de API', { exact: true }).fill(key)
  await panel.getByRole('button', { name: 'Ligar conta', exact: true }).click()
}

/** The state the screen shows in the address it gave for the sign-in. */
async function stateOfAddress(panel: Locator): Promise<string> {
  const address = await panel.locator('p.font-mono').innerText()
  const state = new URL(address.trim()).searchParams.get('state')
  assert.ok(state, 'the address carries no state')
  return state
}

/** Starts a subscription sign-in of `kind` and pastes what the vendor would show. */
export async function linkSignIn(
  page: Page,
  kind: 'Assinatura Claude' | 'Google',
  label: string,
  pasted: (state: string) => string,
) {
  await page.getByRole('button', { name: 'Ligar conta', exact: true }).click()
  const panel = page.getByRole('region', { name: 'Ligar conta' })
  await panel.getByRole('button', { name: 'Entrar com assinatura' }).click()
  await pick(page, panel, 'Tipo de assinatura', kind)
  await panel.getByLabel('Nome da conta').fill(label)
  await panel.getByRole('button', { name: 'Gerar endereço de entrada' }).click()
  const state = await stateOfAddress(panel)
  const field = kind === 'Google' ? 'Endereço de retorno do Google' : 'Código da Anthropic'
  await panel.getByLabel(field).fill(pasted(state))
  await panel.getByRole('button', { name: 'Entrar', exact: true }).click()
}
