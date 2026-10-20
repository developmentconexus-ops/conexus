import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { readConversation } from '@conexus/hub-api'
import type { Locator, Page } from 'playwright-core'
import type { Replies } from './layout-harness.ts'
import { createHarness, DESKTOP, focusDrawn, ok, PHONE, ZOOMED_PHONE } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { CONVERSATION_STATES, WITH_CONVERSATIONS } from './sweep-conversation-states.ts'
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
const FIRST = '11111111-1111-4111-8111-111111111111'
const CONVERSATION = `/api/companies/${COMPANY.id}/projects/${PROJECT_ID}/conversations/${FIRST}`
const CHAT = '[data-slot=resizable-panel]:last-of-type'

test('no Projeto a barra da empresa encolhe para ícones e volta ao sair', async () => {
  const page = await open(PROJECT, DESKTOP)
  await page.getByRole('textbox', { name: 'Mensagem para o Builder' }).waitFor()
  const rail = page.getByRole('navigation', { name: 'Navegação' }).locator('..')
  const inProject = await widthOf(rail)
  await page.getByRole('link', { name: 'Projetos' }).click()
  await page.getByRole('heading', { name: 'Projetos' }).waitFor()
  assert.deepEqual([inProject, await widthOf(rail)], [56, 224])
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
  const page = await open(PROJECT, PHONE)
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

// The conversation's screens at the widths a phone reads them: 390px, and 195px for a 200% zoom (design
// V18), in both themes, with no sideways scroll and no console error, which is where a refusal of
// the Hub's policy shows (testing T23). The sweep adds the Tab stops at its own widths.
for (const state of CONVERSATION_STATES) {
  for (const viewport of [PHONE, ZOOMED_PHONE]) {
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

/** Grows the last turn by `lines` paragraphs, as an answer arriving would. */
/** Waits until the conversation shows its end. */
function atEnd(page: Page) {
  return page.waitForFunction(
    () => {
      const el = document.querySelector('[data-slot=message-scroller-viewport]')
      return el !== null && el.scrollHeight - el.scrollTop - el.clientHeight <= 2
    },
    undefined,
    { polling: 50, timeout: 2000 },
  )
}

function grow(page: Page, lines: number) {
  return page.evaluate((count) => {
    const items = document.querySelectorAll(
      '[data-slot=message-scroller-content] > [data-slot=message-scroller-item]',
    )
    for (let line = 0; line < count; line++) {
      const paragraph = document.createElement('p')
      paragraph.textContent = `linha ${line} do que o Builder vai dizendo aos poucos`
      items[items.length - 1]?.append(paragraph)
    }
  }, lines)
}

test('a rolagem da conversa segue o fim enquanto ela cresce; quem subiu não é puxado e volta por "Ir para o fim da conversa"', async () => {
  const page = await open(PROJECT, DESKTOP)
  const scroller = page.getByLabel('Rolagem da conversa')
  await scroller.waitFor()
  const button = page.locator('[data-slot=message-scroller-button]')
  function distance() {
    return scroller.evaluate((el) => Math.round(el.scrollHeight - el.scrollTop - el.clientHeight))
  }
  await grow(page, 40)
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-slot=message-scroller-viewport]')
      return el !== null && el.scrollHeight - el.scrollTop - el.clientHeight <= 2
    },
    undefined,
    { polling: 50 },
  )
  await grow(page, 10)
  await page.waitForTimeout(300)
  assert.ok((await distance()) <= 2, 'the end did not stay in view while the answer grew')
  const box = await scroller.boundingBox()
  assert.ok(box, 'the conversation is not laid out')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(300)
  const top = await scroller.evaluate((el) => el.scrollTop)
  await grow(page, 10)
  await page.waitForTimeout(300)
  assert.deepEqual(
    {
      pulled: Math.abs((await scroller.evaluate((el) => el.scrollTop)) - top) > 1,
      button: await button.getAttribute('data-active'),
    },
    { pulled: false, button: 'true' },
  )
  await button.click()
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-slot=message-scroller-viewport]')
      return el !== null && el.scrollHeight - el.scrollTop - el.clientHeight <= 2
    },
    undefined,
    { polling: 50 },
  )
  assert.equal(await button.getAttribute('data-active'), 'false')
  assert.deepEqual(page.problems, [])
  await page.close()
})

// A wheel or a key that scrolls nothing at the end leaves the person at the end, so the
// answer that arrives next is followed (founder, 2026-10-20: "sem auto scroll").
test('quem gira a roda ou aperta uma tecla para baixo já no fim continua seguindo o fim', async () => {
  const page = await open(PROJECT, DESKTOP)
  const scroller = page.getByLabel('Rolagem da conversa')
  await scroller.waitFor()
  await grow(page, 40)
  await atEnd(page)
  // The scroller's own follow settles before the gesture, as it has when a person reads the end.
  await page.waitForTimeout(300)
  const box = await scroller.boundingBox()
  assert.ok(box, 'the conversation is not laid out')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, 300)
  await page.waitForTimeout(300)
  await grow(page, 10)
  await atEnd(page)
  await page.waitForTimeout(300)
  await scroller.focus()
  await page.keyboard.press('End')
  await page.waitForTimeout(300)
  await grow(page, 10)
  await atEnd(page)
  assert.deepEqual(page.problems, [])
  await page.close()
})

// While an answer grows, the end can sit a few pixels below the view before the scroller's own
// follow lands; a wheel down there still counts as the end, as the scroller's threshold does.
test('quem gira a roda para baixo enquanto a resposta cresce, a poucos pixels do fim, continua seguindo o fim', async () => {
  const page = await open(PROJECT, DESKTOP)
  const scroller = page.getByLabel('Rolagem da conversa')
  await scroller.waitFor()
  await grow(page, 40)
  await atEnd(page)
  await page.waitForTimeout(300)
  await page.evaluate(() => {
    const items = document.querySelectorAll('[data-slot=message-scroller-item]')
    const gap = document.createElement('div')
    gap.style.height = '5px'
    items[items.length - 1]?.append(gap)
    document
      .querySelector('[data-slot=message-scroller-viewport]')
      ?.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }))
  })
  await page.waitForTimeout(300)
  await grow(page, 10)
  await atEnd(page)
  assert.deepEqual(page.problems, [])
  await page.close()
})

// The founder, 2026-10-20 (decision 4): what the person sends takes them to the end, even from
// reading above; and the field they type in shows its focus while the Builder answers (decision 1 B).
test('quem envia lendo mais acima vai para o fim da conversa, e o campo mostra o foco ipê enquanto o Builder responde', async () => {
  const replies: Replies = {
    ...WITH_CONVERSATIONS,
    [`POST ${CONVERSATION}/messages`]: { status: 202 },
  }
  const page = await harness.open(`${PROJECT}/conversations/${FIRST}`, {
    viewport: DESKTOP,
    replies,
  })
  const scroller = page.getByLabel('Rolagem da conversa')
  await scroller.waitFor()
  await grow(page, 40)
  await atEnd(page)
  await page.waitForTimeout(300)
  const box = await scroller.boundingBox()
  assert.ok(box, 'the conversation is not laid out')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(300)
  const read = replies[`GET ${CONVERSATION}`]?.json
  const { conversation } = readConversation.success.body.parse(read)
  replies[`GET ${CONVERSATION}`] = ok(readConversation, {
    conversation: {
      ...conversation,
      messages: [
        ...conversation.messages,
        {
          id: 'm3',
          role: 'person',
          parts: [{ type: 'text', text: 'E o terceiro app?' }],
          model: null,
          createdAt: '2026-10-19T12:02:00.000Z',
        },
      ],
    },
  })
  const field = page.getByRole('textbox', { name: 'Mensagem para o Builder' })
  await field.fill('E o terceiro app?')
  await field.press('Enter')
  await page.getByText('E o terceiro app?', { exact: true }).waitFor()
  await atEnd(page)
  assert.equal(await page.locator('[data-slot=input-group][data-busy]').count(), 1)
  assert.equal(await focusDrawn(page), 'Mensagem para o Builder halo')
  assert.deepEqual(page.problems, [])
  await page.close()
})

// The old Raciocínio pill: each stop sits under the thumb's centre, and the first stop shows no fill.
test('no controle de raciocínio cada parada fica sob o centro do botão, e na primeira não sobra preenchimento', async () => {
  const page = await open(`${PROJECT}/conversations/${FIRST}`, DESKTOP)
  await page.getByRole('combobox', { name: 'Modelo e raciocínio' }).click()
  const thumb = page.locator('[data-slot=slider-thumb]')
  await thumb.waitFor()
  const measured = await page.evaluate(() => {
    function centre(element: Element | null | undefined) {
      const box = element?.getBoundingClientRect()
      return box === undefined ? Number.NaN : box.left + box.width / 2
    }
    const thumb = document.querySelector('[data-slot=slider-thumb]')
    const dots = document.querySelectorAll('[data-slot=slider-track] span[class*="rounded-pill"]')
    const fill = document.querySelector('[data-slot=slider-range]')
    return {
      offset: Math.round(Math.abs(centre(thumb) - centre(dots[0]))),
      fill: fill === null ? 'none' : getComputedStyle(fill).visibility,
    }
  })
  assert.deepEqual(measured, { offset: 0, fill: 'hidden' })
  assert.deepEqual(page.problems, [])
  await page.close()
})

// The founder, 2026-10-20: the composer read faded and its frame and the title's thick, square.
// A disabled Enviar dimmed the whole group, and the 2px outline sat on the field inside the frame.
test('o compositor vazio não esmaece; o foco do compositor e do título é a borda ipê de cada um, sem contorno por fora', async () => {
  const page = await open(PROJECT, DESKTOP)
  const field = page.getByRole('textbox', { name: 'Mensagem para o Builder' })
  function frame(locator: Locator) {
    return locator.evaluate((element) => {
      const group = getComputedStyle(element.closest('[data-slot=input-group]') ?? element)
      return { opacity: group.opacity, radius: group.borderTopLeftRadius }
    })
  }
  assert.equal(await page.getByRole('button', { name: 'Enviar' }).isDisabled(), true)
  await field.focus()
  assert.deepEqual(
    { ...(await frame(field)), focus: await focusDrawn(page) },
    { opacity: '1', radius: '16px', focus: 'Mensagem para o Builder halo' },
  )
  const title = page.getByRole('combobox', { name: 'Conversas' })
  await title.focus()
  assert.deepEqual(
    { ...(await frame(title)), focus: (await focusDrawn(page)).replace(/^.* (\S+)$/, '$1') },
    { opacity: '1', radius: '6px', focus: 'halo' },
  )
  assert.deepEqual(page.problems, [])
  await page.close()
})
