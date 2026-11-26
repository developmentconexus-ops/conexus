import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConversations } from '@conexus/hub-api'
import type { Locator, Page } from 'playwright-core'
import { atRest } from './at-rest.ts'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'
import { atHome, curveOf, harness, piece, showcase, slowed } from './motion-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'

// What comes in, what leaves and the change of screen, in a real browser (design V26).
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

/** Brings every animation on the element to its end. */
function finished(locator: Locator) {
  return locator.evaluate((element) => {
    for (const one of element.getAnimations()) one.finish()
  })
}

type Run = { ms: number; easing: string; from: string }

/** The transitions running on the element now, each with its time, its curve and where it left. */
function runsOf(locator: Locator): Promise<Record<string, Run>> {
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

test('o menu e a dica entram curtos', async () => {
  const page = await showcase()
  await slowed(page)
  const enter = await curveOf(page, '--ease-enter')
  for (const [file, role, trigger, slot] of [
    ['dropdown-menu.tsx', 'button', 'Ações', 'dropdown-menu-content'],
    ['popover.tsx', 'button', 'Raciocínio', 'popover-content'],
    ['select.tsx', 'combobox', 'Quem vê', 'select-content'],
    ['combobox.tsx', 'combobox', 'Modelo', 'combobox-content'],
  ] as const) {
    await piece(page, file).getByRole(role, { name: trigger }).first().click()
    const popup = page.locator(`[data-slot=${slot}]`)
    await popup.waitFor()
    assert.deepEqual(
      await runsOf(popup),
      {
        opacity: { ms: 120, easing: enter, from: '0' },
        scale: { ms: 120, easing: enter, from: '0.96' },
      },
      `${slot} does not enter short`,
    )
    await finished(popup)
    await page.keyboard.press('Escape')
    await page.locator(`[data-slot=${slot}][data-ending-style]`).waitFor()
    const leaving = await runsOf(popup)
    assert.deepEqual(
      [leaving.opacity?.ms, leaving.scale?.ms],
      [75, 75],
      `${slot} does not leave faster`,
    )
    await popup.waitFor({ state: 'hidden' })
  }

  const triggers = page.locator('[data-file="tooltip.tsx"]').getByRole('button', { name: 'Enviar' })
  await triggers.first().hover()
  const tooltip = page.locator('[data-slot=tooltip-content]')
  await tooltip.waitFor()
  assert.deepEqual(await runsOf(tooltip), {
    opacity: { ms: 120, easing: enter, from: '0' },
    scale: { ms: 120, easing: enter, from: '0.96' },
  })
  await finished(tooltip)
  // The next trigger within the group's time: its tooltip is there at once.
  await triggers.nth(1).hover()
  const second = page.locator('[data-slot=tooltip-content][data-instant]:not([data-ending-style])')
  await second.waitFor()
  assert.deepEqual(await runsOf(second), {})
  assert.equal(await second.evaluate((one) => getComputedStyle(one).opacity), '1')
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('a janela e a gaveta', async () => {
  const page = await showcase()
  await slowed(page)
  const enter = await curveOf(page, '--ease-enter')
  const exit = await curveOf(page, '--ease-exit')
  async function opened(file: string, trigger: string, slot: string) {
    await piece(page, file).getByRole('button', { name: trigger, exact: true }).click()
    const popup = page.locator(`[data-slot=${slot}]`)
    await popup.waitFor()
    return popup
  }
  async function closed(popup: Locator, slot: string) {
    await finished(popup)
    await page.keyboard.press('Escape')
    await page.locator(`[data-slot=${slot}][data-ending-style]`).waitFor()
    const leaving = await runsOf(popup)
    await finished(popup)
    return leaving
  }
  function timesOf(runs: Record<string, Run>) {
    return Object.fromEntries(
      Object.entries(runs).map(([property, run]) => [property, [run.ms, run.easing]]),
    )
  }

  const dialog = await opened('dialog.tsx', 'Abrir caixa', 'dialog-content')
  const entering = await runsOf(dialog)
  assert.deepEqual(Object.keys(entering), ['opacity'])
  assert.equal(entering.opacity?.ms, 150)
  assert.equal((await runsOf(page.locator('[data-slot=dialog-overlay]'))).opacity?.ms, 150)
  await closed(dialog, 'dialog-content')
  await dialog.waitFor({ state: 'detached' })

  const sheet = await opened('sheet.tsx', 'Abrir painel', 'sheet-content')
  const slid = await runsOf(sheet)
  assert.deepEqual(timesOf(slid), { opacity: [200, enter], translate: [200, enter] })
  assert.equal(slid.translate?.from, '-40px')
  assert.equal((await runsOf(page.locator('[data-slot=sheet-overlay]'))).opacity?.ms, 150)
  assert.deepEqual(timesOf(await closed(sheet, 'sheet-content')), {
    opacity: [150, exit],
    translate: [150, exit],
  })
  await sheet.waitFor({ state: 'detached' })

  const drawer = await opened('drawer.tsx', 'Abrir gaveta', 'drawer-content')
  assert.deepEqual(timesOf(await runsOf(drawer)), { transform: [200, enter] })
  assert.equal((await runsOf(page.locator('[data-slot=drawer-overlay]'))).opacity?.ms, 150)
  await finished(drawer)
  const box = await drawer.boundingBox()
  assert.ok(box, 'the drawer is not laid out')
  await page.mouse.move(box.x + box.width / 2, box.y + 8)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + 48, { steps: 8 })
  await page.locator('[data-slot=drawer-content][data-swiping]').waitFor()
  for (const slot of ['drawer-content', 'drawer-overlay']) {
    assert.equal(
      await page
        .locator(`[data-slot=${slot}]`)
        .evaluate((one) => getComputedStyle(one).transitionDuration),
      '0s',
      `${slot} animates under the finger`,
    )
  }
  await page.mouse.up()
  await finished(drawer)
  assert.deepEqual(timesOf(await closed(drawer, 'drawer-content')), { transform: [150, exit] })
  assert.deepEqual(page.problems, [])
  await page.close()
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

test('uma segunda troca antes de a primeira aparecer troca de uma vez, sem erro', async () => {
  const { page, integrations } = await atHome()
  // The first transition's update is held while the person picks a third screen.
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

/** Início again from a fresh load, counting the view transitions the page starts. */
async function counted() {
  const home = await atHome(ONE_CONVERSATION)
  await home.page.addInitScript(() => {
    const start = document.startViewTransition.bind(document)
    document.startViewTransition = (update) => {
      const root = document.documentElement
      const count = Number(root.getAttribute('data-transitions') ?? 0)
      root.setAttribute('data-transitions', String(count + 1))
      return start(update)
    }
  })
  await home.page.reload()
  await home.integrations.waitFor()
  await atRest(home.page)
  const nav = home.page.getByRole('navigation', { name: 'Navegação' })
  function transitions() {
    return home.page.evaluate(() =>
      Number(document.documentElement.getAttribute('data-transitions') ?? 0),
    )
  }
  /** The control: after what must not fade, a change of area starts the first transition. */
  async function onlyTheAreaChangeFades() {
    const before = await transitions()
    await home.integrations.click()
    await home.page.getByText('Nenhuma integração ligada ainda.').waitFor()
    assert.equal(await transitions(), before + 1)
    assert.deepEqual(home.page.problems, [])
    await home.page.close()
  }
  return { page: home.page, nav, transitions, onlyTheAreaChangeFades }
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
