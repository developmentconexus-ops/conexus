import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createProject } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { atRest } from './at-rest.ts'
import type { Replies, Viewport } from './layout-harness.ts'
import { DESKTOP, ok, PHONE } from './layout-harness.ts'
import { atHome, harness, runsOf, slowed } from './motion-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, PROJECT_ID, PROJECT_NAME, projectsPage, startsOn } from './sweep-replies.ts'

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
    replies: { ...OWNER, ...projectsPage(COMPANY.id), ...startsOn(COMPANY.id), ...CREATED },
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

/** The Hub's answer to the dialog's **Criar projeto**. */
const CREATED: Replies = {
  [`POST /api/companies/${COMPANY.id}/projects`]: ok(createProject, {
    project: {
      id: PROJECT_ID,
      name: PROJECT_NAME,
      createdAt: '2026-10-27T12:00:00.000Z',
      mayDelete: true,
      mayPublish: true,
      publishRequest: null,
      address: 'pedidos--empresa-teste.apps.example.test',
      previewAddress: 'pedidos--empresa-teste--previa.apps.example.test',
      appVersion: null,
      publishedVersion: null,
    },
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
  const home = await atHome({}, viewport)
  const transitions = await counting(home.page)
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
    transitions,
    onlyTheAreaChangeFades,
  }
}

test('a carga da página não esmaece a folha', async () => {
  const home = await counted()
  assert.equal(await home.transitions(), 0, "the page's load fades the sheet")
  await home.onlyTheAreaChangeFades()
})
