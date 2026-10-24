import type { Message } from '@conexus/hub-api'
import { MessageId, ModelId } from '@conexus/hub-api'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hourOf } from '../../platform/dates.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { builderSaid, conversationOf, FIRST, screens } from './test-hub.tsx'
import type { TranscriptItem } from './transcript.ts'
import { invocationToItem } from './transcript.ts'
import { Transcript } from './transcript.tsx'

const { openConversation } = screens(hubServer())
const MODEL = ModelId.parse('anthropic/claude-sonnet-4')

function toolItem(id: string, toolName = 'mastra_workspace_read_file'): TranscriptItem {
  return {
    kind: 'tool',
    id,
    toolCallId: id,
    toolName,
    state: 'result',
    args: { path: `${id}.ts` },
    result: `content of ${id}`,
  }
}

test('o turno do Builder leva a marca, "Conexus" e o modelo; o da pessoa, a bolha e a hora', async () => {
  const createdAt = '2026-10-19T12:01:00.000Z'
  await openConversation(
    conversationOf({
      id: FIRST,
      messages: [
        {
          id: MessageId.parse('p1'),
          role: 'person',
          parts: [{ type: 'text', text: 'Oi' }],
          suspended: {},
          model: null,
          createdAt,
        },
        builderSaid('Olá'),
      ],
    }),
  )
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  const [person, builder] = within(log)
    .getAllByText(/^(Oi|Olá)$/)
    .map((text) => text.closest<HTMLElement>('[data-slot="message"]'))
  expect(person?.getAttribute('data-align')).toBe('end')
  expect(within(person ?? log).getByText(hourOf(createdAt))).toBeTruthy()
  expect(builder?.getAttribute('data-align')).toBe('start')
  expect(within(builder ?? log).getByText('Conexus')).toBeTruthy()
  expect(within(builder ?? log).getByText('Claude Sonnet 4')).toBeTruthy()
  expect(builder?.querySelector('svg path')).toBeTruthy()
})

test('raciocínio: "Pensando…", depois "Pensou por N s", fechado por padrão, abre no texto Markdown (Critério 9)', async () => {
  const reasoningItemRunning: TranscriptItem = {
    kind: 'reasoning',
    id: 'r-1',
    reasoning: '',
    seconds: null,
    streaming: true,
  }

  const { rerender } = render(
    <Transcript
      messages={[]}
      answer={{ items: [reasoningItemRunning], streaming: true }}
      model={MODEL}
    />,
  )
  expect(screen.getByText('Pensando…')).toBeTruthy()

  const reasoningItemDone: TranscriptItem = {
    kind: 'reasoning',
    id: 'r-1',
    reasoning: 'O usuário pediu uma lista de pedidos.\n\nVou ler o arquivo `src/app.tsx`.',
    seconds: 6,
    streaming: false,
  }

  rerender(
    <Transcript
      messages={[]}
      answer={{ items: [reasoningItemDone], streaming: false }}
      model={MODEL}
    />,
  )
  expect(screen.queryByText('Pensando…')).toBeNull()
  const trigger = screen.getByRole('button', { name: 'Pensou por 6 s' })
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByText(/O usuário pediu uma lista de pedidos/)).toBeNull()

  fireEvent.click(trigger)
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  const content = await screen.findByText(/O usuário pediu uma lista de pedidos/)
  expect(content).toBeTruthy()
})

test('relido, o raciocínio do passo diz "Pensou por N s" com o tempo guardado na mensagem do turno', () => {
  const at = '2026-10-19T12:02:00.000Z'
  function saved(id: string, parts: Message['parts']): Message {
    return {
      ...{ id: MessageId.parse(id), role: 'builder', parts, suspended: {}, model: MODEL },
      createdAt: at,
    }
  }
  render(
    <Transcript
      messages={[
        saved('step-1', [{ type: 'reasoning', reasoning: 'Vou comparar.', details: [] }]),
        saved('step-2', [{ type: 'text', text: 'Pronto.' }]),
        saved('turn', [{ type: 'data-conexus-thought', data: { id: 'step-1.0', seconds: 6 } }]),
      ]}
      answer={null}
      model={MODEL}
    />,
  )
  expect(screen.getByRole('button', { name: 'Pensou por 6 s' })).toBeTruthy()
})

test('raciocínio sem tempo diz só "Pensou" e abre no texto (Critério 9)', async () => {
  const reasoningWithoutSeconds: TranscriptItem = {
    kind: 'reasoning',
    id: 'r-2',
    reasoning: 'Pensamento sem contagem de segundos.',
    seconds: null,
    streaming: false,
  }

  render(
    <Transcript
      messages={[]}
      answer={{ items: [reasoningWithoutSeconds], streaming: false }}
      model={MODEL}
    />,
  )
  const trigger = screen.getByRole('button', { name: 'Pensou' })
  expect(trigger).toBeTruthy()
  fireEvent.click(trigger)
  expect(await screen.findByText('Pensamento sem contagem de segundos.')).toBeTruthy()
})

test('uma ou duas ferramentas são linhas; três ou mais viram um grupo fechado que abre (Critério 9)', async () => {
  const twoTools: TranscriptItem[] = [
    toolItem('t-1', 'mastra_workspace_read_file'),
    toolItem('t-2', 'mastra_workspace_grep'),
  ]

  const { rerender } = render(
    <Transcript messages={[]} answer={{ items: twoTools, streaming: false }} model={MODEL} />,
  )
  expect(screen.getByText(/Leu um arquivo/)).toBeTruthy()
  expect(screen.getByText(/Buscou no código/)).toBeTruthy()
  expect(screen.queryByText(/ferramentas:/)).toBeNull()

  const fourTools: TranscriptItem[] = [
    toolItem('t-1', 'mastra_workspace_list_files'),
    toolItem('t-2', 'mastra_workspace_grep'),
    toolItem('t-3', 'mastra_workspace_read_file'),
    toolItem('t-4', 'mastra_workspace_edit_file'),
  ]

  rerender(
    <Transcript messages={[]} answer={{ items: fourTools, streaming: false }} model={MODEL} />,
  )
  const group = screen.getByRole('button', { name: /4 ferramentas/ })
  expect(group.getAttribute('aria-expanded')).toBe('false')

  fireEvent.click(group)
  expect(group.getAttribute('aria-expanded')).toBe('true')
  expect(await screen.findByText(/Listou arquivos/)).toBeTruthy()
  expect(screen.getByText(/Buscou no código/)).toBeTruthy()
  expect(screen.getByText(/Leu um arquivo/)).toBeTruthy()
  expect(screen.getByText(/Editou um arquivo/)).toBeTruthy()
})

test('skill, ask_user e submit_plan nunca se agrupam mesmo com 3 ou mais ferramentas (Critério 9)', () => {
  const itemsWithUngroupables: TranscriptItem[] = [
    toolItem('t-1', 'mastra_workspace_read_file'),
    toolItem('t-2', 'mastra_workspace_read_file'),
    {
      kind: 'tool',
      id: 't-skill',
      toolCallId: 't-skill',
      toolName: 'skill',
      state: 'result',
      args: { name: 'conexus-build' },
      result: 'Skill ok',
    },
    toolItem('t-3', 'mastra_workspace_read_file'),
    toolItem('t-4', 'mastra_workspace_read_file'),
  ]

  render(
    <Transcript
      messages={[]}
      answer={{ items: itemsWithUngroupables, streaming: false }}
      model={MODEL}
    />,
  )
  // None of the runs reaches length >= 3, so no group button exists:
  expect(screen.queryByText(/ferramentas:/)).toBeNull()
  expect(screen.getByText(/Usou a skill conexus-build/)).toBeTruthy()
})

test('task_* tools não têm linha na conversa (Critério 9)', () => {
  const itemsWithTasks = ['task_write', 'task_update', 'task_complete', 'task_check'].flatMap(
    (toolName, at) =>
      invocationToItem(
        { state: 'result', toolCallId: `t-${at}`, toolName, args: {}, result: 'ok' },
        undefined,
      ) ?? [],
  )
  expect(itemsWithTasks).toEqual([])

  render(
    <Transcript messages={[]} answer={{ items: itemsWithTasks, streaming: false }} model={MODEL} />,
  )
  expect(screen.queryByText(/tarefa/i)).toBeNull()
  expect(screen.queryByRole('button', { name: /ferramenta|tarefa/i })).toBeNull()
})
