import assert from 'node:assert/strict'
import http from 'node:http'
import type { TestContext } from 'node:test'
import type { Page } from 'playwright-core'
import type { Reply } from '../../apps/server/src/platform/test-anthropic.ts'
import { plantAnthropic } from '../../apps/server/src/platform/test-anthropic.ts'
import { pick } from './model-accounts-journey.ts'

// What the first conversation's journey shares: the provider double and the public page it reads,
// and the owner's and the person's moves on the screens.
export const KEYS = {
  first: 'sk-ant-api03-journey-first-key-aB1c',
  refused: 'sk-ant-api03-journey-refused-key-dE2f',
  groq: 'gsk-journey-groq-key-gH3i',
}
export const SECOND_MODEL = 'llama-3.3-70b-versatile'
export const ANSWER = 'Comparei os dois apps pelo cardápio.'
export const SECOND_ANSWER = 'Respondi pelo modelo da troca.'
const MARKER = 'CARDAPIO-DO-APP-UM'
const ADDRESS = 'padaria-apps.example.test'

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
 * Anthropic and Groq at `fetch`: the first question reads the page and answers; a refused key is
 * refused; a call that does not stream is the title's. While `hold` runs, the answer's text is
 * sent and its end waits, so the turn stays open for the screen to show it; the Hub replays an
 * answer in progress to a stream that subscribes late, and a finished one to no one.
 */
export function plantJourney(t: TestContext, pageUrl: string) {
  const state: { reads: boolean; holding: Promise<void> | undefined } = {
    reads: true,
    holding: undefined,
  }
  function answer(text: string): Reply {
    return state.holding === undefined
      ? { kind: 'text', text }
      : { kind: 'hold', until: state.holding, text }
  }
  const anthropic = plantAnthropic(t, (sent) => {
    if (sent.key === KEYS.refused) return { kind: 'refuse', status: 401 }
    if (!sent.stream) return { kind: 'text', text: 'Apps de encomenda de padaria' }
    const read = sent.texts.some((text) => text.includes(MARKER))
    if (state.reads && !read) return { kind: 'fetch', url: pageUrl }
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

/** The owner's setup page: the model the company starts conversations with. */
export async function chooseDefaultModel(page: Page) {
  await pick(page, page, 'Fornecedor do modelo padrão', 'Anthropic')
  await page.getByLabel('Buscar modelo').fill('sonnet')
  await pick(page, page, 'Modelo padrão', /sonnet/i)
  await page.getByRole('button', { name: 'Salvar modelo padrão' }).click()
  await page
    .getByRole('button', { name: 'Salvar modelo padrão' })
    .and(page.locator(':disabled'))
    .waitFor()
}

/** The automatic switch: the default model, then `SECOND_MODEL`, saved and read back as on. */
export async function turnOnSwitch(page: Page) {
  const section = page.getByRole('region', { name: 'Troca automática' })
  await section.getByLabel('Trocar para o próximo modelo quando as contas acabarem').check()
  const steps: [string, string, string | RegExp][] = [
    ['Anthropic', 'sonnet', /sonnet/i],
    ['Groq', SECOND_MODEL, SECOND_MODEL],
  ]
  for (const [provider, search, model] of steps) {
    await pick(page, section, 'Fornecedor do modelo da troca', provider)
    await section.getByLabel('Buscar modelo').fill(search)
    await pick(page, section, 'Modelo da troca', model)
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
    }).observe(document, { subtree: true, childList: true, characterData: true })
  })
}

/** Waits until the transcript has shown `text`, even if only for a moment. */
export async function transcriptShowed(page: Page, text: string) {
  await page.waitForFunction((wanted) => {
    const shown = Reflect.get(window, 'shownInTranscript')
    return shown instanceof Set && [...shown].some((each) => String(each).includes(wanted))
  }, text)
}
