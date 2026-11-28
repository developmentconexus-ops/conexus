import type { Page } from 'playwright-core'
import { COMPANY } from './src/platform/fixtures.ts'
import type { State } from './sweep-kit.ts'
import { waitFor } from './sweep-kit.ts'
import { OWNER, PROJECT_ID, projectsPage } from './sweep-replies.ts'

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const WITH_APP = { ...OWNER, ...projectsPage(COMPANY.id, { appVersion: 3, publishedVersion: 2 }) }
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1'

async function framed(page: Page) {
  await page.getByTitle('Prévia').waitFor()
  await page.frameLocator('iframe[title="Prévia"]').getByText('Maria, bolo de cenoura').waitFor()
}

export const PREVIEW_STATES: State[] = [
  {
    name: 'Projeto, Prévia com o app',
    path: PROJECT,
    replies: WITH_APP,
    settle: framed,
  },
  {
    name: 'Projeto, Prévia no Celular',
    path: PROJECT,
    replies: WITH_APP,
    settle: async (page) => {
      await framed(page)
      // Under `md` the bar has no Computador or Celular.
      if ((page.viewportSize()?.width ?? 0) >= 768) {
        await page.getByRole('button', { name: 'Celular', exact: true }).click()
      }
    },
  },
  {
    name: 'Projeto, Prévia no WebKit da Apple',
    path: PROJECT,
    replies: WITH_APP,
    userAgent: IPHONE,
    settle: async (page) => {
      await framed(page)
      await waitFor(page, 'O app pode não abrir aqui dentro neste navegador.')
    },
  },
]
