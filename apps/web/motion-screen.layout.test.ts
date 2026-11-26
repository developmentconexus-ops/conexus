import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConversations } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { atRest } from './at-rest.ts'
import { BUILD, start, starting } from './first-start.ts'
import type { Replies, Viewport } from './layout-harness.ts'
import { DESKTOP, ok, PHONE } from './layout-harness.ts'
import { atHome, harness, runsOf, slowed } from './motion-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'

// The change of screen, in a real browser: when the sheet fades and when it changes at once (design V26).
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** What a screen change moves: each of its pseudo-elements with the longest time it takes. */
function screenChange(page: Page): Promise<Record<string, number>> {
  return page.evaluate(() => {
    const times: Record<string, number> = {}
    for (const one of document.getAnimations()) {
      if (!(one.effect instanceof KeyframeEffect)) continue
      const pseudo = one.effect.pseudoElement
      if (!pseudo?.startsWith('::view-transition')) continue
      times[pseudo] = Math.max(times[pseudo] ?? 0, Number(one.effect.getTiming().duration))
    }
    return times
  })
}

test('a troca de tela esmaece a folha', async () => {
  const { page, integrations } = await atHome()
  await slowed(page)
  await integrations.click()
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .some(
        (one) =>
          one.effect instanceof KeyframeEffect &&
          one.effect.pseudoElement === '::view-transition-new(sheet)',
      ),
  )
  assert.deepEqual(await screenChange(page), {
    '::view-transition-old(sheet)': 160,
    '::view-transition-new(sheet)': 160,
  })
  assert.equal(await integrations.evaluate((one) => one === document.activeElement), true)
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('uma segunda navegação por código, antes de a primeira aparecer, vale de uma vez e sem erro', async () => {
  const { page, integrations } = await atHome()
  // The first transition's update is held while the page goes to a third screen. The click is the
  // program's: during a view transition the pointer does not reach the page.
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document)
    document.startViewTransition = (options) => {
      document.startViewTransition = start
      if (typeof options !== 'object') throw new Error('the router passes its update and types')
      const { update, types } = options
      return start({
        types: types ?? [],
        update: async () => {
          const third = document.querySelector<HTMLElement>('nav a[aria-label="Projetos"]')
          if (third === null) throw new Error('no Projetos on the rail')
          third.click()
          await new Promise((done) => setTimeout(done, 200))
          await update?.()
        },
      })
    }
  })
  await integrations.click()
  await page.waitForURL((url) => url.pathname.endsWith('/projects'))
  await page.getByRole('heading', { name: 'Projetos', level: 1 }).waitFor()
  await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'))
  await atRest(page)
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('a troca depois de uma ação esmaece a folha', async () => {
  const page = await harness.open(BUILD, {
    viewport: DESKTOP,
    replies: starting(Promise.resolve()),
  })
  await slowed(page)
  const faded = page.waitForFunction(
    () =>
      location.pathname.includes('/conversations/') &&
      document
        .getAnimations()
        .some(
          (one) =>
            one.effect instanceof KeyframeEffect &&
            one.effect.pseudoElement === '::view-transition-new(sheet)' &&
            one.effect.getTiming().duration === 160,
        ),
  )
  await start(page)
  await faded
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('com a gaveta aberta a troca é de uma vez', async () => {
  const home = await counted(PHONE)
  await home.page.getByRole('button', { name: 'Abrir navegação' }).click()
  const link = home.page
    .locator('[data-slot=sheet-content]')
    .getByRole('link', { name: 'Integrações' })
  await link.waitFor()
  await atRest(home.page)
  const loaded = await home.transitions()
  await slowed(home.page)
  await link.click()
  const drawer = home.page.locator('[data-slot=sheet-content][data-ending-style]')
  await drawer.waitFor()
  await home.page.getByText('Nenhuma integração ligada ainda.').waitFor()
  const leaving = await runsOf(drawer)
  assert.deepEqual([leaving.opacity?.ms, leaving.translate?.ms], [150, 150])
  assert.equal(await home.transitions(), loaded, 'the sheet fades under the drawer')
  assert.deepEqual(home.page.problems, [])
  await home.page.close()
})

test('com a janela aberta a troca é de uma vez', async () => {
  const page = await harness.open(`/companies/${COMPANY.id}`, {
    viewport: DESKTOP,
    replies: starting(Promise.resolve()),
  })
  const transitions = await counting(page)
  await page
    .getByRole('region', { name: 'Projetos' })
    .getByRole('button', { name: 'Novo projeto' })
    .click()
  await page.getByLabel('Nome do projeto').fill('Pedidos')
  const loaded = await transitions()
  await page.getByRole('button', { name: 'Criar projeto' }).click()
  await page.waitForURL(/\/projects\/[^/]+/)
  await page.getByRole('dialog', { name: 'Novo projeto' }).waitFor({ state: 'detached' })
  await atRest(page)
  assert.equal(await transitions(), loaded, 'the sheet fades under the window')
  assert.deepEqual(page.problems, [])
  await page.close()
})

/** One conversation, so that the sidebar draws its list with the search and the tabs. */
const ONE_CONVERSATION: Replies = {
  [`GET /api/companies/${COMPANY.id}/assistant/conversations`]: ok(listAssistantConversations, {
    conversations: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        title: 'Vendas da semana',
        createdAt: '2026-10-19T12:00:00.000Z',
        updatedAt: '2026-10-19T12:00:00.000Z',
        project: null,
        automation: null,
      },
    ],
    next: { kind: 'END' },
  }),
}

/** Loads the page again, counting the view transitions it starts from then on. */
async function counting(page: Page) {
  await page.addInitScript(() => {
    const start = document.startViewTransition.bind(document)
    document.startViewTransition = (update) => {
      const root = document.documentElement
      const count = Number(root.getAttribute('data-transitions') ?? 0)
      root.setAttribute('data-transitions', String(count + 1))
      return start(update)
    }
  })
  await page.reload()
  await atRest(page)
  return () =>
    page.evaluate(() => Number(document.documentElement.getAttribute('data-transitions') ?? 0))
}

/** Início again from a fresh load, counting the view transitions the page starts. */
async function counted(viewport: Viewport = DESKTOP) {
  const home = await atHome(ONE_CONVERSATION, viewport)
  const transitions = await counting(home.page)
  const nav = home.page.getByRole('navigation', { name: 'Navegação' })
  /** The control: after what must not fade, a change of area starts the first transition. */
  async function onlyTheAreaChangeFades() {
    const before = await transitions()
    await home.integrations.click()
    await home.page.getByText('Nenhuma integração ligada ainda.').waitFor()
    assert.equal(await transitions(), before + 1)
    assert.deepEqual(home.page.problems, [])
    await home.page.close()
  }
  return {
    page: home.page,
    integrations: home.integrations,
    nav,
    transitions,
    onlyTheAreaChangeFades,
  }
}

test('a carga da página não esmaece a folha', async () => {
  const home = await counted()
  assert.equal(await home.transitions(), 0, "the page's load fades the sheet")
  await home.onlyTheAreaChangeFades()
})

test('a letra na busca da barra não esmaece a folha', async () => {
  const home = await counted()
  const loaded = await home.transitions()
  await home.nav.getByRole('button', { name: /Buscar/ }).click()
  await home.nav.getByRole('searchbox').pressSequentially('ven')
  await home.page.waitForURL(/q=ven/)
  await atRest(home.page)
  assert.equal(await home.transitions(), loaded, 'a letter of the search fades the sheet')
  await home.onlyTheAreaChangeFades()
})

test('a aba da barra não esmaece a folha', async () => {
  const home = await counted()
  const loaded = await home.transitions()
  const tab = home.nav.getByRole('tab', { name: 'Projetos' })
  await tab.click()
  await home.page.waitForURL(/tab=projects/)
  await home.nav.getByRole('tab', { name: 'Projetos', selected: true }).waitFor()
  await atRest(home.page)
  assert.equal(await home.transitions(), loaded, "the sidebar's tab fades the sheet")
  await home.onlyTheAreaChangeFades()
})
