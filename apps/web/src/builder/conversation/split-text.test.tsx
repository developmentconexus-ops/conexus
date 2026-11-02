import type { MastraMessagePart } from '@mastra/client-js'
import { expect, test } from 'vitest'
import type { Message } from './messages.ts'
import { messageOf } from './messages.ts'
import { itemsOf } from './rows.ts'
import { recordedRun } from './test-recorded.ts'

const view = { suspended: {}, running: {}, heard: {}, live: false }

/** The Builder's answer after Anthropic's native web search, as Mastra stored it (recorded 2026-10-24). */
const cited = recordedRun('cited')
  .read.map(messageOf)
  .find((message): message is Message => message?.role === 'builder')

function textsOf(parts: readonly MastraMessagePart[]) {
  const message: Message = {
    id: 'm1',
    role: 'builder',
    model: null,
    createdAt: '2026-11-02T00:39:37.000Z',
    parts,
  }
  return itemsOf([message], view).flatMap((item) => (item.kind === 'text' ? [item.text] : []))
}

test('o texto cortado em volta das citações é um só texto, com o espaço entre os blocos citados', () => {
  expect(cited).toBeDefined()
  const texts = textsOf(cited?.parts ?? [])
  expect(texts).toHaveLength(1)
  expect(texts[0]).toContain('mussarela**. O diferencial')
})

/** The Builder's turn that notes its tasks, as Mastra stored it: `task_write`, `task_complete`, then its words. */
const tasked = recordedRun('tasks')
  .read.map(messageOf)
  .find((message) => message?.parts.some((part) => part.type === 'tool-invocation'))

test('uma tarefa anotada entre dois textos os mantém separados, como antes', () => {
  const note = tasked?.parts.find(
    (part) => part.type === 'tool-invocation' && part.toolInvocation.toolName === 'task_write',
  )
  expect(note).toBeDefined()
  expect(
    textsOf([
      { type: 'text', text: 'Vou anotar as tarefas.' },
      ...(note ? [note] : []),
      { type: 'text', text: 'Agora começo pela tela.' },
    ]),
  ).toEqual(['Vou anotar as tarefas.', 'Agora começo pela tela.'])
})

test('uma ferramenta que aparece entre dois textos os mantém separados', () => {
  const [call] = cited?.parts.filter((part) => part.type === 'tool-invocation') ?? []
  expect(call).toBeDefined()
  expect(
    textsOf([
      { type: 'text', text: 'Antes.' },
      ...(call ? [call] : []),
      { type: 'text', text: 'Depois.' },
    ]),
  ).toEqual(['Antes.', 'Depois.'])
})
