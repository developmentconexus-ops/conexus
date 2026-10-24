import type { ConversationEvent, Message } from '@conexus/hub-api'
import { MessageId, ModelId } from '@conexus/hub-api'
import { expect, test } from 'vitest'
import type { Live } from './live.ts'
import { IDLE, itemsOf, live, waitsOnPerson } from './live.ts'
import { fromMessages } from './transcript.ts'

const TURN = MessageId.parse('run-1')
const STEP_1 = MessageId.parse('step-1')
const STEP_2 = MessageId.parse('step-2')
const MODEL = ModelId.parse('anthropic/claude-sonnet-4')
const STARTED = '2026-10-19T12:00:00.000Z'

function message(
  id: MessageId,
  parts: Message['parts'] = [],
  suspended: Message['suspended'] = {},
) {
  return {
    id,
    role: 'builder',
    parts,
    suspended,
    model: MODEL,
    createdAt: STARTED,
  } satisfies Message
}

function told(...events: ConversationEvent[]): Live {
  return events.reduce<Live>((state, event) => live(state, event), IDLE)
}

const opening: ConversationEvent = { type: 'turn', messages: [message(TURN)], startedAt: STARTED }
function start(id: MessageId, parts: Message['parts'] = []): ConversationEvent {
  return {
    type: 'message_start',
    message: message(id, parts),
  }
}
function reasoningDelta(id: MessageId, index: number, delta: string): ConversationEvent {
  return {
    type: 'message_update',
    id,
    event: { type: 'reasoning-delta', index, delta },
  }
}
function part(id: MessageId, index: number, value: Message['parts'][number]): ConversationEvent {
  return {
    type: 'message_update',
    id,
    event: { type: 'part', index, part: value },
  }
}
function text(value: string): Message['parts'][number] {
  return { type: 'text', text: value }
}
function thinking(value: string): Message['parts'][number] {
  return {
    type: 'reasoning',
    reasoning: value,
    details: [],
  }
}

test('o raciocínio na ordem do Mastra é uma linha por pensamento, não três', () => {
  // The order of Mastra's own test (signal-messages.test.ts:1740-1784): the start carries the first
  // reasoning, then deltas, an empty reasoning as a part at the next index, and its deltas.
  const state = told(
    opening,
    start(STEP_1, [thinking('')]),
    reasoningDelta(STEP_1, 0, 'passo um'),
    part(STEP_1, 1, thinking('')),
    reasoningDelta(STEP_1, 1, 'passo dois'),
  )
  const rows = itemsOf(state).filter((item) => item.kind === 'reasoning')
  expect(rows.map((row) => row.reasoning)).toEqual(['passo um', 'passo dois'])
  expect(rows.map((row) => row.streaming)).toEqual([false, true])
})

test('o texto de um segundo passo não apaga o do primeiro', () => {
  const state = told(
    opening,
    start(STEP_1, [text('Vou ler o arquivo.')]),
    start(STEP_2),
    part(STEP_2, 0, text('')),
    { type: 'message_update', id: STEP_2, event: { type: 'text-delta', delta: 'Pronto.' } },
  )
  expect(
    itemsOf(state)
      .filter((item) => item.kind === 'text')
      .map((item) => item.text),
  ).toEqual(['Vou ler o arquivo.', 'Pronto.'])
})

test('message_start do mesmo id substitui, não repete', () => {
  const state = told(opening, start(STEP_1, [text('a')]), start(STEP_1, [text('ab')]))
  expect(itemsOf(state)).toMatchObject([{ kind: 'text', text: 'ab' }])
})

test('o resultado que vem em outra mensagem fecha o cartão da chamada, no lugar dela', () => {
  function call(state: 'call' | 'result') {
    return {
      type: 'tool-invocation',
      toolInvocation: {
        state,
        toolCallId: 'toolu_q',
        toolName: 'ask_user',
        args: { questions: [{ question: 'Quem cadastra?' }] },
        result: state === 'result' ? { content: 'ok', answers: ['Todos'] } : undefined,
      },
    } satisfies Message['parts'][number]
  }
  const asked = told(opening, start(STEP_1, [call('call')]), {
    type: 'tool_suspended',
    toolCallId: 'toolu_q',
    toolName: 'ask_user',
    args: {},
    suspendPayload: { questions: [{ question: 'Quem cadastra?' }] },
  })
  expect(waitsOnPerson(itemsOf(asked))).toBe(true)
  const answered = live(asked, start(STEP_2, [call('result')]))
  expect(itemsOf(answered)).toMatchObject([{ kind: 'card', state: 'answered', answers: ['Todos'] }])
  expect(waitsOnPerson(itemsOf(answered))).toBe(false)
})

test('o "turn" de uma reconexão traz os passos com seus ids, e as atualizações seguintes caem neles', () => {
  const state = told(
    {
      type: 'turn',
      messages: [message(STEP_1, [thinking('Pensando')]), message(TURN)],
      startedAt: STARTED,
    },
    reasoningDelta(STEP_1, 0, ' mais'),
  )
  expect(itemsOf(state)).toMatchObject([{ kind: 'reasoning', reasoning: 'Pensando mais' }])
})

test('o plano que espera abre com o texto do servidor, ao ler de novo e na segunda aba', () => {
  const plan = {
    type: 'tool-invocation',
    toolInvocation: { state: 'call', toolCallId: 'toolu_p', toolName: 'submit_plan', args: {} },
  } satisfies Message['parts'][number]
  const suspended = {
    toolu_p: {
      toolCallId: 'toolu_p',
      toolName: 'submit_plan',
      args: {},
      suspendPayload: { title: 'Pedidos', plan: 'Um fluxo.' },
    },
  }
  const reread = fromMessages([message(STEP_1, [plan], suspended)])
  expect(reread).toMatchObject([
    { kind: 'card', cardKind: 'plan', title: 'Pedidos', plan: 'Um fluxo.' },
  ])
  const second = told({
    type: 'turn',
    messages: [message(STEP_1, [plan], suspended), message(TURN)],
    startedAt: STARTED,
  })
  expect(itemsOf(second)).toMatchObject([{ kind: 'card', state: 'open', plan: 'Um fluxo.' }])
})

test('a saída de um comando substitui a anterior: o servidor diz a cauda inteira', () => {
  const run = {
    type: 'tool-invocation',
    toolInvocation: {
      state: 'call',
      toolCallId: 'toolu_c',
      toolName: 'mastra_workspace_execute_command',
      args: { command: 'npm install' },
    },
  } satisfies Message['parts'][number]
  const state = told(
    opening,
    start(STEP_1, [run]),
    { type: 'shell_output', toolCallId: 'toolu_c', output: 'começo', stream: 'stdout' },
    { type: 'shell_output', toolCallId: 'toolu_c', output: 'começo\nfim', stream: 'stdout' },
  )
  expect(itemsOf(state)).toMatchObject([{ kind: 'tool', output: 'começo\nfim' }])
})

test('o plano recusado mostra o que o Mastra devolve: submittedPlan com a ação', () => {
  const rejected = {
    type: 'tool-invocation',
    toolInvocation: {
      state: 'result',
      toolCallId: 'toolu_p',
      toolName: 'submit_plan',
      args: {},
      result: {
        toolId: 'submit_plan',
        content: 'Plan was not approved.',
        submittedPlan: { title: 'Pedidos', plan: 'Um fluxo.', action: 'rejected' },
      },
    },
  } satisfies Message['parts'][number]
  expect(fromMessages([message(STEP_1, [rejected])])).toMatchObject([
    { kind: 'card', state: 'rejected', title: 'Pedidos', plan: 'Um fluxo.' },
  ])
})
