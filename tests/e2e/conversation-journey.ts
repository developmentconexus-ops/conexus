import assert from 'node:assert/strict'
import http from 'node:http'
import type { TestContext } from 'node:test'
import type { Locator, Page } from 'playwright-core'
import type { Reply } from '../../apps/server/src/platform/test-anthropic.ts'
import { plantAnthropic } from '../../apps/server/src/platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { createProject, personWithPassword, plantCompany, waitForHome } from './live-hub.ts'
import { enter, linkKey, pickModel } from './model-accounts-journey.ts'

// What the first conversation's journey shares: the provider double and the public page it reads,
// and the owner's and the person's moves on the screens.
export const KEYS = {
  first: 'sk-ant-api03-journey-first-key-aB1c',
  refused: 'sk-ant-api03-journey-refused-key-dE2f',
  groq: 'gsk-journey-groq-key-gH3i',
}
export const ANA = { name: 'Ana Lima', email: 'ana@example.test' }
export const DIEGO = { name: 'Diego Reis', email: 'diego@example.test' }
export const SECOND_MODEL = 'llama-3.3-70b-versatile'
export const ANSWER_HEAD = 'Comparei os dois apps'
const ANSWER_TAIL = ' pelo cardápio.'
export const ANSWER = `${ANSWER_HEAD}${ANSWER_TAIL}`
export const SECOND_ANSWER = 'Respondi pelo modelo da troca.'
const MARKER = 'CARDAPIO-DO-APP-UM'
const TOUR_PAGES = ['app-um', 'app-dois', 'app-tres']
const ADDRESS = 'padaria-apps.example.test'

/** Ana owns Empresa A and Diego is a member there; Diego owns Empresa B and Ana is a member. */
export async function plantTwoCompanies(database: Parameters<typeof personWithPassword>[0]) {
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

/**
 * A page on a public name that reaches this machine, as a public site would: the Hub's fetch
 * tool connects through the agent below, so the name is never looked up and nothing leaves it.
 */
export async function publicPage(t: TestContext): Promise<string> {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' })
    response.end(`<html><title>App Um</title><body>${MARKER}</body></html>`)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  const before = http.globalAgent
  const agent = new http.Agent()
  const connect = agent.createConnection.bind(agent)
  agent.createConnection = (options, callback) =>
    options.hostname === ADDRESS || options.host === ADDRESS
      ? connect(
          { ...options, host: '127.0.0.1', hostname: '127.0.0.1', port: address.port },
          callback,
        )
      : connect(options, callback)
  Reflect.set(http, 'globalAgent', agent)
  t.after(() => {
    Reflect.set(http, 'globalAgent', before)
    agent.destroy()
    server.closeAllConnections()
    server.close()
  })
  return `http://${ADDRESS}/app-um`
}

/**
 * Anthropic and Groq at `fetch`: the first question thinks, searches and reads three pages, then answers; a refused key is
 * refused; a call that does not stream is the title's. While `hold` runs, the answer's text is
 * sent and its end waits, so the turn stays open for the screen to show it (with `splitting`, the
 * answer's last words wait too, so the hold falls between two deltas); the Hub replays an
 * answer in progress to a stream that subscribes late, and a finished one to no one.
 */
export function plantJourney(t: TestContext, pageUrl: string) {
  const state: { reads: boolean; holding: Promise<void> | undefined; splitting: boolean } = {
    reads: true,
    holding: undefined,
    splitting: false,
  }
  /** Thinking, the provider's search and three pages read at once, as a comparison asks for. */
  function tour(): Reply {
    const fetches = TOUR_PAGES.map((page) => ({
      type: 'tool_use' as const,
      name: 'web_fetch',
      input: { url: new URL(page, pageUrl).href },
    }))
    const results = [{ url: pageUrl, title: 'App Um' }]
    const search = { type: 'search' as const, query: 'apps de encomenda de padaria', results }
    const thinking = { type: 'thinking' as const, thinking: 'Vou comparar os dois apps.' }
    return { kind: 'blocks', blocks: [thinking, ...fetches, search] }
  }
  function answer(text: string): Reply {
    if (state.holding === undefined) return { kind: 'text', text }
    if (!state.splitting || text !== ANSWER) return { kind: 'hold', until: state.holding, text }
    return { kind: 'hold', until: state.holding, text: ANSWER_HEAD, rest: ANSWER_TAIL }
  }
  const anthropic = plantAnthropic(t, (sent) => {
    if (sent.key === KEYS.refused) return { kind: 'refuse', status: 401 }
    if (!sent.stream) return { kind: 'text', text: 'Apps de encomenda de padaria' }
    const read = sent.texts.some((text) => text.includes(MARKER))
    if (state.reads && !read) return tour()
    return answer(ANSWER)
  })
  anthropic.chat = () => answer(SECOND_ANSWER)
  /** Holds the turns that follow until the returned function is called. */
  function hold(): () => void {
    const held = Promise.withResolvers<void>()
    state.holding = held.promise
    return () => {
      state.holding = undefined
      held.resolve()
    }
  }
  return { anthropic, state, hold }
}

/** The owner's Padrões da empresa: the model the company starts conversations with. */
export async function chooseDefaultModel(page: Page, companyId: string) {
  await page.goto(`${TEST_ORIGIN}/companies/${companyId}/settings/defaults`)
  await pickModel(page, page, 'Modelo e raciocínio', 'Anthropic', 'sonnet')
  await page.getByRole('button', { name: 'Salvar padrão' }).click()
  await page.getByRole('button', { name: 'Salvar padrão' }).and(page.locator(':disabled')).waitFor()
}

/** The automatic switch: the default model, then `SECOND_MODEL`, saved and read back as on. */
export async function turnOnSwitch(page: Page) {
  const section = page.getByRole('region', { name: 'Troca automática' })
  await section.getByLabel('Trocar para o próximo modelo quando as contas acabarem').check()
  const models: [string, string][] = [
    ['Anthropic', 'sonnet'],
    ['Groq', SECOND_MODEL],
  ]
  for (const [provider, search] of models) {
    await pickModel(page, section, 'Modelo da troca', provider, search)
    await section.getByRole('button', { name: 'Adicionar à fila' }).click()
  }
  await section.getByRole('button', { name: 'Salvar troca automática' }).click()
  await section.getByText('Ligada', { exact: true }).waitFor()
}

/** Writes in the field and sends; the answer is the caller's to wait for. */
export async function ask(page: Page, question: string) {
  await page.getByLabel('Mensagem para o Builder').fill(question)
  await page.getByRole('button', { name: 'Enviar' }).click()
}

/** Runs a move on the screen and returns once the Hub has answered the write it sent. */
export async function saving(page: Page, move: () => Promise<void>) {
  const written = page.waitForResponse(
    (response) => response.request().method() !== 'GET' && response.url().includes('/api/'),
  )
  await move()
  assert.ok((await written).ok())
}

/**
 * Opens the selector and moves its reasoning slider, one saved step at a time, until it reads
 * `level`; each step is a write the Hub answers, and the next waits for the slider to show the
 * saved one. It closes the selector with the button reading the level.
 */
export async function pickLevel(page: Page, choice: Locator, level: string) {
  await choice.click()
  const slider = page.getByRole('slider', { name: 'Raciocínio' })
  for (let step = 0; step < 8; step++) {
    const now = await slider.getAttribute('aria-valuetext')
    if (now === level) break
    await saving(page, () => slider.press('ArrowRight'))
    await page.waitForFunction(
      ([name, was]) =>
        document.querySelector(`input[aria-label="${name}"]`)?.getAttribute('aria-valuetext') !==
        was,
      ['Raciocínio', now],
    )
  }
  assert.equal(await slider.getAttribute('aria-valuetext'), level)
  await page.keyboard.press('Escape')
  await choice.filter({ hasText: level }).waitFor()
}

/**
 * Keeps every text the transcript shows, from the first load on: a notice is shown only while the
 * turn runs, and the double ends a turn in milliseconds, too soon for a poll to see it.
 */
export async function recordTranscript(page: Page) {
  await page.addInitScript(() => {
    const shown = new Set<string>()
    Reflect.set(window, 'shownInTranscript', shown)
    new MutationObserver(() => {
      const log = document.querySelector('[role=log]')
      if (log instanceof HTMLElement) shown.add(log.innerText)
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true })
  })
}

/** Waits until the transcript has shown `text`, even if only for a moment. */
export async function transcriptShowed(page: Page, text: string) {
  await page.waitForFunction((wanted) => {
    const shown = Reflect.get(window, 'shownInTranscript')
    return shown instanceof Set && [...shown].some((each) => String(each).includes(wanted))
  }, text)
}

/** Ana links a key, picks the company's model and creates the Projeto `name`, which opens. */
export async function readyToBuild(owner: Page, companyId: string, name: string) {
  await enter(owner, ANA.email, `/companies/${companyId}/settings/model-accounts`)
  await owner.getByText('Nenhuma conta ligada').waitFor()
  await linkKey(owner, 'Time 1', KEYS.first)
  await owner.getByText('Time 1 · chave …aB1c · ligada').first().waitFor()
  await chooseDefaultModel(owner, companyId)
  await owner.goto(`${TEST_ORIGIN}/companies/${companyId}`)
  await waitForHome(owner)
  await createProject(owner, name)
  await owner.getByRole('heading', { name, exact: true }).waitFor()
}

export function transcriptOf(chat: Page) {
  return chat.getByRole('log', { name: 'Conversa com o Builder' })
}

/** The command's output as its open row shows it, with `text` as a line of its own. */
export function outputWith(chat: Page, text: string) {
  return transcriptOf(chat).locator('pre', { hasText: new RegExp(`(^|\n)${text}(\n|$)`) })
}
