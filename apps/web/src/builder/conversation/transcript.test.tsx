import { ModelId } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/client-js'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hourOf } from '../../platform/dates.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import type { Stored } from './messages.ts'
import type { TranscriptItem } from './rows.ts'
import { invocationToItem } from './rows.ts'
import { OPENED } from './session-state.ts'
import { conversationOf, FIRST, screens } from './test-hub.tsx'
import { builderSaid, personSaid } from './test-stream.tsx'
import type { ShownTurn } from './transcript.tsx'
import { shownOf, Transcript } from './transcript.tsx'

const { openConversation } = screens(hubServer())
const MODEL = ModelId.parse('anthropic/claude-sonnet-4')

function turnOf(items: readonly TranscriptItem[], streaming: boolean): ShownTurn {
  return { key: 'p1', person: undefined, items, model: null, streaming }
}

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
  const said = personSaid('Oi', 'p1')
  const createdAt = String(said.createdAt)
  await openConversation(conversationOf({ id: FIRST, messages: [said, builderSaid('Olá')] }))
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
      turns={[turnOf([reasoningItemRunning], true)]}
      steers={[]}
      model={MODEL}
      onAsk={() => undefined}
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
      turns={[turnOf([reasoningItemDone], false)]}
      steers={[]}
      model={MODEL}
      onAsk={() => undefined}
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
  function saved(id: string, parts: MastraMessagePart[]): Stored {
    const message = builderSaid('', id)
    return { ...message, content: { ...message.content, parts } }
  }
  const messages = [
    saved('step-1', [{ type: 'reasoning', reasoning: 'Vou comparar.', details: [] }]),
    saved('step-2', [{ type: 'text', text: 'Pronto.' }]),
    saved('turn', [{ type: 'data-conexus-thought', data: { id: 'step-1.0', seconds: 6 } }]),
  ]
  render(
    <Transcript
      turns={shownOf({ ...OPENED, messages })}
      steers={[]}
      model={MODEL}
      onAsk={() => undefined}
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
      turns={[turnOf([reasoningWithoutSeconds], false)]}
      steers={[]}
      model={MODEL}
      onAsk={() => undefined}
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
    <Transcript
      turns={[turnOf(twoTools, false)]}
      steers={[]}
      model={MODEL}
      onAsk={() => undefined}
    />,
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
    <Transcript
      turns={[turnOf(fourTools, false)]}
      steers={[]}
      model={MODEL}
      onAsk={() => undefined}
    />,
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
      turns={[turnOf(itemsWithUngroupables, false)]}
      steers={[]}
      model={MODEL}
      onAsk={() => undefined}
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
    <Transcript
      turns={[turnOf(itemsWithTasks, false)]}
      steers={[]}
      model={MODEL}
      onAsk={() => undefined}
    />,
  )
  expect(screen.queryByText(/tarefa/i)).toBeNull()
  expect(screen.queryByRole('button', { name: /ferramenta|tarefa/i })).toBeNull()
})
