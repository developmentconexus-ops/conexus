import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator } from 'playwright-core'
import { curveOf, harness, piece, runsOf, showcase, slowed, timesOf } from './motion-harness.ts'

// What comes in and what leaves, in a real browser (design V26).
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

test('o menu e a dica entram curtos', async () => {
  const page = await showcase()
  await slowed(page)
  const enter = await curveOf(page, '--ease-enter')
  for (const [file, role, trigger, slot] of [
    ['dropdown-menu.tsx', 'button', 'Ações', 'dropdown-menu-content'],
    ['popover.tsx', 'button', 'Raciocínio', 'popover-content'],
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

test('o seletor sobre o gatilho aparece sem a entrada', async () => {
  const page = await showcase()
  await slowed(page)
  const trigger = piece(page, 'select.tsx').getByRole('combobox', { name: 'Quem vê' }).first()
  const popup = page.locator('[data-slot=select-content]')
  async function leaves() {
    await page.keyboard.press('Escape')
    await page.locator('[data-slot=select-content][data-ending-style]').waitFor()
    const leaving = await runsOf(popup)
    assert.deepEqual([leaving.opacity?.ms, leaving.scale?.ms], [75, 75])
    await finished(popup)
    await popup.waitFor({ state: 'hidden' })
  }

  await trigger.click()
  await popup.waitFor()
  assert.equal(await popup.getAttribute('data-side'), 'none')
  assert.deepEqual(await runsOf(popup), {}, 'the select over its trigger enters')
  assert.deepEqual(
    await popup.evaluate((one) => [getComputedStyle(one).opacity, getComputedStyle(one).scale]),
    ['1', 'none'],
  )
  await leaves()

  // Under a finger it opens beside the trigger, and enters as the other popups do.
  const box = await trigger.boundingBox()
  assert.ok(box, 'the select is not laid out')
  const finger = await page.context().newCDPSession(page)
  await finger.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
  await finger.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
  })
  await finger.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await popup.and(page.locator('[data-open]')).waitFor()
  assert.equal(await popup.getAttribute('data-side'), 'bottom')
  const entering = await runsOf(popup)
  assert.deepEqual([entering.opacity?.ms, entering.scale?.ms], [120, 120])
  await finished(popup)
  await leaves()
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
