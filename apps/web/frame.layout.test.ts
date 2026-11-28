import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { getProject } from '@conexus/hub-api'
import type { Locator } from 'playwright-core'
import { atRest } from './at-rest.ts'
import { NOW, owner } from './frame-replies.ts'
import type { Replies, Viewport } from './layout-harness.ts'
import { createHarness, DESKTOP, failure, ok, PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { ANA, COMPANY } from './src/platform/fixtures.ts'
import { INTEGRATIONS_STATES } from './sweep-integrations-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'

// The company's frame in a real browser: the rail and the list, the axis of Início, the drawer
// (step 13.3, criteria 5, 7 and 10).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string, viewport: Viewport, replies: Replies) {
  return harness.open(path, { viewport, replies })
}

/** The centre of what an element draws, its text or its children, not of its own block's box. */
async function centreOf(locator: Locator): Promise<number> {
  const [left, right] = await locator.evaluate((element) => {
    const drawn = document.createRange()
    drawn.selectNodeContents(element)
    const rects = [...drawn.getClientRects()].filter((rect) => rect.width > 0)
    return [
      Math.min(...rects.map((rect) => rect.left)),
      Math.max(...rects.map((rect) => rect.right)),
    ]
  })
  assert.ok(Number.isFinite(left) && Number.isFinite(right), 'the element draws nothing')
  return (left + right) / 2
}

test('a moldura: a 1366 px o trilho tem 56, a lista 272, e o lugar atual tem aria-current', async () => {
  const page = await open(`/companies/${COMPANY.id}`, DESKTOP, owner())
  const nav = page.getByRole('navigation', { name: 'Navegação' })
  const list = nav.locator('[data-sidebar=sidebar]')
  await nav.getByRole('link', { name: 'Início' }).waitFor()
  await atRest(page)
  const rail = await nav.locator('[data-slot=sidebar-rail-column]').boundingBox()
  const column = await list.boundingBox()
  assert.deepEqual([rail?.width, column?.width], [56, 272])
  const places = await nav
    .locator('[data-slot=sidebar-rail-column] a')
    .evaluateAll((all) => all.map((one) => one.getAttribute('aria-label')))
  assert.deepEqual(places, ['Início', 'Projetos', 'Integrações', 'Dados', 'Configurações'])
  const home = nav.getByRole('link', { name: 'Início' })
  assert.equal(await home.getAttribute('aria-current'), 'page')
  assert.equal(await nav.getByRole('link', { name: 'Projetos' }).getAttribute('aria-current'), null)
  await page.close()
})

test('o lugar atual é um só: em Integrações o trilho marca só Integrações', async () => {
  const state = INTEGRATIONS_STATES.find((one) => one.name === 'Integrações vazia do dono')
  if (state === undefined) throw new Error('the empty Integrações state is gone')
  const page = await open(state.path, DESKTOP, { ...owner(), ...state.replies })
  const nav = page.getByRole('navigation', { name: 'Navegação' })
  await page.getByText('Nenhuma integração ligada ainda.').waitFor()
  const current = await nav
    .locator('[aria-current]')
    .evaluateAll((all) => all.map((one) => one.getAttribute('aria-label') ?? one.textContent))
  assert.deepEqual(current, ['Integrações'])
  await page.close()
})

for (const [viewport, axis] of [
  [DESKTOP, 720],
  [{ width: 1920, height: 1080 }, 880],
] as const) {
  test(`o eixo: a ${viewport.width}px a saudação e o bloco Projetos têm o mesmo centro, e o bloco tem ${axis}px`, async () => {
    const page = await open(`/companies/${COMPANY.id}`, viewport, owner())
    const projetos = page.getByRole('region', { name: 'Projetos' })
    await projetos.waitFor()
    const title = page.getByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite)/ })
    const box = await projetos.boundingBox()
    assert.ok(box, 'the block is not laid out')
    assert.equal(box.width, axis)
    const centre = box.x + box.width / 2
    assert.ok(
      Math.abs((await centreOf(title)) - centre) <= 1,
      "the greeting is off the axis's centre",
    )
    await page.close()
  })
}

for (const viewport of [PHONE, ZOOMED_PHONE]) {
  test(`a gaveta: a ${viewport.width}px o trilho e a lista abrem juntos, a barra do topo tem 52 e nada rola de lado`, async () => {
    const page = await open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}`, viewport, owner())
    const top = await page.locator('header').first().boundingBox()
    assert.equal(top?.height, 52, 'the top bar is not 52 px')
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
    const drawer = page.getByRole('dialog', { name: 'Navegação' })
    const home = drawer.getByRole('link', { name: 'Início' })
    const create = drawer.getByRole('link', { name: 'Construir' })
    await create.waitFor()
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== 'running'),
    )
    const [rail, list, panel] = await Promise.all(
      [home, create, drawer].map((one) => one.boundingBox()),
    )
    assert.ok(rail && list && panel, 'the drawer is not laid out')
    assert.ok(rail.x + rail.width <= list.x, 'the rail and the list are not side by side')
    assert.ok(panel.width <= 328, `the drawer is ${panel.width}px wide`)
    const close = await drawer.getByRole('button', { name: 'Fechar navegação' }).boundingBox()
    assert.ok(close, 'the drawer has no close')
    const under = await drawer.locator('a, button').evaluateAll((all) =>
      all
        .filter((one) => one.getAttribute('aria-label') !== 'Fechar navegação')
        .map((one) => ({
          name: one.getAttribute('aria-label') ?? one.textContent,
          ...one.getBoundingClientRect().toJSON(),
        })),
    )
    for (const one of under) {
      const apart =
        one.right <= close.x ||
        one.left >= close.x + close.width ||
        one.bottom <= close.y ||
        one.top >= close.y + close.height
      assert.ok(apart, `the close covers "${one.name}"`)
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    await page.close()
  })
}

const OUTSIDE = { id: 'o'.repeat(32), name: 'Projeto fora da primeira página' }
const GONE = 'g'.repeat(32)

test('a barra do Projeto abre a lista com os recentes primeiro: um fora das páginas com o nome lido à parte, um apagado não aparece', async () => {
  const page = await open(`/companies/${COMPANY.id}/projects/${PROJECT_ID}`, DESKTOP, {
    ...owner(),
    [`GET /api/companies/${COMPANY.id}/projects/${OUTSIDE.id}`]: ok(getProject, {
      project: {
        ...OUTSIDE,
        createdAt: NOW,
        appVersion: null,
        publishedVersion: null,
        mayDelete: true,
        mayPublish: true,
        publishRequest: null,
        address: null,
        previewAddress: null,
      },
    }),
    [`GET /api/companies/${COMPANY.id}/projects/${GONE}`]: failure('NOT_FOUND'),
  })
  await page.evaluate(({ key, ids }) => localStorage.setItem(key, ids), {
    key: `conexus-remembered:${ANA.id}:projects.${COMPANY.id}`,
    ids: `${GONE} ${OUTSIDE.id}`,
  })
  await page.reload()
  const list = page.getByRole('navigation', { name: 'Navegação' }).locator('[data-sidebar=sidebar]')
  await list.locator('[aria-haspopup]').first().click()
  const row = '[role=option], [role=menuitem]'
  const recent = page.getByRole('group', { name: 'Projetos recentes' })
  await recent.locator(row, { hasText: OUTSIDE.name }).waitFor()
  const names = await recent.locator(row).allTextContents()
  assert.ok(names.length <= 5, `more than five recent: ${names.length}`)
  assert.ok(
    page.seen.some((one) => one.path === `/api/companies/${COMPANY.id}/projects/${GONE}`),
    'the deleted Projeto was never asked for',
  )
  assert.ok(!names.includes('Projeto'), 'the deleted Projeto shows among the recent')
  const rows = await page.locator(row).allTextContents()
  assert.equal(
    rows.filter((name) => name === OUTSIDE.name).length,
    1,
    'a recent repeats among the Projetos',
  )
  // The browser reports the Hub's 404 for the deleted Projeto as a failed resource; nothing else.
  assert.deepEqual(
    page.problems.filter((problem) => !problem.includes('status of 404')),
    [],
  )
  await page.close()
})
