import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import type { Page } from 'playwright-core'
import type { Reply } from '../../apps/server/src/platform/test-anthropic.ts'
import { plantAnthropic } from '../../apps/server/src/platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { ask, plantTwoCompanies, readyToBuild, transcriptOf } from './conversation-journey.ts'
import { hubWindow, openConversation } from './hub-window.ts'
import { liveHub, openProject } from './live-hub.ts'

const REASONING = 'Vou conferir os arquivos fictícios e manter esta alteração segura.'
const HOLD = 'Vou continuar a conferência fictícia.'
const SAFE_PATH = 'src/router.tsx'

type Block = Extract<Reply, { kind: 'blocks' }>['blocks'][number]

function call(name: string, input: object): Block {
  return { type: 'tool_use', name, input }
}

function tasks(status: string) {
  return call('task_write', {
    tasks: [
      { id: 'arquivos', content: 'Conferir arquivos', activeForm: 'Conferindo arquivos', status },
      ...Array.from({ length: 12 }, (_, index) => ({
        id: `passo-${index + 1}`,
        content: `Passo fictício ${index + 1}`,
        activeForm: `Conferindo passo fictício ${index + 1}`,
        status: status === 'completed' ? 'completed' : 'pending',
      })),
      {
        id: 'seguranca',
        content: 'Preservar a escrita segura',
        activeForm: 'Preservando segurança',
        status: status === 'completed' ? 'completed' : 'pending',
      },
    ],
  })
}

/**
 * The shape of one run of Mastra's export (its model calls, the tools of each, the empty last
 * call), kept with no argument, result or text; the inputs below are made up (S40, T24). Calls that
 * need a person's answer or the machine's check program are the other journeys'.
 */
const RUN: { steps: { tools: string[]; text: boolean }[] } = JSON.parse(
  readFileSync(new URL('./builder-native-run.json', import.meta.url), 'utf8'),
)
const OTHER_JOURNEYS = new Set(['ask_user', 'submit_plan', 'conexus_check'])

const INPUTS: Record<string, object> = {
  skill: { name: 'conexus-build' },
  skill_read: { name: 'conexus-build', path: 'SKILL.md' },
  mastra_workspace_list_files: { path: 'src' },
  mastra_workspace_file_stat: { path: SAFE_PATH },
  mastra_workspace_read_file: { path: SAFE_PATH },
  mastra_workspace_mkdir: { path: 'src/ficticio' },
  mastra_workspace_write_file: { path: 'src/ficticio/a.ts', content: 'export const a = 1\n' },
  mastra_workspace_grep: { pattern: 'router', path: 'src' },
  task_update: { id: 'arquivos', status: 'in_progress' },
  task_complete: { id: 'arquivos' },
  task_check: {},
}

/** The export's calls, each with the tools of the run that a journey can play. */
const FROM_EXPORT: Block[][] = RUN.steps
  .map((step) => step.tools.filter((name) => !OTHER_JOURNEYS.has(name)))
  .filter((names) => names.length > 0)
  .map((names) => names.map((name) => call(name, INPUTS[name] ?? {})))

const SCRIPT: (Block[] | string)[] = [
  [{ type: 'thinking', thinking: REASONING }, tasks('in_progress')],
  HOLD,
  ...FROM_EXPORT,
  [
    call('mastra_workspace_write_file', {
      path: '../outside.ts',
      content: 'conteúdo fictício sem dado de empresa',
    }),
  ],
  [tasks('completed')],
  [],
]

function builderThatFollowsMastraExports(
  t: Parameters<typeof plantAnthropic>[0],
  until: Promise<void>,
) {
  let step = 0
  return plantAnthropic(t, (sent): Reply => {
    if (!sent.stream) return { kind: 'text', text: 'Percurso nativo fictício' }
    if (!sent.system.includes('You are the Conexus Builder'))
      return { kind: 'text', text: 'Anotado.' }
    const next = SCRIPT[step++] ?? []
    if (next === HOLD) return { kind: 'hold', text: HOLD, until }
    return typeof next === 'string'
      ? { kind: 'text', text: next }
      : { kind: 'blocks', blocks: next }
  })
}

/** Opens every group, then every row: each one shows what it did (criterion 8). */
async function openEveryLine(chat: Page) {
  const transcript = transcriptOf(chat)
  const closed = transcript.locator('button[aria-expanded="false"]')
  await closed.first().waitFor()
  for (let opened = 0; opened < 200 && (await closed.count()) > 0; opened += 1) {
    const line = await closed.first().elementHandle()
    assert.ok(line)
    await line.click()
    await chat.waitForFunction((el) => el.getAttribute('aria-expanded') === 'true', line)
  }
  const refused = transcript.getByRole('button', { name: /Não conseguiu escrever/ })
  await refused.getByText('outside.ts').waitFor()
}

test('percurso nativo em Chromium: ferramentas, pensamento, tarefas e transcrição relida', async (t) => {
  const held = Promise.withResolvers<void>()
  builderThatFollowsMastraExports(t, held.promise)
  const { port, database } = await liveHub(t, 'http://127.0.0.1:9/unused')
  const ids = await plantTwoCompanies(database)
  const problems: string[] = []
  const closers: (() => Promise<void>)[] = []
  try {
    const chat = await hubWindow(closers, port, '198.51.100.10', problems)
    await readyToBuild(chat, ids.companyA, 'Percurso nativo')
    await chat.goto(`${TEST_ORIGIN}/companies/${ids.companyA}`)
    await openProject(chat, 'Percurso nativo')
    await openConversation(chat, () => chat.getByRole('button', { name: 'Nova conversa' }).click())
    await ask(chat, 'Confira os arquivos fictícios com segurança.')
    const transcript = transcriptOf(chat)
    // The thinking is closed: its line says so, and opens on the model's words (criterion 9).
    const reason = transcript.getByRole('button', { name: /^Pensou/ })
    await reason.click()
    await transcript.getByText(REASONING).waitFor()
    const panel = chat.getByRole('region', { name: 'Painel de tarefas' })
    await panel.getByText(/Tarefas · 0 de 14/).waitFor()
    held.resolve()
    await chat.getByRole('button', { name: 'Parar' }).waitFor({ state: 'detached' })
    // The one live/reread difference: HOLD is a text step that ends with tasks open, so `checkGate`
    // aborts it with a retry and Mastra rolls the attempt back out of its store; the live fold shows
    // it, the reread cannot (Mastra 1.78.0 `llm-execution-step.ts:2916-2925`, `rollbackToStepBoundary`
    // at `message-list.ts:865`). Every other part is the same after the reload.
    const before = (await transcript.innerText()).replace(HOLD, '')
    await chat.reload()
    await chat.getByRole('button', { name: 'Parar' }).waitFor({ state: 'detached' })
    assert.equal((await transcriptOf(chat).innerText()).replace(HOLD, ''), before)
    await openEveryLine(chat)
  } finally {
    held.resolve()
    for (const close of closers) await close()
  }
  assert.deepEqual(problems, [])
})
