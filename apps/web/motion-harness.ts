import type { Locator, Page } from 'playwright-core'
import { atRest } from './at-rest.ts'
import type { Replies, Viewport } from './layout-harness.ts'
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

type Run = { ms: number; easing: string; from: string }

/** The transitions running on the element now, each with its time, its curve and where it left. */
export function runsOf(locator: Locator): Promise<Record<string, Run>> {
  return locator.evaluate((element) => {
    const runs: Record<string, Run> = {}
    for (const one of element.getAnimations()) {
      if (!(one instanceof CSSTransition) || !(one.effect instanceof KeyframeEffect)) continue
      const [first] = one.effect.getKeyframes()
      const timing = one.effect.getTiming()
      runs[one.transitionProperty] = {
        ms: Number(timing.duration),
        easing: timing.easing ?? '',
        from: String(first?.[one.transitionProperty] ?? ''),
      }
    }
    return runs
  })
}

export function timesOf(runs: Record<string, Run>) {
  return Object.fromEntries(
    Object.entries(runs).map(([property, run]) => [property, [run.ms, run.easing]]),
  )
}

/** The owner's Início, with Integrações one click away on the rail, or in the phone's drawer. */
export async function atHome(more: Replies = {}, viewport: Viewport = DESKTOP) {
  const state = INTEGRATIONS_STATES.find((one) => one.name === 'Integrações vazia do dono')
  if (state === undefined) throw new Error('the empty Integrações state is gone')
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport,
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
  if (viewport === DESKTOP) await integrations.waitFor()
  return { page, integrations }
}
