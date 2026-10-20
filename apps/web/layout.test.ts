import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { getSession, getStatus, listCompanies } from '@conexus/hub-api'
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
import { ANA } from './src/platform/fixtures.ts'
import { central } from './sweep-replies.ts'

const WIDE_PHONE = { width: 600, height: 900 }
const SIGNED_OUT: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_OUT' }),
}
const SIGNED_IN: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_IN', person: ANA }),
  'GET /api/status': ok(getStatus, {
    version: 'v0.3.0',
    lastStart: { state: 'NONE' },
    previousStart: { state: 'NONE' },
  }),
  'GET /api/companies': ok(listCompanies, {
    companies: [],
    mayOperate: false,
    next: { kind: 'END' },
  }),
}
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
    const page = await open('/', viewport, SIGNED_IN)
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

for (const viewport of [SMALL_PHONE, ZOOMED_PHONE]) {
  test(`a barra do topo cabe numa tela de ${viewport.width}px, com a conta à vista`, async () => {
    const page = await open('/', viewport, SIGNED_IN)
    const account = await page.getByRole('button', { name: 'Conta de Ana Lima' }).boundingBox()
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth)
    assert.deepEqual(
      { scroll, accountEnd: (account?.x ?? 0) + (account?.width ?? 0) <= viewport.width },
      { scroll: viewport.width, accountEnd: true },
    )
    await page.close()
  })
}

test('o Tab passa pela entrada com o foco visível em cada parada: halo nos campos, contorno de 2px no resto', async () => {
  const page = await open('/login', DESKTOP, SIGNED_OUT)
  await page.getByRole('textbox', { name: 'E-mail' }).waitFor()
  assert.deepEqual(await presses(page, 'Tab', 5), [
    'email halo',
    'password halo',
    'Entrar solid 2px',
    'Esqueci minha senha solid 2px',
    'body',
  ])
  await page.close()
})

for (const [viewport, stops] of [
  [DESKTOP, ['Usar tema escuro solid 2px', 'Conta de Ana Lima solid 2px', 'Início solid 2px']],
  [
    PHONE,
    ['Abrir navegação solid 2px', 'Usar tema escuro solid 2px', 'Conta de Ana Lima solid 2px'],
  ],
] as const) {
  test(`o Tab passa pela moldura com contorno de 2px numa tela de ${viewport.width}px`, async () => {
    const page = await open('/', viewport, SIGNED_IN)
    await page.getByRole('button', { name: 'Conta de Ana Lima' }).waitFor()
    assert.deepEqual(await presses(page, 'Tab', 4), [...stops, 'body'])
    await page.close()
  })
}

test('o menu da conta aberto pelo teclado mostra o contorno em Sair do Conexus', async () => {
  const page = await open('/', DESKTOP, SIGNED_IN)
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).focus()
  assert.deepEqual(await presses(page, 'Enter', 1), ['Sair do Conexus solid 2px inside'])
  await page.close()
})

test('a gaveta aberta pelo teclado prende o Tab, com contorno em cada parada', async () => {
  const page = await open('/', PHONE, SIGNED_IN)
  await page.getByRole('button', { name: 'Abrir navegação' }).focus()
  assert.deepEqual(
    [...(await presses(page, 'Enter', 1)), ...(await presses(page, 'Tab', 3))],
    [
      'Início solid 2px inside',
      'Fechar navegação solid 2px inside',
      'Início solid 2px inside',
      'Fechar navegação solid 2px inside',
    ],
  )
  assert.deepEqual(await presses(page, 'Shift+Tab', 2), [
    'Início solid 2px inside',
    'Fechar navegação solid 2px inside',
  ])
  await page.close()
})

test('na gaveta, Início é um link: seguido, muda o endereço, fecha a gaveta e devolve o foco a "Abrir navegação"', async () => {
  const page = await open('/operations/clients/new', PHONE, central('NONE'))
  const opener = page.getByRole('button', { name: 'Abrir navegação' })
  await opener.click()
  await page
    .getByRole('dialog', { name: 'Navegação' })
    .getByRole('link', { name: 'Início' })
    .click()
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 2000 })
  await page.getByRole('heading', { name: 'Suas empresas' }).waitFor()
  assert.equal(new URL(page.url()).pathname, '/')
  assert.equal(await opener.evaluate((button) => button === document.activeElement), true)
  await page.close()
})

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
  const page = await open('/', DESKTOP, SIGNED_IN)
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
  const page = await open('/', PHONE, SIGNED_IN)
  const opener = await iconWidth(page.getByRole('button', { name: 'Abrir navegação' }))
  const theme = await iconWidth(page.getByRole('button', { name: 'Usar tema escuro' }))
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).click()
  const leave = await iconWidth(page.getByRole('menuitem', { name: 'Sair do Conexus' }))
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Navegação' })
  const close = await iconWidth(drawer.getByRole('button', { name: 'Fechar navegação' }))
  const rail = await iconWidth(drawer.getByRole('link', { name: 'Início' }))
  assert.deepEqual(
    { opener, theme, close, leave, rail },
    { opener: 14, theme: 14, close: 14, leave: 16, rail: 18 },
  )
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

test('as peças de chat sob a política do Hub: nenhum erro nem violação, arrastar o divisor incluído', async () => {
  const page = await open('/pieces', DESKTOP, {})
  const handle = page.getByRole('separator', { name: 'Redimensionar' })
  const chat = page.locator('[data-slot=resizable-panel]').last()
  const before = await widthOf(chat)
  const box = await handle.boundingBox()
  assert.ok(box, 'the handle is not laid out')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  assert.ok((await widthOf(chat)) > before + 150, 'dragging the handle did not widen the chat')
  await page.getByRole('tab', { name: 'Projeto' }).click()
  await page.getByRole('button', { name: 'Detalhes' }).click()
  await page.getByRole('button', { name: 'Raciocínio' }).click()
  const level = page.getByRole('slider', { name: 'Raciocínio' })
  assert.equal(await level.getAttribute('aria-valuenow'), '3')
  const track = await page.locator('[data-slot=slider-track]').boundingBox()
  assert.ok(track, 'the slider is not laid out')
  await page.mouse.move(track.x + track.width * 0.75, track.y + track.height / 2)
  await page.mouse.down()
  await page.mouse.move(track.x + track.width * 0.25, track.y + track.height / 2, { steps: 5 })
  await page.mouse.up()
  assert.equal(await level.getAttribute('aria-valuenow'), '1', 'dragging the thumb moved the level')
  await page.keyboard.press('End')
  assert.equal(await level.getAttribute('aria-valuenow'), '4')
  await page.keyboard.press('Escape')
  await page.getByRole('combobox', { name: 'Modelo' }).click()
  await page.getByRole('option', { name: 'Claude Opus 4.5' }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /Leu 3 páginas/ }).click()
  await page.getByRole('button', { name: 'Enviar' }).hover()
  await page.locator('[data-slot=tooltip-content]').waitFor()
  assert.deepEqual(page.problems, [])
  await page.close()
})

for (const [reducedMotion, moves] of [
  ['no-preference', true],
  ['reduce', false],
] as const) {
  test(`a marca trabalhando ${moves ? 'se mexe' : 'fica parada com prefers-reduced-motion'}`, async () => {
    const page = await open('/pieces', DESKTOP, {})
    await page.emulateMedia({ reducedMotion })
    const mark = page.locator('svg[width="48"]')
    const offsets = new Set<string>()
    for (let frame = 0; frame < 6; frame++) {
      offsets.add(
        await mark
          .locator('path')
          .first()
          .evaluate((piece) => getComputedStyle(piece).transform),
      )
      await page.waitForTimeout(150)
    }
    assert.equal(offsets.size > 1, moves)
    await page.close()
  })
}

for (const [reducedMotion, name] of [
  ['no-preference', 'shimmer'],
  ['reduce', 'none'],
] as const) {
  test(`o título de uma linha em curso ${name === 'none' ? 'não brilha com prefers-reduced-motion' : 'brilha'}`, async () => {
    const page = await open('/pieces', DESKTOP, {})
    await page.emulateMedia({ reducedMotion })
    const title = page.locator('[data-status=running] > [data-slot=trace-title]').first()
    assert.equal(await title.evaluate((el) => getComputedStyle(el).animationName), name)
    await page.close()
  })
}
