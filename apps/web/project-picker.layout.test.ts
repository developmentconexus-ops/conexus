import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Page } from 'playwright-core'
import { atRest } from './at-rest.ts'
import type { Replies, Viewport } from './layout-harness.ts'
import { createHarness, DESKTOP, failure, PHONE, touching } from './layout-harness.ts'
import type { Place } from './picker-places.ts'
import {
  asked,
  PLACES,
  PROJECTS,
  popupOf,
  project,
  projectsReply,
  SECOND,
  SIXTY,
  sixty,
  triggerOf,
} from './picker-places.ts'
import { NO_PROJECT_MATCH } from './src/hub/projects/text.ts'
import { sentenceOfCode } from './src/platform/hub.ts'

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

async function openList(place: Place, viewport: Viewport, projects: Replies) {
  const opened = await harness.open(place.path, { viewport, replies: place.replies(projects) })
  await opened.getByRole('combobox', { name: place.label, exact: true }).click()
  const list = opened.getByRole('listbox', { name: place.label, exact: true })
  await list.waitFor()
  return { page: opened, list }
}

function projectRows(list: ReturnType<Page['getByRole']>) {
  return list.getByRole('option', { name: /^Projeto \d+$/ })
}

for (const place of PLACES) {
  test(`${place.name}: 60 Projetos mostram 50, Mais Projetos traz os outros 10, e enquanto vem fica desligado`, async () => {
    const { promise: hold, resolve: release } = Promise.withResolvers<void>()
    const { page, list } = await openList(place, DESKTOP, {
      ...sixty({ ...projectsReply(SIXTY.slice(50), 'END'), hold }),
    })
    await projectRows(list).nth(49).waitFor()
    assert.equal(await projectRows(list).count(), 50)
    const more = popupOf(page).getByRole('button', { name: 'Mais Projetos' })
    await more.click()
    await more.and(page.locator('[disabled]')).waitFor()
    assert.equal(await more.isDisabled(), true)
    await more.click({ force: true })
    release()
    await projectRows(list).nth(59).waitFor()
    assert.equal(await projectRows(list).count(), 60)
    assert.equal(await popupOf(page).getByRole('button', { name: 'Mais Projetos' }).count(), 0)
    const seconds = page.seen.filter(
      (one) => one.search === `?${new URLSearchParams({ page: SECOND })}`,
    )
    assert.equal(seconds.length, 1, 'a second click asked for another page')
    assert.deepEqual(page.problems, [])
    await page.close()
  })

  test(`${place.name}: a segunda página em falha deixa as 50, mostra a frase do Hub e religa Mais Projetos`, async () => {
    const { page, list } = await openList(place, DESKTOP, sixty(failure('DATABASE_UNAVAILABLE')))
    await projectRows(list).nth(49).waitFor()
    await popupOf(page).getByRole('button', { name: 'Mais Projetos' }).click()
    const alert = popupOf(page)
      .getByRole('alert')
      .filter({ hasText: sentenceOfCode('DATABASE_UNAVAILABLE') })
    await alert.waitFor()
    assert.equal(await projectRows(list).count(), 50)
    assert.equal(
      await popupOf(page).getByRole('button', { name: 'Mais Projetos' }).isDisabled(),
      false,
    )
    await page.close()
  })

  test(`${place.name}: buscar o 58º o acha no Hub sem apertar Mais Projetos, e a lista anterior fica até a resposta`, async () => {
    const { promise: hold, resolve: release } = Promise.withResolvers<void>()
    const { page, list } = await openList(place, DESKTOP, {
      ...sixty(),
      [asked({ q: 'Projeto 58' })]: { ...projectsReply([project(58)], 'END'), hold },
    })
    await projectRows(list).nth(49).waitFor()
    await page.getByRole('combobox', { name: 'Buscar Projeto' }).fill('Projeto 58')
    await page.waitForFunction(() => document.querySelectorAll('[data-slot=skeleton]').length === 0)
    assert.equal(await projectRows(list).count(), 50, 'the list before the text left at the letter')
    release()
    await list.getByRole('option', { name: 'Projeto 58' }).waitFor()
    await page.waitForFunction(() => document.querySelectorAll('[role=option]').length === 1)
    assert.deepEqual(await projectRows(list).allTextContents(), ['Projeto 58'])
    const searched = page.seen.filter((one) => one.path === PROJECTS).map((one) => one.search)
    assert.ok(
      searched.includes(`?${new URLSearchParams({ q: 'Projeto 58' })}`),
      'the text never went to the Hub',
    )
    assert.ok(
      !searched.includes(`?${new URLSearchParams({ page: SECOND })}`),
      'Mais Projetos was asked for',
    )
    await page.close()
  })

  test(`${place.name}: buscar um nome que não existe mostra a frase de nenhum resultado e nenhuma linha`, async () => {
    const { page, list } = await openList(place, DESKTOP, {
      ...sixty(),
      [asked({ q: 'zzz' })]: projectsReply([], 'END'),
    })
    await projectRows(list).nth(49).waitFor()
    await page.getByRole('combobox', { name: 'Buscar Projeto' }).fill('zzz')
    await popupOf(page).getByText(NO_PROJECT_MATCH, { exact: true }).waitFor()
    assert.equal(await list.getByRole('option').count(), 0)
    assert.deepEqual(page.problems, [])
    await page.close()
  })

  test(`${place.name}: a primeira leitura em falha mostra a frase do Hub e o item fixo segue escolhível`, async () => {
    const { page, list } = await openList(place, DESKTOP, {
      [`GET ${PROJECTS}`]: failure('DATABASE_UNAVAILABLE'),
    })
    await popupOf(page)
      .getByRole('alert')
      .filter({ hasText: sentenceOfCode('DATABASE_UNAVAILABLE') })
      .waitFor()
    if (place.fixed !== undefined) {
      const fixed = list.getByRole('option', { name: place.fixed, exact: true })
      await fixed.waitFor()
      assert.equal(await fixed.getAttribute('aria-disabled'), null)
      await fixed.click()
      // A pointer resting on a link for the 75 ms the list takes to leave would preload it.
      await page.mouse.move(0, 0)
      await list.waitFor({ state: 'hidden' })
    }
    await page.close()
  })

  for (const [viewport, finger, height] of [
    [DESKTOP, false, 32],
    [PHONE, true, 44],
  ] as const)
    test(`${place.name}: a ${viewport.width}px as linhas têm ${height}px e a lista cabe sem rolagem lateral`, async () => {
      const opened = await harness.open(place.path, { viewport, replies: place.replies(sixty()) })
      await (await triggerOf(opened, place)).click()
      const list = opened.getByRole('listbox', { name: place.label, exact: true })
      await projectRows(list).nth(49).waitFor()
      await atRest(opened)
      // A press under an emulated finger never settles in the headless shell: the finger comes after.
      if (finger) await touching(opened)
      const heights = await list
        .getByRole('option')
        .evaluateAll((all) => [...new Set(all.map((one) => one.getBoundingClientRect().height))])
      assert.deepEqual(heights, [height])
      const box = await list.boundingBox()
      const scroll = await opened.evaluate(() => document.documentElement.scrollWidth)
      assert.ok(
        box && box.x >= 0 && box.x + box.width <= viewport.width,
        'the list leaves the screen',
      )
      assert.ok(scroll <= viewport.width, `scrolls sideways: ${scroll} > ${viewport.width}`)
      await opened.close()
    })
}
