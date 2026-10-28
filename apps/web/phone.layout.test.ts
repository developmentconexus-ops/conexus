import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator, Page } from 'playwright-core'
import type { Viewport } from './layout-harness.ts'
import { createHarness, PHONE, reachOf, SMALL_PHONE, stolenBy, touching } from './layout-harness.ts'
import { ACCOUNT_STATES, LONG_WORD } from './sweep-accounts-states.ts'
import { CONVERSATION_STATES } from './sweep-conversation-states.ts'
import { PREVIEW_STATES } from './sweep-preview-states.ts'
import { LONG_TREE } from './sweep-project-states.ts'
import { PROJECT_NAME } from './sweep-replies.ts'

// The phone's new screens at 390px and 320px: the two-row top of a Projeto in App and its one bar in Conversa, the conversation sheet
// and the model sheet (design V18, testing T23). layout.test.ts holds the frame's own widths.
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function conversationState(part: string) {
  const state = CONVERSATION_STATES.find((each) => each.name.includes(part))
  assert.ok(state, `the sweep lacks the state "${part}"`)
  return state
}

async function inside(locator: Locator, viewport: Viewport) {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  )
}

const SHEETS: [string, (page: Page) => Locator][] = [
  ['a caixa de conversas aberta', (page) => page.getByRole('dialog', { name: 'Conversas' })],
  ['o seletor de modelo e raciocínio', (page) => page.locator('[data-slot=combobox-content]')],
]

for (const viewport of [PHONE, SMALL_PHONE]) {
  test(`o topo de um Projeto é uma barra só: Abrir navegação, o título e App | Conversa, numa linha de ${viewport.width}px`, async () => {
    const state = conversationState('Prévia vazia com a conversa mais recente')
    const page = await harness.open(state.path, { viewport, replies: state.replies })
    await state.settle(page)
    const [opener, title, toggle] = await Promise.all(
      [
        page.getByRole('button', { name: 'Abrir navegação' }),
        page.locator('[data-slot=drawer-trigger]'),
        page.getByRole('group', { name: 'Parte do Projeto' }),
      ].map((each) => each.boundingBox()),
    )
    assert.ok(opener && title && toggle, 'the top line lacks one of its three parts')
    for (const part of [title, toggle]) {
      const apart = Math.abs(part.y + part.height / 2 - (opener.y + opener.height / 2))
      assert.ok(apart <= 2, 'the top line breaks into two rows')
    }
    assert.ok(opener.x + opener.width <= title.x, 'the title overlaps the opener')
    assert.ok(title.x + title.width <= toggle.x, 'the toggle overlaps the title')
    assert.ok(toggle.x + toggle.width <= viewport.width, 'the toggle leaves the screen')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    await page.close()
  })

  for (const [part, sheet] of SHEETS) {
    test(`${part} cabe inteira numa tela de ${viewport.width}px`, async () => {
      const state = conversationState(part)
      const page = await harness.open(state.path, { viewport, replies: state.replies })
      await state.settle(page)
      // Measured after the slide-in, which starts the sheet below the screen.
      await sheet(page).evaluate((open) =>
        Promise.all(open.getAnimations().map((slide) => slide.finished)),
      )
      assert.ok(await inside(sheet(page), viewport), `it leaves the ${viewport.width}px screen`)
      await page.close()
    })
  }
}

/** The scrollers a finger could pan sideways: a touch area that reaches past a screen's edge widens one. */
function scrollsSideways(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((one) => ['auto', 'scroll'].includes(getComputedStyle(one).overflowX))
      .filter((one) => one.scrollWidth > one.clientWidth)
      .map((one) => `${one.tagName} ${one.scrollWidth}/${one.clientWidth}`),
  )
}

for (const viewport of [PHONE, SMALL_PHONE]) {
  test(`o topo do App tem duas linhas, o nome do Projeto e os ícones de 32 desenhados e 44 de toque, em ${viewport.width}px`, async () => {
    const state = PREVIEW_STATES.find((each) => each.name === 'Projeto, Prévia com o app')
    assert.ok(state, 'the sweep lacks the Prévia state')
    const page = await harness.open(state.path, { viewport, replies: state.replies })
    await state.settle(page)
    const [name, toggle, tabs, reload, open] = await Promise.all(
      [
        page.getByText(PROJECT_NAME, { exact: true }).locator('visible=true'),
        page.getByRole('group', { name: 'Parte do Projeto' }),
        page.getByRole('tablist', { name: 'Projeto' }),
        page.getByRole('button', { name: 'Recarregar', exact: true }),
        page.getByRole('link', { name: 'Abrir app', exact: true }),
      ].map((each) => each.boundingBox()),
    )
    assert.ok(name && toggle && tabs && reload && open, 'the top lacks one of its parts')
    assert.ok(Math.abs(name.y - toggle.y) < toggle.height, 'the name and the toggle share a row')
    assert.ok(tabs.y >= toggle.y + toggle.height, 'the tabs sit below the top bar')
    for (const icon of [reload, open]) {
      assert.deepEqual([icon.width, icon.height], [32, 32])
      assert.ok(Math.abs(icon.y - tabs.y) < tabs.height, 'the icons share the row of the tabs')
    }
    assert.ok(reload.x + reload.width <= open.x, 'Recarregar comes before Abrir app')
    const glyphs = await Promise.all(
      [
        page.getByRole('button', { name: 'Recarregar', exact: true }),
        page.getByRole('link', { name: 'Abrir app', exact: true }),
      ].map((each) => each.locator('svg').evaluate((icon) => icon.getBoundingClientRect().width)),
    )
    assert.deepEqual(glyphs, [14, 14], 'the two icons differ in size')
    await touching(page)
    // The bar is as high as the icons and sits inside a scroller, which clips the top 6 px of their
    // touch area (the card's "Parar se"); the bottom and the sides reach 44, and no neighbour's
    // area covers a drawn icon.
    for (const icon of [
      page.getByRole('button', { name: 'Recarregar', exact: true }),
      page.getByRole('link', { name: 'Abrir app', exact: true }),
    ]) {
      const reach = await reachOf(icon)
      assert.ok(Math.min(reach.down, reach.left, reach.right) >= 6, JSON.stringify(reach))
      assert.deepEqual(await stolenBy(icon), [], 'a neighbour covers the icon')
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    assert.deepEqual(await scrollsSideways(page), [], 'under touch, something scrolls sideways')
    assert.equal((await page.getByRole('heading', { level: 1 }).count()) > 0, true)
    assert.equal(await page.getByRole('heading', { level: 1 }).locator('visible=true').count(), 1)
    assert.ok(open.x + open.width <= viewport.width, 'Abrir app leaves the screen')
    const header = await page.getByRole('tablist', { name: 'Projeto' }).evaluate((list) => {
      const row = list.parentElement?.getBoundingClientRect()
      return row ? Math.round(row.bottom) : 0
    })
    if (viewport === PHONE) assert.equal(header, 89, 'the top of the Projeto is not two rows')
    const pressed = await page
      .getByRole('group', { name: 'Parte do Projeto' })
      .getByRole('button', { name: 'App', exact: true })
      .boundingBox()
    assert.ok(pressed, 'the pressed half is not laid out')
    assert.equal(pressed.x - toggle.x, 4, 'the toggle lost its inset')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    await page.close()
  })
}

const THEMES = [
  { system: 'light', pick: undefined, shown: 'light' },
  { system: 'dark', pick: undefined, shown: 'dark' },
  { system: 'light', pick: 'dark', shown: 'dark' },
  { system: 'dark', pick: 'light', shown: 'light' },
] as const

for (const { system, pick, shown } of THEMES) {
  const how =
    pick === undefined ? `do sistema (${system})` : `escolhido (${pick}) sobre o sistema ${system}`
  test(`o App | Conversa pressionado é ${shown === 'dark' ? 'dourado (Ipê)' : 'a superfície'} no tema ${how}`, async () => {
    const state = conversationState('Prévia vazia com a conversa mais recente')
    const page = await harness.open(state.path, {
      viewport: PHONE,
      replies: state.replies,
      scheme: system,
    })
    if (pick !== undefined) {
      await page.evaluate((chosen) => localStorage.setItem('conexus-theme', chosen), pick)
      await page.reload()
    }
    const pressed = page
      .getByRole('group', { name: 'Parte do Projeto' })
      .getByRole('button', { name: 'App', exact: true })
    await pressed.waitFor()
    const [paint, ink, token] = await Promise.all([
      pressed.evaluate((item) => getComputedStyle(item).backgroundColor),
      pressed.evaluate((item) => getComputedStyle(item).color),
      page.evaluate(
        ([background, text]) => {
          const probe = document.createElement('div')
          probe.style.backgroundColor = `var(${background})`
          probe.style.color = `var(${text})`
          document.body.append(probe)
          const { backgroundColor, color } = getComputedStyle(probe)
          probe.remove()
          return { background: backgroundColor, text: color }
        },
        shown === 'dark'
          ? ['--color-accent', '--color-on-ink']
          : ['--color-surface', '--color-text'],
      ),
    ])
    assert.equal(paint, token.background)
    assert.equal(ink, token.text)
    await page.close()
  })
}

test('a lista longa do Sheet rola até o fim, e o botão de fechar diz "Fechar arquivos"', async () => {
  const page = await harness.open(LONG_TREE.path, { viewport: PHONE, replies: LONG_TREE.replies })
  await LONG_TREE.settle(page)
  const sheet = page.getByRole('dialog', { name: 'Arquivos do app' })
  await sheet.getByRole('button', { name: 'Fechar arquivos' }).waitFor()
  const last = sheet.getByRole('treeitem', { name: 'peca-50.tsx' })
  await last.scrollIntoViewIfNeeded()
  assert.ok(await inside(last, PHONE), 'the last row stays out of the screen')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), PHONE.width)
  await last.click()
  await sheet.waitFor({ state: 'hidden' })
  await page.close()
})

test('o toque pega 44 px sem desenhar 44', async () => {
  function buttons(page: Page) {
    return [
      [page.getByRole('button', { name: 'Padrão', exact: true }), 6],
      [page.getByRole('button', { name: 'Ícone', exact: true }), 6],
      [page.getByRole('button', { name: 'Ícone pequeno', exact: true }), 8],
    ] as const
  }
  const page = await harness.open('/pieces', { viewport: PHONE, replies: {} })
  for (const [button] of buttons(page)) {
    const reach = await reachOf(button)
    assert.deepEqual([reach.up, reach.down], [0, 0], 'a press 1 px outside the drawn box hits it')
  }
  await touching(page)
  for (const [button, outside] of buttons(page)) {
    const reach = await reachOf(button)
    assert.ok(reach.up >= outside && reach.down >= outside, `the touch reaches ${outside} px`)
  }
  await page.close()
})

for (const viewport of [PHONE, SMALL_PHONE]) {
  test(`Contas de modelo no celular: ainda é tabela, as setas vão ao …, e um nome sem espaço quebra, em ${viewport.width}px`, async () => {
    const state = ACCOUNT_STATES.find((each) => each.name.includes('tabela do dono'))
    assert.ok(state, 'the sweep lacks the accounts state')
    const page = await harness.open(state.path, { viewport, replies: state.replies })
    await state.settle(page)
    const client = await page.context().newCDPSession(page)
    const { nodes } = await client.send('Accessibility.getFullAXTree')
    const roles = new Set(nodes.map((node) => node.role?.value))
    for (const role of ['table', 'row', 'cell'])
      assert.ok(roles.has(role), `the accessibility tree lacks "${role}"`)
    const displays = await page
      .locator('tr')
      .evaluateAll((rows) => rows.map((row) => getComputedStyle(row).display))
    assert.deepEqual([...new Set(displays)], ['table-row'], 'a row left the table display')
    assert.equal(await page.getByRole('button', { name: 'Subir Claude reserva' }).count(), 0)
    await page.getByRole('button', { name: 'Mais ações para Claude reserva' }).click()
    await page.getByRole('menuitem', { name: 'Subir' }).waitFor()
    await page.getByRole('menuitem', { name: 'Descer' }).waitFor()
    await page.keyboard.press('Escape')
    const word = await page.getByText(LONG_WORD, { exact: true }).boundingBox()
    assert.ok(word && word.x + word.width <= viewport.width, 'the long name leaves the screen')
    for (const menu of await page.getByRole('button', { name: /^Mais ações para / }).all()) {
      const box = await menu.boundingBox()
      assert.ok(box && box.x >= 0 && box.x + box.width <= viewport.width, 'a "…" leaves the screen')
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width)
    await page.close()
  })
}
