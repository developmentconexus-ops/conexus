import type { Locator, Page } from 'playwright-core'
import { atRest } from './at-rest.ts'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { INTEGRATIONS_STATES } from './sweep-integrations-states.ts'
import { OWNER, projectsPage, startsOn } from './sweep-replies.ts'

// What the motion tests share: the showcase, the owner's Início and the page's motion slowed.
export const harness = createHarness(import.meta.dirname)

export function showcase() {
  return harness.open('/pieces', { viewport: DESKTOP, replies: {} })
}

/** One piece's block on the page, in its light band. */
export function piece(page: Page, file: string): Locator {
  return page.locator(`[data-file="${file}"] [data-band=light]`)
}

/** The curve a token paints, as the browser writes it. */
export function curveOf(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('div')
    probe.style.transitionTimingFunction = `var(${name})`
    document.body.append(probe)
    const curve = getComputedStyle(probe).transitionTimingFunction
    probe.remove()
    return curve
  }, token)
}

/** Plays the page's motion twenty times slower, so a transition is still there to be read. */
export async function slowed(page: Page) {
  const session = await page.context().newCDPSession(page)
  await session.send('Animation.setPlaybackRate', { playbackRate: 0.05 })
}

/** The owner's Início, with Integrações one click away on the rail. */
export async function atHome(more: Replies = {}) {
  const state = INTEGRATIONS_STATES.find((one) => one.name === 'Integrações vazia do dono')
  if (state === undefined) throw new Error('the empty Integrações state is gone')
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: DESKTOP,
    replies: {
      ...OWNER,
      ...projectsPage(COMPANY.id),
      ...startsOn(COMPANY.id),
      ...state.replies,
      ...more,
    },
  })
  await atRest(page)
  const integrations = page
    .getByRole('navigation', { name: 'Navegação' })
    .getByRole('link', { name: 'Integrações' })
  await integrations.waitFor()
  return { page, integrations }
}
