import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  ANA,
  ANSWER,
  ANSWER_HEAD,
  ask,
  chooseDefaultModel,
  DIEGO,
  KEYS,
  pickLevel,
  plantJourney,
  plantTwoCompanies,
  publicPage,
  SECOND_ANSWER,
  SECOND_MODEL,
  saving,
  transcriptShowed,
  turnOnSwitch,
} from './conversation-journey.ts'
import { anotherPage, hubWindow, openConversation } from './hub-window.ts'
import { createProject, liveHub, openProject, waitForHome } from './live-hub.ts'
import { enter, linkKey, queueRows, rowsText } from './model-accounts-journey.ts'

// Step 12's journey in Chromium, on a real Hub and the providers' doubles. Ana has two windows,
// one on the conversation and one on the company's accounts, as the owner of Empresa A has: the
// answer comes with the page read and a title; a refused key, a paused account and the end of the
// queue are said in the conversation; the automatic switch goes on with the second model and the
// next question tries Claude again; Diego, in the same company or in another, finds nothing of hers.
const EXHAUSTED =
  'As contas Anthropic que você pode usar estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.'
// The last account lost says why (a key refused), instead of the generic line.
const REFUSED = 'Time 3 foi recusada. Ligue de novo.'
const NOT_FOUND = 'Não encontramos o que você procurou.'
const TITLE = 'Apps de encomenda de padaria'

/** The owner's setup page: three keys, the default model, and the Projeto "Encomendas". */
async function setUp(owner: Page, companyA: string) {
  await enter(owner, ANA.email, `/companies/${companyA}/settings/model-accounts`)
  await owner.getByText('Nenhuma conta ligada').waitFor()
  await linkKey(owner, 'Time 1', KEYS.first)
  await owner.getByText('Time 1 · chave …aB1c · ligada').first().waitFor()
  await linkKey(owner, 'Time 3', KEYS.refused)
  await owner.getByText('Time 3 · chave …dE2f · ligada').first().waitFor()
  await linkKey(owner, 'Groq 1', KEYS.groq, 'Groq')
  await owner.getByText('Groq 1 · chave …gH3i · ligada').first().waitFor()
  await chooseDefaultModel(owner, companyA)
  await owner.goto(`${TEST_ORIGIN}/companies/${companyA}`)
  await waitForHome(owner)
  await createProject(owner, 'Encomendas')
  await owner.getByRole('heading', { name: 'Encomendas', exact: true }).waitFor()
}

async function openConversations(page: Page, companyA: string) {
  await page.goto(`${TEST_ORIGIN}/companies/${companyA}`)
  await openProject(page, 'Encomendas')
  await page.getByRole('combobox', { name: 'Conversas' }).waitFor()
}

/** Sends `question`, waits for the screen to show `expected` while the turn is held, then lets it end. */
async function answered(chat: Page, hold: () => () => void, question: string, expected: string) {
  const release = hold()
  await ask(chat, question)
  await transcriptShowed(chat, expected)
  release()
  await chat.getByRole('button', { name: 'Parar' }).waitFor({ state: 'detached' })
}

/** Step 1: the selector offers the default and the providers with an account; the answer and its title. */
async function firstQuestion(chat: Page, hold: () => () => void) {
  await openConversation(chat, () => chat.getByRole('button', { name: 'Nova conversa' }).click())
  const choice = chat.getByRole('combobox', { name: 'Modelo e raciocínio' })
  await choice.click()
  await chat.getByText('Anthropic', { exact: true }).waitFor()
  await chat.getByText('Groq', { exact: true }).waitFor()
  await chat.keyboard.press('Escape')
  assert.match(await choice.innerText(), /sonnet/i)
  await answered(chat, hold, 'Compare dois apps de encomenda de padaria', ANSWER)
  await chat.reload()
  await chat
    .getByRole('combobox', { name: 'Conversas' })
    .and(chat.locator(`[value="${TITLE}"]`))
    .waitFor()
  await chat
    .getByRole('log', { name: 'Conversa com o Builder' })
    .getByText('Leu 3 páginas, pesquisou 1 vez')
    .waitFor()
}

/** Steps 2 and 3: Time 3 goes up and is refused; Time 1 pauses and the queue is empty. */
async function refusedThenPaused(
  owner: Page,
  chat: Page,
  hold: () => () => void,
  companyA: string,
) {
  await owner.goto(`${TEST_ORIGIN}/companies/${companyA}/settings/model-accounts`)
  await saving(owner, () => owner.getByRole('button', { name: 'Subir Time 3' }).click())
  await owner.getByRole('button', { name: 'Subir Time 3' }).waitFor({ state: 'detached' })
  const notice = 'Time 3 foi recusada. Ligue de novo; continuei pela Time 1.'
  await answered(chat, hold, 'E o segundo app?', notice)
  await chat.reload()
  await chat.getByRole('log', { name: 'Conversa com o Builder' }).getByText(notice).waitFor()
  await owner.reload()
  await owner.getByRole('heading', { name: 'Anthropic', level: 3 }).waitFor()
  const [top] = await rowsText(queueRows(owner, 'Anthropic'))
  assert.match(top ?? '', /^Time 3.*chave …dE2f · recusada · Ligue de novo/)
  await saving(owner, () => owner.getByRole('button', { name: 'Pausar Time 1' }).click())
  await owner.getByRole('button', { name: 'Retomar Time 1' }).waitFor()
  await answered(chat, hold, 'E o terceiro?', EXHAUSTED)
}

/** Step 4: the switch goes on with the second model; with Time 1 back, the next asks Claude again. */
async function switched(
  owner: Page,
  chat: Page,
  hold: () => () => void,
  claudeCalls: () => number,
) {
  await turnOnSwitch(owner)
  const notice = `Troquei para ${SECOND_MODEL} pela troca automática da empresa.`
  await answered(chat, hold, 'E o quarto?', notice)
  await transcriptShowed(chat, SECOND_ANSWER)
  await saving(owner, () => owner.getByRole('button', { name: 'Retomar Time 1' }).click())
  await owner.getByRole('button', { name: 'Pausar Time 1' }).waitFor()
  const before = claudeCalls()
  await answered(chat, hold, 'E o quinto?', ANSWER)
  assert.ok(claudeCalls() > before, 'the next question asked Claude')
}

/** Ana's box of conversations holds the one, by its title. */
async function listed(chat: Page) {
  await chat.getByRole('combobox', { name: 'Conversas' }).press('ArrowDown')
  await chat.getByRole('option', { name: TITLE }).waitFor()
}

/** Step 5: Diego does not see Ana's conversation, in her company or in another. */
async function otherPerson(diego: Page, ids: { companyA: string; companyB: string }, link: string) {
  await enter(diego, DIEGO.email, `/companies/${ids.companyA}`)
  await openConversations(diego, ids.companyA)
  await diego.getByText('Nenhuma conversa').waitFor()
  await diego.goto(link)
  await diego.getByText(NOT_FOUND).waitFor()
  await diego.goto(`${TEST_ORIGIN}/companies/${ids.companyB}/projects`)
  await diego.getByText('Nenhum projeto ainda.').waitFor()
}

test('o roteiro da primeira conversa: resposta com páginas e título, recusa, pausa, troca automática e outra pessoa', async (t) => {
  const { anthropic, state, hold } = plantJourney(t, await publicPage(t))
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const ids = await plantTwoCompanies(database)
  const problems: string[] = []
  const closers: (() => Promise<void>)[] = []
  function claudeCalls() {
    return anthropic.sent.filter((each) => each.key === KEYS.first && each.stream).length
  }
  try {
    const owner = await hubWindow(closers, port, '198.51.100.10', problems)
    const diego = await hubWindow(closers, port, '203.0.113.10', problems)
    await setUp(owner, ids.companyA)
    const chat = await anotherPage(owner.context(), problems)
    await openConversations(chat, ids.companyA)
    await firstQuestion(chat, hold)
    state.reads = false
    await refusedThenPaused(owner, chat, hold, ids.companyA)
    await switched(owner, chat, hold, claudeCalls)
    const conversation = chat.url()
    await listed(chat)
    await otherPerson(diego, ids, conversation)
  } finally {
    for (const close of closers) await close()
  }
  assert.deepEqual(problems, [])
})

const FOLDED = 'Leu 3 páginas, pesquisou 1 vez'
const DRAFT = 'rascunho da Ana'

/** The Projeto in two regions: the Prévia and the Projeto tabs, the conversation on the right, the rail in icons. */
async function twoRegions(chat: Page) {
  await chat
    .getByText('Ainda não há uma prévia disponível. Descreva o aplicativo para começar.')
    .waitFor()
  await chat.getByRole('button', { name: 'Nova conversa' }).waitFor()
  const nav = await chat.getByRole('navigation', { name: 'Navegação' }).elementHandle()
  await chat.waitForFunction(
    (bar) => Math.round(bar?.getBoundingClientRect().width ?? 0) === 52,
    nav,
  )
  await chat.getByRole('tab', { name: 'Projeto', exact: true }).click()
  await chat.getByRole('tab', { name: 'Sobre' }).waitFor()
  await chat.getByRole('tab', { name: 'Versões' }).waitFor()
  await chat.getByRole('tab', { name: 'Prévia' }).click()
}

/** Step 2: "Alto" reaches the provider; the answer thinks, reads three pages and searches, folded in one line. */
async function researched(chat: Page, hold: () => () => void, sent: () => number) {
  await openConversation(chat, () => chat.getByRole('button', { name: 'Nova conversa' }).click())
  const choice = chat.getByRole('combobox', { name: 'Modelo e raciocínio' })
  await pickLevel(chat, choice, 'Alto')
  const release = hold()
  await ask(chat, 'Compare dois apps de encomenda de padaria')
  await chat.getByRole('status').filter({ hasText: 'Builder trabalhando' }).waitFor()
  await transcriptShowed(chat, ANSWER_HEAD)
  await transcriptShowed(chat, FOLDED)
  await transcriptShowed(chat, 'Pensou')
  assert.ok(sent() > 0, 'the provider received the thinking budget of "Alto"')
  return release
}

/** Step 3: the line cut between two deltas opens again from the last event; each tab then shows the answer once. */
async function reconnected(chat: Page, cut: () => void, release: () => void, problems: string[]) {
  const resumed = chat.waitForResponse(
    (response) =>
      response.url().endsWith('/events') && 'last-event-id' in response.request().headers(),
  )
  cut()
  assert.ok((await resumed).ok())
  const again = await anotherPage(chat.context(), problems)
  await openConversation(again, chat.url())
  release()
  for (const page of [chat, again]) {
    const log = page.getByRole('log', { name: 'Conversa com o Builder' })
    await log.getByText(ANSWER).waitFor()
    const text = await log.innerText()
    for (const once of [ANSWER, ANSWER_HEAD]) assert.equal(text.split(once).length, 2)
  }
  await again.close()
}

/** Step 4: another conversation by the box, and back: the draft is where it was left. */
async function draftKept(chat: Page) {
  const field = chat.getByLabel('Mensagem para o Builder')
  const first = chat.url()
  await field.fill(DRAFT)
  await chat.getByRole('button', { name: 'Nova conversa' }).click()
  await chat.waitForURL((url) => url.href !== first)
  await chat.waitForFunction(() => document.querySelector('textarea')?.value === '')
  await chat.getByRole('combobox', { name: 'Conversas' }).press('ArrowDown')
  await chat.getByRole('option', { name: TITLE }).click()
  await chat.waitForURL(first)
  await chat.waitForFunction((draft) => document.querySelector('textarea')?.value === draft, DRAFT)
  await field.fill('')
}

/** Step 5: on a phone "App | Conversa" swaps the regions keeping the draft; the dark theme fits too. */
async function onPhone(chat: Page) {
  await chat.setViewportSize({ width: 390, height: 844 })
  const field = chat.getByLabel('Mensagem para o Builder')
  await chat.getByRole('button', { name: 'Conversa', exact: true }).click()
  await field.fill(DRAFT)
  await chat.getByRole('button', { name: 'App', exact: true }).click()
  assert.equal(await field.isVisible(), false)
  await chat.getByRole('button', { name: 'Conversa', exact: true }).click()
  assert.equal(await field.inputValue(), DRAFT)
  function paper() {
    return chat.evaluate(() => getComputedStyle(document.body).backgroundColor)
  }
  const light = await paper()
  await chat.getByRole('button', { name: 'Abrir navegação' }).click()
  const drawer = chat.getByRole('dialog', { name: 'Navegação' })
  await drawer.getByRole('button', { name: `Conta de ${ANA.name}` }).click()
  await chat.getByRole('menuitemradio', { name: 'Escuro' }).click()
  await chat.keyboard.press('Escape')
  await drawer.getByRole('button', { name: 'Fechar navegação' }).click()
  await drawer.waitFor({ state: 'hidden' })
  assert.notEqual(await paper(), light)
  const { scroll, inner } = await chat.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }))
  assert.ok(scroll <= inner, `the page scrolls sideways: ${scroll}px in ${inner}px`)
  await field.fill('')
  await chat.setViewportSize({ width: 1280, height: 800 })
}

/** Step 6: Time 1 paused, the question refused for lack of an account: the notice stays in the turn after a reload. */
async function pausedNoticeStays(
  owner: Page,
  chat: Page,
  hold: () => () => void,
  companyA: string,
) {
  await owner.goto(`${TEST_ORIGIN}/companies/${companyA}/settings/model-accounts`)
  await saving(owner, () => owner.getByRole('button', { name: 'Pausar Time 1' }).click())
  await owner.getByRole('button', { name: 'Retomar Time 1' }).waitFor()
  await answered(chat, hold, 'E o segundo app?', REFUSED)
  await chat.reload()
  await chat.getByRole('log', { name: 'Conversa com o Builder' }).getByText(REFUSED).waitFor()
}

test('o roteiro da 12.1: a conversa no painel, o pensamento, as ferramentas dobradas, a volta da linha, o rascunho, o celular e o aviso que fica', async (t) => {
  const { anthropic, state, hold: holdTurn } = plantJourney(t, await publicPage(t))
  state.splitting = true
  const held: (() => void)[] = []
  function hold() {
    const release = holdTurn()
    held.push(release)
    return release
  }
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const ids = await plantTwoCompanies(database)
  const problems: string[] = []
  const closers: (() => Promise<void>)[] = []
  try {
    const owner = await hubWindow(closers, port, '198.51.100.10', problems)
    await setUp(owner, ids.companyA)
    const chat = await anotherPage(owner.context(), problems)
    await openConversations(chat, ids.companyA)
    await twoRegions(chat)
    function thinking() {
      return anthropic.sent.filter((each) => each.stream && each.thinking?.type === 'enabled')
        .length
    }
    const release = await researched(chat, hold, thinking)
    await reconnected(chat, owner.cutConnections, release, problems)
    await chat.getByRole('button', { name: 'Parar' }).waitFor({ state: 'detached' })
    await chat.reload()
    await chat.getByText(/^Pensou por /).waitFor()
    await chat.getByRole('button', { name: FOLDED }).click()
    await chat.getByText('Pesquisou na internet').waitFor()
    await draftKept(chat)
    await onPhone(chat)
    state.reads = false
    await pausedNoticeStays(owner, chat, hold, ids.companyA)
  } finally {
    for (const release of held) release()
    for (const close of closers) await close()
  }
  assert.deepEqual(problems, [])
})
