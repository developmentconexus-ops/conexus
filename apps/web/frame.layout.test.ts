import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { listAssistantConnections, listAssistantConversations } from '@conexus/hub-api'
import type { Locator } from 'playwright-core'
import type { Replies, Viewport } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH, ASSISTANT_REPLIES } from './sweep-assistant-states.ts'
import { INTEGRATIONS_STATES } from './sweep-integrations-states.ts'
import { OWNER, projectsPage, startsOn } from './sweep-replies.ts'

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

const ASSISTANT_API = `/api/companies/${COMPANY.id}/assistant`
const OPENED = ASSISTANT_PATH.split('/').at(-1) ?? ''
const NOW = '2026-10-19T12:00:00.000Z'

/** The owner's Início with a few conversations in the list and in Continuar. */
function owner(conversations: { id: string; title: string }[]): Replies {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    ...startsOn(COMPANY.id),
    [`GET ${ASSISTANT_API}/connections`]: ok(listAssistantConnections, { connections: [] }),
    [`GET ${ASSISTANT_API}/conversations`]: ok(listAssistantConversations, {
      conversations: conversations.map((one) => ({
        ...one,
        updatedAt: NOW,
        project: null,
        automation: null,
      })),
      next: { kind: 'END' },
    }),
  }
}

function onlyList(replies: Replies): Replies {
  const key = `GET ${ASSISTANT_API}/conversations`
  const reply = replies[key]
  if (reply === undefined) throw new Error('the owner has no conversations reply')
  return { [key]: reply }
}

function tickOf(element: Element) {
  const tick = getComputedStyle(element, '::before')
  return { width: tick.width, drawn: tick.backgroundColor !== 'rgba(0, 0, 0, 0)' }
}

test('a moldura: a 1366 px o trilho tem 56, a lista 272, as linhas 32, e o lugar atual o traço de 2px com aria-current', async () => {
  const conversations = [
    { id: '33333333-3333-4333-8333-333333333333', title: 'Vendas da semana' },
    { id: '44444444-4444-4444-8444-444444444444', title: 'Metas da Matriz' },
  ]
  const page = await open(`/companies/${COMPANY.id}`, DESKTOP, owner(conversations))
  const nav = page.getByRole('navigation', { name: 'Navegação' })
  const list = nav.locator('[data-sidebar=sidebar]')
  await list.getByRole('link', { name: /Vendas da semana/ }).waitFor()
  await page.waitForTimeout(250)
  const rail = await nav.locator('[data-slot=sidebar-rail-column]').boundingBox()
  const column = await list.boundingBox()
  assert.deepEqual([rail?.width, column?.width], [56, 272])
  await list.getByRole('link', { name: 'Nova conversa' }).waitFor()
  await list.getByRole('heading', { name: 'Conversas' }).waitFor()
  const rows = await list
    .locator('[data-slot=sidebar-menu-item] > a')
    .evaluateAll((all) => all.map((one) => one.getBoundingClientRect().height))
  assert.deepEqual(rows, [32, 32])
  const places = await nav
    .locator('[data-slot=sidebar-rail-column] a')
    .evaluateAll((all) => all.map((one) => one.getAttribute('aria-label')))
  assert.deepEqual(places, ['Início', 'Projetos', 'Integrações', 'Automações', 'Configurações'])
  const home = nav.getByRole('link', { name: 'Início' })
  assert.equal(await home.getAttribute('aria-current'), 'page')
  assert.deepEqual(await home.evaluate(tickOf), { width: '2px', drawn: true })
  assert.equal(await nav.getByRole('link', { name: 'Projetos' }).getAttribute('aria-current'), null)
  await page.close()

  const opened = await open(ASSISTANT_PATH, DESKTOP, {
    ...ASSISTANT_REPLIES,
    ...onlyList(owner([{ id: OPENED, title: 'Vendas da semana' }])),
  })
  const row = opened
    .getByRole('navigation', { name: 'Navegação' })
    .locator('[data-sidebar=sidebar]')
    .getByRole('link', { name: /Vendas da semana/ })
  await row.waitFor()
  assert.equal(await row.getAttribute('aria-current'), 'page')
  assert.deepEqual(await row.evaluate(tickOf), { width: '2px', drawn: true })
  await opened.close()
})

test('o lugar atual é um só: em Integrações o trilho marca só Integrações, e Nova conversa não é atual', async () => {
  const state = INTEGRATIONS_STATES.find((one) => one.name === 'Integrações vazia do dono')
  if (state === undefined) throw new Error('the empty Integrações state is gone')
  const page = await open(state.path, DESKTOP, { ...owner([]), ...state.replies })
  const nav = page.getByRole('navigation', { name: 'Navegação' })
  await page.getByText('Nenhuma integração ligada ainda.').waitFor()
  const current = await nav
    .locator('[aria-current]')
    .evaluateAll((all) => all.map((one) => one.getAttribute('aria-label') ?? one.textContent))
  assert.deepEqual(current, ['Integrações'])
  await page.close()
})

for (const [viewport, axis, half] of [
  [DESKTOP, 720, 352],
  [{ width: 1920, height: 1080 }, 880, 432],
] as const) {
  test(`o eixo: a ${viewport.width}px a saudação, a caixa, Continuar e o par Projetos e Ligações têm o mesmo centro e ${axis}px (cada metade ${half}, vão 16)`, async () => {
    const page = await open(`/companies/${COMPANY.id}`, viewport, owner([]))
    const form = page
      .getByRole('textbox', { name: 'Mensagem para o Assistente' })
      .locator('xpath=ancestor::form')
    const [continuar, projetos, ligacoes] = ['Continuar', 'Projetos', 'Ligações'].map((name) =>
      page.getByRole('region', { name }),
    )
    if (!continuar || !projetos || !ligacoes) throw new Error('a block is missing')
    await ligacoes.waitFor()
    await form.waitFor()
    const title = page.getByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite)/ })
    const [box, wide, left, right] = await Promise.all(
      [form, continuar, projetos, ligacoes].map((one) => one.boundingBox()),
    )
    assert.ok(box && wide && left && right, 'something is not laid out')
    assert.deepEqual([box.width, wide.width, left.width, right.width], [axis, axis, half, half])
    assert.equal(right.x - (left.x + left.width), 16)
    const centre = box.x + box.width / 2
    for (const [name, one] of [
      ['Continuar', wide.x + wide.width / 2],
      ['o par', (left.x + right.x + right.width) / 2],
      ['a saudação', await centreOf(title)],
    ] as const) {
      assert.ok(Math.abs(one - centre) <= 1, `${name} is off the axis's centre`)
    }
    await page.close()
  })
}

for (const viewport of [PHONE, ZOOMED_PHONE]) {
  test(`a gaveta: a ${viewport.width}px o trilho e a lista abrem juntos, a barra do topo tem 52 e nada rola de lado`, async () => {
    const page = await open(`/companies/${COMPANY.id}`, viewport, {
      ...OWNER,
      ...projectsPage(COMPANY.id),
      ...startsOn(COMPANY.id),
    })
    const top = await page.locator('header').first().boundingBox()
    assert.equal(top?.height, 52, 'the top bar is not 52 px')
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
    const drawer = page.getByRole('dialog', { name: 'Navegação' })
    const home = drawer.getByRole('link', { name: 'Início' })
    const create = drawer.getByRole('link', { name: 'Nova conversa' })
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
    const under = await drawer
      .locator('a, button')
      .evaluateAll((all) =>
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

// The box's band takes the ground of the frame it sits in: no strip of another colour behind it.
for (const [name, path, viewport] of [
  ['o Início', `/companies/${COMPANY.id}`, DESKTOP],
  ['o Início', `/companies/${COMPANY.id}`, PHONE],
  ['o passo 4 das boas-vindas', `/companies/${COMPANY.id}/welcome/build`, DESKTOP],
  ['o passo 4 das boas-vindas', `/companies/${COMPANY.id}/welcome/build`, PHONE],
] as const) {
  test(`a faixa da caixa: ${name} a ${viewport.width}px não desenha uma faixa de outra cor`, async () => {
    const page = await open(path, viewport, {
      ...OWNER,
      ...projectsPage(COMPANY.id),
      ...startsOn(COMPANY.id),
    })
    const form = page.locator('form').filter({ has: page.getByRole('textbox') })
    await form.waitFor()
    const [band, behind] = await form.evaluate((element) => {
      let ground = element.parentElement
      while (ground && getComputedStyle(ground).backgroundColor === 'rgba(0, 0, 0, 0)') {
        ground = ground.parentElement
      }
      return [
        getComputedStyle(element).backgroundColor,
        ground ? getComputedStyle(ground).backgroundColor : 'none',
      ]
    })
    assert.equal(band, behind, 'the box draws a band of another colour than the frame behind it')
    await page.close()
  })
}
