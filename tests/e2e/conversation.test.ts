import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  ANSWER,
  ask,
  chooseDefaultModel,
  KEYS,
  plantJourney,
  publicPage,
  SECOND_ANSWER,
  SECOND_MODEL,
  saving,
  transcriptShowed,
  turnOnSwitch,
} from './conversation-journey.ts'
import { anotherPage, hubWindow, openConversation } from './hub-window.ts'
import {
  createProject,
  liveHub,
  openProject,
  personWithPassword,
  plantCompany,
  waitForHome,
} from './live-hub.ts'
import { enter, linkKey, queueRows, rowsText } from './model-accounts-journey.ts'

// Step 12's journey in Chromium, on a real Hub and the providers' doubles. Ana has two windows,
// one on the conversation and one on the company's accounts, as the owner of Empresa A has: the
// answer comes with the page read and a title; a refused key, a paused account and the end of the
// queue are said in the conversation; the automatic switch goes on with the second model and the
// next question tries Claude again; Diego, in the same company or in another, finds nothing of hers.
const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
const DIEGO = { name: 'Diego Reis', email: 'diego@example.test' }
const EXHAUSTED =
  'As contas Anthropic que você pode usar estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.'
const NOT_FOUND = 'Não encontramos o que você procurou.'
const TITLE = 'Apps de encomenda de padaria'

async function plant(database: Parameters<typeof personWithPassword>[0]) {
  const ana = await personWithPassword(database, ANA)
  const diego = await personWithPassword(database, DIEGO)
  const companyA = await plantCompany(database, ana, diego)
  const companyB = await plantCompany(database, diego, ana)
  await database.asOwner(`update auth.company set nickname = 'acme' where id = $1`, [companyA])
  await database.asOwner(
    `update auth.company set name = 'Empresa B', slug = 'b', nickname = 'beta' where id = $1`,
    [companyB],
  )
  return { companyA, companyB }
}

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
  await chooseDefaultModel(owner)
  await owner.goto(`${TEST_ORIGIN}/companies/${companyA}`)
  await waitForHome(owner)
  await createProject(owner, 'Encomendas')
  await owner.getByRole('heading', { name: 'Encomendas', exact: true }).waitFor()
}

async function openConversations(page: Page, companyA: string) {
  await page.goto(`${TEST_ORIGIN}/companies/${companyA}`)
  await openProject(page, 'Encomendas')
  await page
    .getByRole('navigation', { name: 'Projeto' })
    .getByRole('link', { name: 'Conversa' })
    .click()
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
  const choice = chat.getByRole('region', { name: 'Modelo da conversa' })
  await choice.getByLabel('Fornecedor do modelo', { exact: true }).click()
  const offered = await chat.getByRole('option').allInnerTexts()
  assert.deepEqual(offered.map((name) => name.trim()).sort(), ['Anthropic', 'Groq'])
  await chat.keyboard.press('Escape')
  assert.match(await choice.getByLabel('Modelo', { exact: true }).innerText(), /sonnet/i)
  await answered(chat, hold, 'Compare dois apps de encomenda de padaria', ANSWER)
  await chat.reload()
  await chat.getByRole('heading', { name: TITLE }).waitFor()
  await chat.getByRole('log', { name: 'Conversa com o Builder' }).getByText('Li a página').waitFor()
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

/** Ana's list of conversations holds the one, by its title. */
async function listed(chat: Page) {
  await chat.getByRole('link', { name: 'Voltar às conversas' }).click()
  await chat.getByRole('link', { name: new RegExp(TITLE) }).waitFor()
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
  const ids = await plant(database)
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
