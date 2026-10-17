import type { Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'

export type State = {
  name: string
  path: string
  replies: Replies
  /** Waits for the screen and brings it to the state: a form refused, a field filled. */
  settle(page: Page): Promise<void>
}

export async function waitFor(page: Page, text: string) {
  await page.getByText(text).first().waitFor()
}
