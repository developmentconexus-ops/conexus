import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { Locator } from 'playwright-core'
import { createHarness, DESKTOP, PHONE, SMALL_PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { CONVERSATION_STATES, WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
import { PROJECT_STATES } from './sweep-project-states.ts'
import { PROJECT_ID } from './sweep-replies.ts'

// The Projeto's two regions, measured in the browser: jsdom computes no widths (testing T23).
const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string, viewport: typeof DESKTOP) {
  return harness.open(path, { viewport, replies: WITH_CONVERSATIONS })
}

async function widthOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox()
  assert.ok(box, 'the element is not laid out')
  return box.width
}

const PROJECT = `/companies/${COMPANY.id}/projects/${PROJECT_ID}`
const CHAT = '[data-slot=resizable-panel]:last-of-type'

test('no Projeto a barra do Projeto fica aberta e a da empresa volta ao sair', async () => {
  const page = await open(PROJECT, DESKTOP)
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).waitFor()
  const nav = page.getByRole('navigation', { name: 'Navegação' })
  await page.waitForTimeout(250)
  const inProject = await widthOf(nav)
  await nav.getByRole('link').first().click()
  await page.getByRole('heading', { name: 'O que vamos construir?' }).waitFor()
  await page.waitForTimeout(250)
  assert.deepEqual([inProject, await widthOf(nav)], [256, 256])
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('o divisor da conversa: 380px, arrastado vale de 320px a 60%, e a página lembra', async () => {
  const page = await open(PROJECT, DESKTOP)
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).waitFor()
  const chat = page.locator(CHAT)
  const handle = page.getByRole('separator', { name: 'Redimensionar a conversa' })
  async function dragBy(dx: number) {
    const box = await handle.boundingBox()
    assert.ok(box, 'the divider is not laid out')
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + box.width / 2, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + dx, y, { steps: 5 })
    await page.mouse.up()
    return Math.round(await widthOf(chat))
  }
  const group = await widthOf(page.locator('[data-slot=resizable-panel-group]'))
  const start = Math.round(await widthOf(chat))
  const wide = await dragBy(-200)
  const widest = await dragBy(-1000)
  await page.reload()
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).waitFor()
  const remembered = Math.round(await widthOf(chat))
  const narrowest = await dragBy(1500)
  assert.deepEqual(
    { start, wider: wide > start + 150, widest: widest <= group * 0.6 + 1, remembered, narrowest },
    { start: 380, wider: true, widest: true, remembered: widest, narrowest: 320 },
  )
  assert.deepEqual(page.problems, [])
  await page.close()
})

test('no celular, "App | Conversa" troca de região sem perder o rascunho nem a rolagem', async () => {
  // The chat is short enough that the transcript scrolls only in a low window.
  const page = await open(PROJECT, { ...PHONE, height: 320 })
  await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  const field = page.getByRole('textbox', { name: 'Mensagem para o Builder' })
  await field.fill('meio da frase')
  const body = page.locator(`${CHAT} .overflow-y-auto`)
  await body.evaluate((element) => {
    element.scrollTop = 120
  })
  const scrolled = await body.evaluate((element) => element.scrollTop)
  await page.getByRole('button', { name: 'App', exact: true }).click()
  const hidden = await field.isVisible()
  await page.getByRole('button', { name: 'Conversa', exact: true }).click()
  assert.deepEqual(
    { hidden, draft: await field.inputValue(), scroll: await body.evaluate((e) => e.scrollTop) },
    { hidden: false, draft: 'meio da frase', scroll: scrolled },
  )
  assert.ok(scrolled > 0, 'the conversation did not scroll in the test')
  assert.deepEqual(page.problems, [])
  await page.close()
})

function iconsOf(row: Locator) {
  return row.evaluate((element) => {
    const [chevron, closed, opened] = [...element.querySelectorAll('svg')].map((icon) =>
      getComputedStyle(icon),
    )
    return { rotate: chevron?.rotate, closed: closed?.display, opened: opened?.display }
  })
}

const TREE = PROJECT_STATES.find((each) => each.name === 'Projeto, Código com a árvore')

async function openCode(scheme: 'light' | 'dark' = 'light') {
  assert.ok(TREE, 'the sweep lacks the Código state')
  const page = await harness.open(TREE.path, {
    viewport: DESKTOP,
    replies: TREE.replies,
    scheme,
  })
  await TREE.settle(page)
  return page
}

test('uma pasta dentro de outra aberta fecha sozinha: a seta e o ícone seguem o estado, no clique e no teclado', async () => {
  const page = await openCode()
  const outer = page.getByRole('treeitem', { name: 'src', exact: true })
  const inner = page.getByRole('treeitem', { name: 'pages', exact: true })
  const OPEN = { rotate: '90deg', closed: 'none', opened: 'block' }
  const SHUT = { rotate: 'none', closed: 'block', opened: 'none' }
  assert.deepEqual([await iconsOf(outer), await iconsOf(inner)], [OPEN, OPEN])
  await inner.click()
  assert.deepEqual([await iconsOf(outer), await iconsOf(inner)], [OPEN, SHUT])
  await inner.focus()
  await page.keyboard.press('ArrowRight')
  assert.deepEqual(await iconsOf(inner), OPEN)
  await page.keyboard.press('ArrowLeft')
  assert.deepEqual([await iconsOf(outer), await iconsOf(inner)], [OPEN, SHUT])
  await page.close()
})

for (const [scheme, keyword] of [
  ['light', 'rgb(207, 34, 46)'],
  ['dark', 'rgb(255, 123, 114)'],
] as const) {
  test(`um .tsx aberto pinta palavras, textos, comentários e funções com os tokens, tema ${scheme}`, async () => {
    const page = await openCode(scheme)
    const line = page.locator('[data-slot=code-block-line-content]').nth(2)
    await line.locator('.text-code-keyword').first().waitFor()
    const colours = await page
      .locator('[data-slot=code-block-content] [class*=text-code-]')
      .evaluateAll((spans) =>
        Object.fromEntries(
          spans.map((span) => [
            [...span.classList].find((name) => name.startsWith('text-code-')),
            getComputedStyle(span).color,
          ]),
        ),
      )
    assert.equal(colours['text-code-keyword'], keyword)
    for (const name of ['expression', 'comment', 'function']) {
      assert.ok(colours[`text-code-${name}`], `no ${name} was painted`)
    }
    assert.equal(new Set(Object.values(colours)).size, Object.keys(colours).length)
    assert.deepEqual(page.problems, [])
    await page.close()
  })
}

test('os números de linha não entram na seleção, na cópia nem na árvore de acessibilidade', async () => {
  const page = await openCode()
  const code = page.locator('[data-slot=code-block-content]')
  await code.locator('.text-code-keyword').first().waitFor()
  const text = await code.innerText()
  assert.ok(!/^\d+$/m.test(text), 'a line number is in the text')
  assert.match(text, /export const encomendas/)
  // The accessibility tree under the code: no text of its own may be only a line number.
  const session = await page.context().newCDPSession(page)
  const { root } = await session.send('DOM.getDocument')
  const { nodeId } = await session.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: '[data-slot=code-block-content]',
  })
  const { node } = await session.send('DOM.describeNode', { nodeId })
  const { nodes } = await session.send('Accessibility.getFullAXTree')
  const byId = new Map(nodes.map((each) => [each.nodeId, each]))
  function under(each: (typeof nodes)[number]): boolean {
    if (each.backendDOMNodeId === node.backendNodeId) return true
    const parent = each.parentId === undefined ? undefined : byId.get(each.parentId)
    return parent !== undefined && under(parent)
  }
  const digits = nodes.filter(
    (each) =>
      each.role?.value === 'StaticText' && /^\d+$/.test(each.name?.value ?? '') && under(each),
  )
  assert.deepEqual(digits, [])
  await page.close()
})

// The conversation's screens at the widths a phone reads them: 390px, 320px, and 195px for a 200% zoom (design
// V18), in both themes, with no sideways scroll and no console error, which is where a refusal of
// the Hub's policy shows (testing T23). The sweep adds the Tab stops at its own widths.
for (const state of CONVERSATION_STATES) {
  for (const viewport of [PHONE, SMALL_PHONE, ZOOMED_PHONE]) {
    for (const scheme of ['light', 'dark'] as const) {
      test(`${state.name}, ${viewport.width}px, tema ${scheme}: sem rolagem lateral nem erro no console`, async () => {
        const page = await harness.open(state.path, { viewport, replies: state.replies, scheme })
        await state.settle(page)
        const { scroll, inner } = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          inner: window.innerWidth,
        }))
        assert.ok(scroll <= inner, `the page scrolls sideways: ${scroll}px in ${inner}px`)
        assert.deepEqual(page.problems, [])
        await page.close()
      })
    }
  }
}

// A tool row's sentence names what the Builder did; the query beside it is the part that gives way.
for (const viewport of [DESKTOP, PHONE]) {
  test(`${viewport.width}px: a linha de uma ferramenta nunca corta a frase, só o que vem ao lado dela`, async () => {
    const state = CONVERSATION_STATES.find((each) => each.name.includes('ferramentas abertas'))
    assert.ok(state, 'the sweep lacks the conversation state')
    const page = await harness.open(state.path, { viewport, replies: state.replies })
    await state.settle(page)
    const rows = await page
      .locator('[data-slot=trace-line]:has([data-slot=trace-description])')
      .all()
    assert.ok(rows.length >= 4, 'the conversation shows no tool rows')
    for (const row of rows) {
      const [title, detail] = await Promise.all(
        ['trace-title', 'trace-description'].map((slot) =>
          row.locator(`[data-slot=${slot}]`).evaluate((el) => ({
            text: el.textContent,
            clipped: el.scrollWidth > el.clientWidth,
            width: Math.round(el.getBoundingClientRect().width),
          })),
        ),
      )
      assert.ok(title && detail, 'a tool row lacks its sentence or its detail')
      assert.equal(title.clipped, false, `"${title.text}" is cut at ${viewport.width}px`)
      assert.ok(detail.width >= 48, `"${detail.text}" has no room beside "${title.text}"`)
    }
    assert.deepEqual(page.problems, [])
    await page.close()
  })
}
