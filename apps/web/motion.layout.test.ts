import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator, Page } from 'playwright-core'
import { atHome, curveOf, harness, piece, showcase, slowed } from './motion-harness.ts'

// Motion in a real browser (design V26, docs/reference/movimento.md): which properties of a piece
// move, for how long and on which curve; jsdom computes no transition.
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

type Move = { property: string; duration: string; easing: string }

/** What the element's own transition moves, property by property, with its time and its curve. */
function movesOf(locator: Locator): Promise<Move[]> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    // A comma inside `cubic-bezier()` or `linear()` separates no list item.
    function list(value: string) {
      return value.split(/,\s*(?![^()]*\))/)
    }
    const durations = list(style.transitionDuration)
    const easings = list(style.transitionTimingFunction)
    return list(style.transitionProperty).map((property, at) => ({
      property,
      duration: durations[at % durations.length] ?? '',
      easing: easings[at % easings.length] ?? '',
    }))
  })
}

/** The transitions running on the element now: each property with its milliseconds. */
function runningOn(locator: Locator): Promise<Record<string, number>> {
  return locator.evaluate((element) =>
    Object.fromEntries(
      element
        .getAnimations()
        .filter((one) => one instanceof CSSTransition)
        .map((one) => [one.transitionProperty, Number(one.effect?.getTiming().duration)]),
    ),
  )
}

const PAINT =
  /^(color|background-color|border-color|outline-color|text-decoration-color|fill|stroke|box-shadow|--tw-gradient-(from|via|to))$/

test('o mouse muda só a cor, no tempo da escala', async () => {
  const page = await showcase()
  const pieces = [
    [
      'the sidebar row',
      piece(page, 'sidebar.tsx').locator('[data-slot=sidebar-menu-button]'),
      '0.075s',
    ],
    ['the button', piece(page, 'button.tsx').locator('button[data-preview=hover]'), '0.16s'],
    ['the table row', piece(page, 'table.tsx').locator('[data-slot=table-row]'), '0.16s'],
    ['the attachment', piece(page, 'attachment.tsx').locator('[data-slot=attachment]'), '0.16s'],
  ] as const
  for (const [name, locator, time] of pieces) {
    // The button's `scale` answers the press, not the mouse: "o toque cede e volta" reads it.
    const moves = (await movesOf(locator.first())).filter(
      (move) => !(name === 'the button' && move.property === 'scale'),
    )
    assert.deepEqual(
      moves.filter((move) => !PAINT.test(move.property) || move.duration !== time),
      [],
      `${name} moves more than its paint, or off ${time}`,
    )
  }
  // Focus never moves (design V26): the ring is there at once, in its own colour.
  for (const control of [
    piece(page, 'sidebar.tsx').locator('[data-slot=sidebar-menu-button]'),
    piece(page, 'switch.tsx').locator('[data-slot=switch]'),
  ]) {
    await control.first().focus()
    assert.equal(await control.first().evaluate((one) => one.matches(':focus-visible')), true)
    assert.deepEqual(await runningOn(control.first()), {}, 'the focus ring fades in')
  }
  await page.close()
})

test('o toque cede e volta', async () => {
  const page = await showcase()
  const spring = await curveOf(page, '--ease-spring-press')
  assert.match(spring, /^linear\(/)
  const band = piece(page, 'button.tsx')
  const rest = band.getByRole('button', { name: 'Salvar', exact: true }).first()
  const pressed = band.locator('button[data-preview=active]')
  assert.equal(await rest.evaluate((button) => getComputedStyle(button).scale), 'none')
  assert.equal(await pressed.evaluate((button) => getComputedStyle(button).scale), '0.96')
  for (const button of [rest, pressed]) {
    assert.deepEqual(
      (await movesOf(button)).find((move) => move.property === 'scale'),
      { property: 'scale', duration: '0.42s', easing: spring },
    )
  }
  function laidOut(locator: Locator) {
    return locator.evaluate((one: HTMLElement) => [one.offsetWidth, one.offsetHeight])
  }
  assert.deepEqual(await laidOut(pressed), await laidOut(rest), 'the press changed the layout')

  // The same under a real pointer, on the way in and on the way back.
  await rest.hover()
  await page.mouse.down()
  assert.equal((await runningOn(rest)).scale, 420, 'the press does not give on the spring')
  await rest.evaluate((button) => {
    for (const one of button.getAnimations()) one.finish()
  })
  await page.mouse.up()
  assert.equal((await runningOn(rest)).scale, 420, 'the release does not come back on the spring')

  const calm = await curveOf(page, '--ease-spring-state')
  for (const [file, slot] of [
    ['switch.tsx', 'switch'],
    ['switch.tsx', 'switch-thumb'],
    ['checkbox.tsx', 'checkbox'],
  ] as const) {
    const control = piece(page, file).locator(`[data-slot=${slot}]`)
    const moves = await movesOf(control.first())
    assert.deepEqual(
      moves.filter(
        (move) =>
          move.duration !== '0.56s' ||
          move.easing !== calm ||
          /^(width|height|all)$/.test(move.property),
      ),
      [],
      `${slot} does not change state on the calm spring`,
    )
    assert.deepEqual(
      await laidOut(control.nth(0)),
      await laidOut(control.nth(1)),
      `${slot} changes size between on and off`,
    )
  }
  await page.close()
})

test('nada estica', async () => {
  const page = await showcase()
  const sidebar = piece(page, 'sidebar.tsx')
  const trace = piece(page, 'trace.tsx')
  await trace.getByRole('button', { name: /Leu 3 páginas/ }).click()
  for (const locator of [
    sidebar.locator('[data-slot=sidebar-container]'),
    sidebar.locator('[data-slot=sidebar-gap]'),
    trace.locator('[data-slot=trace-collapsible-content]'),
  ]) {
    assert.deepEqual(
      (await movesOf(locator.first())).filter(
        (move) => /^(width|height|all)$/.test(move.property) && move.duration !== '0s',
      ),
      [],
    )
  }
  assert.deepEqual(page.problems, [])
  await page.close()
})

/** Every element, and its two pseudo-elements, with a transition that takes any time. */
function timed(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = []
    for (const element of document.querySelectorAll('*')) {
      for (const pseudo of [null, '::before', '::after']) {
        const duration = getComputedStyle(element, pseudo).transitionDuration
        if (duration.split(', ').every((one) => one === '0s')) continue
        const name = element.getAttribute('data-slot') ?? element.tagName.toLowerCase()
        found.push(`${name}${pseudo ?? ''} ${duration}`)
      }
    }
    return [...new Set(found)]
  })
}

test('com reduzir, nada anima', async () => {
  const page = await showcase()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  async function still(moment: string) {
    assert.deepEqual(await timed(page), [], `a transition takes time ${moment}`)
    assert.equal(
      await page.evaluate(() => document.getAnimations().length),
      0,
      `something animates ${moment}`,
    )
  }
  await still('at rest')
  for (const [file, trigger, popup] of [
    ['dialog.tsx', 'Abrir caixa', 'dialog-content'],
    ['alert-dialog.tsx', 'Apagar', 'alert-dialog-content'],
    ['sheet.tsx', 'Abrir painel', 'sheet-content'],
    ['drawer.tsx', 'Abrir gaveta', 'drawer-content'],
    ['dropdown-menu.tsx', 'Ações', 'dropdown-menu-content'],
  ] as const) {
    await piece(page, file).getByRole('button', { name: trigger, exact: true }).click()
    await page.locator(`[data-slot=${popup}]`).waitFor()
    await still(`with ${popup} open`)
    await page.keyboard.press('Escape')
    await page.locator(`[data-slot=${popup}]`).waitFor({ state: 'detached' })
  }
  await piece(page, 'tooltip.tsx').getByRole('button', { name: 'Enviar' }).hover()
  await page.locator('[data-slot=tooltip-content]').waitFor()
  await still('with a tooltip open')
  await piece(page, 'switch.tsx').getByRole('switch', { name: 'Avisos' }).first().click()
  await still('as a switch turns')
  await piece(page, 'notice.tsx').getByRole('button', { name: 'Salvar padrão' }).click()
  await page.locator('[data-slot=notice]').waitFor()
  await still('with a notice shown')
  assert.deepEqual(page.problems, [])
  await page.close()

  const home = await atHome()
  await home.page.emulateMedia({ reducedMotion: 'reduce' })
  await slowed(home.page)
  await home.integrations.click()
  await home.page.getByText('Nenhuma integração ligada ainda.').waitFor()
  assert.equal(
    await home.page.evaluate(() => document.getAnimations().length),
    0,
    'something animates as the screen changes',
  )
  assert.deepEqual(home.page.problems, [])
  await home.page.close()
})
