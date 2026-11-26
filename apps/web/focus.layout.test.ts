import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { getSession } from '@conexus/hub-api'
import type { Page } from 'playwright-core'
import { atRest } from './at-rest.ts'
import type { Replies, Viewport } from './layout-harness.ts'
import { createHarness, DESKTOP, focusDrawn, ok, PHONE, presses } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { CARD_STATES } from './sweep-card-states.ts'
import { central, companies, OWNER, projectsPage, startsOn } from './sweep-replies.ts'

const SIGNED_OUT: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_OUT' }),
}
const HOUSE = companies([{ name: 'Empresa Teste', role: 'owner' }], false)

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string, viewport: Viewport, replies: Replies) {
  return harness.open(path, { viewport, replies })
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

test('o contorno não vai ao título focado pelo programa', async () => {
  const page = await open('/', DESKTOP, HOUSE)
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).waitFor()
  await page.keyboard.press('Tab')
  const outlines = await page.evaluate(() => {
    const title = document.querySelector<HTMLElement>('main h1')
    if (!title) throw new Error('the page has no title')
    const keyboard = getComputedStyle(document.activeElement ?? document.body).outlineStyle
    title.tabIndex = -1
    title.focus()
    return {
      keyboard,
      title: getComputedStyle(title).outlineStyle,
      focused: document.activeElement === title,
    }
  })
  assert.deepEqual(outlines, { keyboard: 'solid', title: 'none', focused: true })
  await page.close()
})

// The owner's sidebar: the rail from the top (places, Configurações, the bell, the account) and then the list. On a phone the drawer holds the same, and the bell is in it.
const RAIL_STOPS = [
  'Início',
  'Projetos',
  'Integrações',
  'Automações',
  'Agentes',
  'Dados',
  'Configurações',
  'Notificações',
  'Conta de Ana Lima',
]
const LIST_STOPS = ['Nova conversa']
const NAV = [...RAIL_STOPS, ...LIST_STOPS]
const RAIL = NAV.map((name) => `${name} solid 2px`)
const DRAWER = RAIL

test('o Tab passa pela barra com contorno de 2px numa tela de 1366px, antes do conteúdo', async () => {
  const page = await open('/', DESKTOP, HOUSE)
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).waitFor()
  assert.deepEqual(await presses(page, 'Tab', RAIL.length), RAIL)
  await page.close()
})

test('numa tela de 390px o Tab começa em Abrir navegação e não entra na gaveta fechada', async () => {
  const page = await open('/', PHONE, HOUSE)
  await page.getByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite)/ }).waitFor()
  // The owner's Início opens with the preparation card, whose Continuar is the first of the content.
  // The card is not shown while its reads load, so Tab waits for it.
  await page.getByRole('link', { name: 'Continuar' }).waitFor()
  assert.deepEqual(await presses(page, 'Tab', 2), [
    'Abrir navegação solid 2px',
    'Continuar solid 2px',
  ])
  await page.close()
})

test('o menu da conta aberto pelo teclado mostra o contorno no primeiro item', async () => {
  const page = await open('/', DESKTOP, HOUSE)
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).focus()
  assert.deepEqual(await presses(page, 'Enter', 1), ['Claro solid 2px inside'])
  await page.close()
})

test('a gaveta aberta pelo teclado prende o Tab, com contorno em cada parada', async () => {
  const page = await open('/', PHONE, HOUSE)
  await page.getByRole('button', { name: 'Abrir navegação' }).focus()
  assert.deepEqual(
    [...(await presses(page, 'Enter', 1)), ...(await presses(page, 'Tab', NAV.length + 1))],
    [...DRAWER, 'Fechar navegação solid 2px', 'Início solid 2px'].map((stop) => `${stop} inside`),
  )
  await page.close()
})

test('na gaveta, Estado do Hub é um link: seguido, muda o endereço, fecha a gaveta e devolve o foco a "Abrir navegação"', async () => {
  const page = await open('/operations/clients/new', PHONE, central('NONE'))
  const opener = page.getByRole('button', { name: 'Abrir navegação' })
  await opener.click()
  await page
    .getByRole('dialog', { name: 'Navegação' })
    .getByRole('link', { name: 'Estado do Hub' })
    .click()
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 2000 })
  await page.getByRole('heading', { name: 'Estado do Hub' }).waitFor()
  assert.equal(new URL(page.url()).pathname, '/operations/status')
  assert.equal(await opener.evaluate((button) => button === document.activeElement), true)
  await page.close()
})

function fillOf(page: Page) {
  return page
    .getByRole('button', { name: 'Enviar' })
    .evaluate((one) => getComputedStyle(one).backgroundImage)
}

test('o dourado: o enviar é o ipê aceso, parado e sob o mouse', async () => {
  const page = await open('/', DESKTOP, { ...HOUSE, ...startsOn('0'.repeat(32)) })
  const box = page.getByRole('textbox', { name: 'Mensagem para o Conexus' })
  await box.fill('Como foram as vendas?')
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLButtonElement>('button[aria-label=Enviar]')?.disabled === false,
  )
  const rest = await fillOf(page)
  assert.equal(rest, 'linear-gradient(135deg, rgb(245, 171, 14), rgb(255, 212, 69))')
  await page.getByRole('button', { name: 'Enviar' }).hover()
  await atRest(page)
  const hovered = await fillOf(page)
  assert.match(hovered, /^linear-gradient\(135deg, /)
  assert.notEqual(hovered, rest, 'the lit send does not answer the pointer')
  await page.close()
})

// The outline, and the edge a field shows instead (design V28).
const FOCUS = {
  light: { outline: 'rgb(29, 29, 29)', edge: 'rgb(176, 122, 12)' },
  dark: { outline: 'rgb(255, 215, 102)', edge: 'rgb(242, 181, 58)' },
}

test('o foco é visível em toda peça da vitrine: contorno de tinta no claro e de ipê no escuro, a borda nos campos', async () => {
  const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {} })
  for (const band of ['light', 'dark'] as const) {
    const drawn = await page
      .locator(`[data-band=${band}] [data-preview~=focus]`)
      .evaluateAll((all) =>
        all.map((piece) => {
          const style = getComputedStyle(piece)
          const slot = piece.getAttribute('data-slot') ?? piece.tagName.toLowerCase()
          return style.outlineColor === 'rgba(0, 0, 0, 0)'
            ? `${slot} edge ${style.borderTopColor} ${style.boxShadow === 'none' ? 'no halo' : 'halo'}`
            : `${slot} ${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`
        }),
      )
    assert.ok(drawn.length > 0, `${band}: the showcase pins no focus`)
    const unseen = drawn.filter(
      (one) =>
        !one.endsWith(` solid 2px ${FOCUS[band].outline}`) &&
        !one.endsWith(` edge ${FOCUS[band].edge} halo`),
    )
    assert.deepEqual(unseen, [], `${band}: a piece's focus is not drawn in the theme's colour`)
  }
  await page.close()
})

// The slider's handle wraps the input that takes the focus, so the showcase cannot pin its state.
test('o deslizante focado pelo teclado desenha o contorno do tema na alça', async () => {
  const page = await harness.open('/pieces', { viewport: DESKTOP, replies: {} })
  for (const band of ['light', 'dark'] as const) {
    const handle = page
      .locator(`[data-file="slider.tsx"] [data-band=${band}] [data-slot=slider-thumb]`)
      .first()
    await handle.locator('input').focus()
    await page.keyboard.press('ArrowRight')
    const style = await handle.evaluate((one) => {
      const drawn = getComputedStyle(one)
      return `${drawn.outlineStyle} ${drawn.outlineWidth} ${drawn.outlineColor}`
    })
    assert.equal(style, `solid 2px ${FOCUS[band].outline}`, band)
  }
  await page.close()
})

// Step 13.3, U9 (criterion 28): the free answer of a question is the `Textarea` of `ui/`: focus on its own edge (V28), and it grows with its lines (#272).
test('a resposta livre: o foco na própria borda e a caixa cresce em várias linhas, em 1366 e 390', async () => {
  const [state] = CARD_STATES
  if (!state) throw new Error('the card sweep has no state')
  for (const viewport of [DESKTOP, PHONE]) {
    const page = await open(state.path, viewport, state.replies)
    await state.settle(page)
    const other = page.getByRole('textbox', { name: 'Outra resposta' })
    await other.scrollIntoViewIfNeeded()
    await other.focus()
    assert.match(
      await focusDrawn(page),
      /halo$/,
      `focus is not on the field's edge at ${viewport.width}`,
    )
    const one = await other.evaluate((el) => el.getBoundingClientRect().height)
    await other.fill('Linha 1\nLinha 2\nLinha 3\nLinha 4')
    const four = await other.evaluate((el) => el.getBoundingClientRect().height)
    assert.ok(
      four > one + 20,
      `the field kept ${one}px with four lines (${four}px) at ${viewport.width}`,
    )
    await page.close()
  }
})

// Step 13.3, U9: the Card around a Project's link must not clip the link's 2px outline (design V28).
for (const viewport of [DESKTOP, PHONE]) {
  test(`o cartão de Projeto focado pelo teclado mostra o contorno inteiro, em ${viewport.width}px`, async () => {
    const page = await open(`/companies/${COMPANY.id}/projects`, viewport, {
      ...OWNER,
      ...projectsPage(COMPANY.id),
    })
    const link = page.getByRole('main').getByRole('link').first()
    await link.waitFor()
    await link.focus()
    assert.match(await focusDrawn(page), /solid 2px$/)
    const clipped = await link.evaluate((el) => {
      const style = getComputedStyle(el)
      const reach = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset)
      const box = el.getBoundingClientRect()
      const clippers: string[] = []
      for (let up = el.parentElement; up; up = up.parentElement) {
        if (getComputedStyle(up).overflow === 'visible') continue
        const area = up.getBoundingClientRect()
        const border = Number.parseFloat(getComputedStyle(up).borderTopWidth)
        const inside =
          box.left - reach >= area.left + border &&
          box.right + reach <= area.right - border &&
          box.top - reach >= area.top + border &&
          box.bottom + reach <= area.bottom - border
        if (!inside) clippers.push(up.tagName)
      }
      return clippers
    })
    assert.deepEqual(clipped, [], 'an ancestor clips the focused link outline')
    await page.close()
  })
}
