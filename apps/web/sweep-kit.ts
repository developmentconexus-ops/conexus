import type { Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'

export type State = {
  name: string
  path: string
  replies: Replies
  /** The browser's user agent, where the screen differs by browser. */
  userAgent?: string
  /** Waits for the screen and brings it to the state: a form refused, a field filled. */
  settle(page: Page): Promise<void>
}

export async function waitFor(page: Page, text: string) {
  await page.getByText(text).first().waitFor()
}

/** Início's request, sent, and the name of its Projeto, which the Hub refuses with `sentence`. */
export async function createRefused(page: Page, sentence: string, name = 'Pedidos') {
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).fill('Um app de encomendas')
  await page.getByRole('button', { name: 'Enviar' }).click()
  await page.getByLabel('Nome do projeto').fill(name)
  await page.getByRole('button', { name: 'Criar e começar', exact: true }).click()
  await waitFor(page, sentence)
}
