import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { getSession } from '@conexus/hub-api'
import type { Locator } from 'playwright-core'
import type { Replies, Viewport } from './layout-harness.ts'
import {
  createHarness,
  DESKTOP,
  failure,
  ok,
  PHONE,
  presses,
  SMALL_PHONE,
  ZOOMED_PHONE,
} from './layout-harness.ts'
import { DEFAULT_STATES } from './sweep-defaults-states.ts'
import { companies, PROJECT_ID } from './sweep-replies.ts'

const WIDE_PHONE = { width: 600, height: 900 }
const SIGNED_OUT: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_OUT' }),
}
// One company Ana owns: "/" opens its Início, in the company's frame.
const HOUSE = companies([{ name: 'Empresa Teste', role: 'owner' }], false)
const COMPANY_ID = '0'.repeat(32)
const PROJECT = `/companies/${COMPANY_ID}/projects/${PROJECT_ID}`
const UNAVAILABLE: Replies = { 'GET /api/sessions/current': failure('DATABASE_UNAVAILABLE') }

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string, viewport: Viewport, replies: Replies) {
  return harness.open(path, { viewport, replies })
}

async function widthOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return box.width
}

for (const [viewport, field] of [
  [DESKTOP, 384],
  [PHONE, 358],
] as const) {
  test(`o formulário de entrada tem ${field}px de largura numa tela de ${viewport.width}px`, async () => {
    const page = await open('/login', viewport, SIGNED_OUT)
    assert.equal(await widthOf(page.getByRole('textbox', { name: 'E-mail' })), field)
    await page.close()
  })
}

for (const [viewport, drawer] of [
  [PHONE, 292.5],
  [WIDE_PHONE, 320],
] as const) {
  test(`a gaveta tem ${drawer}px numa tela de ${viewport.width}px`, async () => {
    const page = await open('/', viewport, HOUSE)
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
    const dialog = page.getByRole('dialog', { name: 'Navegação' })
    // Measured after the slide-in, whose transform leaves a fraction of a pixel mid-way.
    await dialog.evaluate((open) =>
      Promise.all(open.getAnimations().map((slide) => slide.finished)),
    )
    assert.equal(await widthOf(dialog), drawer)
    await page.close()
  })
}

test('a mensagem de falha tem 448px de largura numa tela de 1366px', async () => {
  const page = await open('/', DESKTOP, UNAVAILABLE)
  assert.equal(await widthOf(page.getByRole('alert').locator('..')), 448)
  await page.close()
})

test('de 768px para cima não há barra no topo: a barra lateral aberta tem 256px', async () => {
  const page = await open('/', DESKTOP, HOUSE)
  const nav = page.getByRole('navigation', { name: 'Navegação' })
  await nav.getByRole('link', { name: 'Início' }).waitFor()
  assert.deepEqual(
    {
      nav: await widthOf(nav),
      opener: await page.getByRole('button', { name: 'Abrir navegação' }).isVisible(),
    },
    { nav: 256, opener: false },
  )
  await page.close()
})

test('no Projeto a barra vira ícones com dica; Ctrl+B a abre e, ao sair do Projeto, volta aberta', async () => {
  const page = await open(PROJECT, DESKTOP, HOUSE)
  const nav = page.getByRole('navigation', { name: 'Navegação' })
  const home = nav.getByRole('link', { name: 'Início' })
  await home.waitFor()
  await page.waitForTimeout(250)
  const collapsed = await widthOf(nav)
  await home.hover()
  // Base UI's tooltip popup carries no role; the trigger names the place by its own label.
  const tip = await page.locator('[data-slot=tooltip-content]').textContent()
  await page.keyboard.press('Control+b')
  await page.waitForTimeout(250)
  const opened = await widthOf(nav)
  await page.keyboard.press('Control+b')
  await page.waitForTimeout(250)
  await home.click()
  await page.getByRole('heading', { name: 'O que vamos construir?' }).waitFor()
  await page.waitForTimeout(250)
  assert.deepEqual(
    { collapsed, tip, opened, after: await widthOf(nav) },
    { collapsed: 52, tip: 'Início', opened: 256, after: 256 },
  )
  await page.close()
})

for (const viewport of [SMALL_PHONE, ZOOMED_PHONE]) {
  test(`o topo do celular cabe numa tela de ${viewport.width}px, com Abrir navegação à vista`, async () => {
    const page = await open('/', viewport, HOUSE)
    const opener = await page.getByRole('button', { name: 'Abrir navegação' }).boundingBox()
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth)
    assert.deepEqual(
      { scroll, openerEnd: (opener?.x ?? 0) + (opener?.width ?? 0) <= viewport.width },
      { scroll: viewport.width, openerEnd: true },
    )
    await page.close()
  })
}

for (const state of DEFAULT_STATES) {
  test(`${state.name} cabe numa tela de ${ZOOMED_PHONE.width}px, a 200% de ampliação, sem rolagem lateral`, async () => {
    const page = await open(state.path, ZOOMED_PHONE, state.replies)
    await state.settle(page)
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth)
    assert.equal(scroll, ZOOMED_PHONE.width)
    await page.close()
  })
}

test('a gaveta tem tudo da barra: a empresa, Início, os Projetos, Configurações e a conta', async () => {
  const page = await open('/', PHONE, HOUSE)
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  await drawer.getByRole('link', { name: 'Início' }).waitFor()
  const names = await Promise.all(
    [
      drawer.getByText('Empresa Teste'),
      drawer.getByRole('link', { name: 'Todos os projetos' }),
      drawer.getByRole('link', { name: 'Configurações' }),
      drawer.getByRole('button', { name: 'Conta de Ana Lima' }),
    ].map((one) => one.isVisible()),
  )
  assert.deepEqual(names, [true, true, true, true])
  await page.close()
})

test('Esc fecha a gaveta e devolve o foco a "Abrir navegação"', async () => {
  const page = await open('/', PHONE, HOUSE)
  const opener = page.getByRole('button', { name: 'Abrir navegação' })
  await opener.click()
  await page.getByRole('dialog', { name: 'Navegação' }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 2000 })
  assert.equal(await opener.evaluate((button) => button === document.activeElement), true)
  await page.close()
})

for (const viewport of [DESKTOP, PHONE]) {
  test(`não encontrado na moldura fica na área, sem rolagem, e o link-botão tem borda, numa tela de ${viewport.width}px`, async () => {
    const page = await open(`/companies/${COMPANY_ID}/nada`, viewport, HOUSE)
    const back = page.getByRole('link', { name: 'Voltar ao início' })
    // A link drawn as a button keeps its variant's border, not the base's transparent one.
    const border = await back.evaluate((link) => getComputedStyle(link).borderTopColor)
    assert.notEqual(border, 'rgba(0, 0, 0, 0)')
    const { scroll, inner } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollHeight,
      inner: window.innerHeight,
    }))
    assert.ok(scroll <= inner, `the page scrolls: ${scroll}px in ${inner}px`)
    assert.equal(await page.locator('main main').count(), 0)
    await page.close()
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test(`o aviso "Senha criada. Entre com ela." não tem a cor do subtítulo, no tema ${scheme}`, async () => {
    const page = await harness.open('/login?reason=password-set', {
      viewport: PHONE,
      replies: SIGNED_OUT,
      scheme,
    })
    function colorOf(text: string) {
      return page.getByText(text).evaluate((element) => getComputedStyle(element).color)
    }
    const notice = await colorOf('Senha criada. Entre com ela.')
    const subtitle = await colorOf('Use o seu e-mail de trabalho.')
    const title = await colorOf('Entrar no Conexus')
    assert.notEqual(notice, subtitle)
    assert.equal(notice, title)
    await page.close()
  })
}

test('o contorno do item do menu da conta fica longe da borda do menu', async () => {
  const page = await open('/', DESKTOP, HOUSE)
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).focus()
  await presses(page, 'Enter', 1)
  const edges = await page.evaluate(() => {
    const item = document.querySelector('[role=menuitem]')
    const menu = document.querySelector('[role=menu]')
    if (!item || !menu) return undefined
    const { outlineOffset, outlineWidth } = getComputedStyle(item)
    return {
      itemLeft: item.getBoundingClientRect().left,
      itemRight: item.getBoundingClientRect().right,
      menuLeft: menu.getBoundingClientRect().left,
      menuRight: menu.getBoundingClientRect().right,
      reach: Number.parseFloat(outlineOffset) + Number.parseFloat(outlineWidth),
    }
  })
  assert.ok(edges, 'the menu is not open')
  // The popup's own hairline is 1px; the outline must clear the inside of it by 2px or more.
  const left = edges.itemLeft - edges.reach - (edges.menuLeft + 1)
  const right = edges.menuRight - 1 - (edges.itemRight + edges.reach)
  assert.deepEqual([left >= 2, right >= 2], [true, true])
  await page.close()
})

function iconWidth(owner: Locator): Promise<number> {
  return owner.locator('svg').evaluate((icon) => icon.getBoundingClientRect().width)
}

test('os ícones têm 14px na barra, 16px ao lado de um texto e 18px no trilho', async () => {
  const page = await open('/', PHONE, HOUSE)
  const opener = await iconWidth(page.getByRole('button', { name: 'Abrir navegação' }))
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
  const close = await iconWidth(drawer.getByRole('button', { name: 'Fechar navegação' }))
  const rail = await iconWidth(drawer.getByRole('link', { name: 'Início' }))
  await drawer.getByRole('button', { name: 'Conta de Ana Lima' }).click()
  const leave = await iconWidth(page.getByRole('menuitem', { name: 'Sair do Conexus' }))
  assert.deepEqual({ opener, close, leave, rail }, { opener: 14, close: 14, leave: 16, rail: 18 })
  await page.close()
})

for (const viewport of [DESKTOP, PHONE]) {
  test(`o título da página que não existe cabe numa linha numa tela de ${viewport.width}px`, async () => {
    const page = await open('/nada', viewport, SIGNED_OUT)
    const lines = await page.getByRole('heading', { level: 1 }).evaluate((heading) => {
      const text = document.createRange()
      text.selectNodeContents(heading)
      return new Set([...text.getClientRects()].map((line) => line.top)).size
    })
    assert.equal(lines, 1)
    await page.close()
  })
}
