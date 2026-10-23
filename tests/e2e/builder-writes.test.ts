import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Page } from 'playwright-core'
import type { Reply } from '../../apps/server/src/platform/test-anthropic.ts'
import { plantAnthropic } from '../../apps/server/src/platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import {
  ask,
  DIEGO,
  outputWith,
  plantTwoCompanies,
  readyToBuild,
  recordTranscript,
  transcriptOf,
  transcriptShowed,
} from './conversation-journey.ts'
import { anotherPage, hubWindow, openConversation } from './hub-window.ts'
import { liveHub, openProject } from './live-hub.ts'
import { enter } from './model-accounts-journey.ts'

// Step 13's journey in Chromium, on a real Hub, a test machine that is a folder, and Anthropic's
// double: Ana asks for a page and the Builder writes it and runs a command, the conversation tells
// it in words and the Código tab shows version 1 with its file; a second question saves version 2
// and the open tab reads again by itself; Diego, in another company, finds nothing of the Projeto.
const NOT_FOUND = 'Não encontramos o que você procurou.'
const PAGE = '<h1>Padaria</h1>\n'
const SECOND_PAGE = '<h1>Padaria Nova</h1>\n'
const WORKING = 'Builder trabalhando'
const VERSION_1 =
  /^Versão 1 guardada, sem conferência: \d+ arquivos?\.\s*Não consegui conferir o app\./

type Call = { type: 'tool_use'; name: string; input: object }

const WRITE = 'mastra_workspace_write_file'
const READ = 'mastra_workspace_read_file'
const RUN = 'mastra_workspace_execute_command'

/**
 * What the Builder does, step by step: the first question writes the page and runs a command; the
 * second reads the page before it writes it again, as a write over a file not read is refused.
 */
const SCRIPT: (Call[] | string)[] = [
  [
    { type: 'tool_use', name: WRITE, input: { path: 'pagina.html', content: PAGE } },
    {
      type: 'tool_use',
      name: RUN,
      input: { command: 'echo começo; sleep 3; echo página escrita' },
    },
  ],
  'Escrevi a página.',
  [{ type: 'tool_use', name: READ, input: { path: 'pagina.html' } }],
  [{ type: 'tool_use', name: WRITE, input: { path: 'pagina.html', content: SECOND_PAGE } }],
  'Mudei o título.',
]

function builderThatWrites(t: Parameters<typeof plantAnthropic>[0]) {
  let step = 0
  return plantAnthropic(t, (sent): Reply => {
    if (!sent.stream) return { kind: 'text', text: 'Página da padaria' }
    if (!sent.system.includes('You are the Conexus Builder'))
      return { kind: 'text', text: 'Anotado.' }
    const next = SCRIPT[step++] ?? 'Pronto.'
    return typeof next === 'string'
      ? { kind: 'text', text: next }
      : { kind: 'blocks', blocks: next }
  })
}

/** Waits for the turn's end, then checks that what lasts of it is on screen. */
async function lastingShown(chat: Page, version: RegExp) {
  await chat.getByText(WORKING).waitFor({ state: 'hidden' })
  const transcript = transcriptOf(chat)
  assert.ok(await transcript.getByText(version).isVisible(), 'the version line is gone')
  // The command's row closes once it ends, and opens again on its output.
  await transcript.getByRole('button', { name: /Rodou um comando/ }).click()
  await outputWith(chat, 'página escrita').waitFor()
}

async function writeFirst(chat: Page) {
  await chat.getByRole('tab', { name: 'Código', exact: true }).click()
  await chat.getByText(/Nenhuma versão guardada ainda/).waitFor()
  await openConversation(chat, () => chat.getByRole('button', { name: 'Nova conversa' }).click())
  await ask(chat, 'Faça a página da padaria')
  // The command's first line and its clock show while it still runs.
  const transcript = transcriptOf(chat)
  await outputWith(chat, 'começo').waitFor()
  await transcript.getByText(/^\(\d+ s\)$/).waitFor()
  assert.equal(await outputWith(chat, 'página escrita').count(), 0)
  await lastingShown(chat, VERSION_1)
  await transcriptShowed(chat, 'Escreveu um arquivo')
  await chat.getByText(/Versão 1, guardada em/).waitFor()
  // The tree holds the starter's files beside the page, so no file is open until one is chosen.
  await chat.getByRole('treeitem', { name: 'pagina.html', exact: true }).click()
  await chat
    .getByRole('region', { name: 'Conteúdo de pagina.html' })
    .getByText('<h1>Padaria</h1>')
    .waitFor()
}

test('o roteiro do Builder que escreve: a página, o comando, a versão 1 e a 2 na aba Código; outra empresa não vê', async (t) => {
  builderThatWrites(t)
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const ids = await plantTwoCompanies(database)
  const problems: string[] = []
  const closers: (() => Promise<void>)[] = []
  try {
    const owner = await hubWindow(closers, port, '198.51.100.10', problems)
    const diego = await hubWindow(closers, port, '203.0.113.10', problems)
    await readyToBuild(owner, ids.companyA, 'Encomendas')
    const chat = await anotherPage(owner.context(), problems)
    await recordTranscript(chat)
    await chat.goto(`${TEST_ORIGIN}/companies/${ids.companyA}`)
    await openProject(chat, 'Encomendas')
    await writeFirst(chat)
    await ask(chat, 'Mude o título')
    await transcriptShowed(chat, 'Versão 2 guardada, sem conferência: 1 arquivo mudado.')
    await chat.getByText(/Versão 2, guardada em/).waitFor()
    await chat
      .getByRole('region', { name: 'Conteúdo de pagina.html' })
      .getByText('<h1>Padaria Nova</h1>')
      .waitFor()
    const project = chat.url()
    await chat.reload()
    await chat.getByText(/Versão 2, guardada em/).waitFor()
    await transcriptOf(chat)
      .getByText('Versão 2 guardada, sem conferência: 1 arquivo mudado.')
      .waitFor()
    await lastingShown(chat, VERSION_1)

    await enter(diego, DIEGO.email, `/companies/${ids.companyB}`)
    await diego.goto(project.replace(ids.companyA, ids.companyB))
    await diego.getByText(NOT_FOUND).waitFor()
  } finally {
    for (const close of closers) await close()
  }
  assert.deepEqual(problems, [])
})
