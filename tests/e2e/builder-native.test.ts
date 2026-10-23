import assert from 'node:assert/strict'
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

const SCRIPT: (Block[] | string)[] = [
  [{ type: 'thinking', thinking: REASONING }, tasks('in_progress')],
  HOLD,
  [
    call('skill', { name: 'conexus-build' }),
    call('mastra_workspace_list_files', { path: 'src' }),
    call('mastra_workspace_grep', { pattern: 'router', path: 'src' }),
    call('mastra_workspace_write_file', {
      path: '../outside.ts',
      content: 'conteúdo fictício sem dado de empresa',
    }),
  ],
  [call('mastra_workspace_read_file', { path: SAFE_PATH })],
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

async function openEveryLine(chat: Page) {
  const transcript = transcriptOf(chat)
  for (const [label, detail] of [
    [/Usou a skill/, 'conexus-build'],
    [/Listou arquivos/, 'src'],
    [/Buscou no código/, 'router'],
    [/Não conseguiu escrever/, 'outside.ts'],
    [/Leu um arquivo/, SAFE_PATH],
  ] as const) {
    const row = transcript.getByRole('button', { name: label }).first()
    await row.waitFor()
    await row.click()
    await row.getByText(detail).waitFor()
  }
  await transcript.getByText(/fora da pasta|fora do app|recusad/i).waitFor()
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
    await transcript.getByText(REASONING).waitFor()
    const reason = transcript.getByRole('button', { name: /Pensou por/ })
    await reason.click()
    await transcript.getByText(REASONING).waitFor()
    const panel = chat.getByRole('region', { name: 'Painel de tarefas' })
    await panel.getByText(/Tarefas · 0 de 14/).waitFor()
    await chat.setViewportSize({ width: 390, height: 844 })
    assert.equal(
      await panel.locator('ul').evaluate((list) => list.scrollWidth > list.clientWidth),
      true,
      'the task list can scroll horizontally when it exceeds the viewport',
    )
    await chat.setViewportSize({ width: 1280, height: 800 })
    held.resolve()
    await openEveryLine(chat)
    await chat.getByRole('button', { name: 'Parar' }).waitFor({ state: 'detached' })
    const before = await transcript.innerText()
    await chat.reload()
    await chat.getByRole('button', { name: 'Parar' }).waitFor({ state: 'detached' })
    assert.equal(await transcriptOf(chat).innerText(), before)
  } finally {
    held.resolve()
    for (const close of closers) await close()
  }
  assert.deepEqual(problems, [])
})
