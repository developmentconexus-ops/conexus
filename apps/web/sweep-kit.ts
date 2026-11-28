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

export async function waitFor(page: Page, text: string | RegExp) {
  await page.getByText(text).first().waitFor()
}

/** The "Novo projeto" dialog: the name of a Projeto, which the Hub refuses with `sentence`. */
export async function createRefused(page: Page, sentence: string, name = 'Pedidos') {
  await page.getByRole('button', { name: 'Novo projeto' }).click()
  await page.getByLabel('Nome do projeto').fill(name)
  await page.getByRole('button', { name: 'Criar projeto', exact: true }).click()
  await waitFor(page, sentence)
}
