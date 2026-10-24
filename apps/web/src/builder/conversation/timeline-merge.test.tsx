import type { ConversationEvent, Message } from '@conexus/hub-api'
import { MessageId, ModelId } from '@conexus/hub-api'
import { expect, test } from 'vitest'
import type { Live, Step } from './timeline.ts'
import { IDLE, live, timelineOf } from './timeline.ts'
import { shownOf } from './transcript.tsx'

const TURN = MessageId.parse('run-1')
const STEP_1 = MessageId.parse('step-1')
const STEP_2 = MessageId.parse('step-2')
const A = MessageId.parse('conversa:a')
const MODEL = ModelId.parse('anthropic/claude-sonnet-4')
const STARTED = '2026-10-19T12:00:00.000Z'

function message(id: MessageId, parts: Message['parts'] = []): Message {
  return { id, role: 'builder', parts, suspended: {}, model: MODEL, createdAt: STARTED }
}

function personSaid(id: MessageId, said: string): Message {
  return { ...message(id, [text(said)]), role: 'person', model: null }
}

function text(value: string): Message['parts'][number] {
  return { type: 'text', text: value }
}

function start(id: MessageId, parts: Message['parts'] = []): ConversationEvent {
  return { type: 'message_start', message: message(id, parts) }
}

const opening: ConversationEvent = { type: 'turn', messages: [message(TURN)], startedAt: STARTED }

function told(...events: Step[]): Live {
  return events.reduce<Live>((state, event) => live(state, event), IDLE)
}

/** The turns on screen: the read joined by id to what the stream told (Factory `mergeServerWindow`). */
function turns(state: Live, read: readonly Message[] = []) {
  return shownOf(timelineOf(state), read, state.kind === 'answering')
}

const ASKED = MessageId.parse('conversa:pergunta')

test('a volta tem a chave da mensagem da pessoa antes e depois da leitura; a lida toma o lugar da do stream', () => {
  const asking = told(
    { type: 'sent', asked: ASKED },
    opening,
    start(STEP_1, [text('Vou perguntar.')]),
  )
  const live = turns(asking, [personSaid(A, 'antes')])
  expect(live.map((turn) => turn.key)).toEqual([A, ASKED])
  expect(live.at(-1)?.person).toBeUndefined()
  const saved = message(STEP_1, [text('Vou perguntar.'), text('E mais.')])
  const read = turns(asking, [personSaid(A, 'antes'), personSaid(ASKED, 'pergunta'), saved])
  expect(read.map((turn) => [turn.key, turn.person?.id])).toEqual([
    [A, A],
    [ASKED, ASKED],
  ])
  expect(read.at(-1)?.items.map((item) => item.id)).toEqual(['step-1-0', 'step-1-1'])
})

test('uma leitura no meio da volta põe o que só o stream disse junto do que ela já guarda, na ordem do stream', () => {
  const state = told(
    { type: 'sent', asked: ASKED },
    opening,
    start(STEP_1, [text('Primeiro.')]),
    { type: 'message_start', message: personSaid(A, 'No meio.') },
    start(STEP_2, [text('Depois.')]),
  )
  // Mastra keeps the steer when it takes it and the steps only at the end; ours as it goes.
  const read = [personSaid(ASKED, 'pergunta'), personSaid(A, 'No meio.'), message(TURN)]
  expect(turns(state, read).map((turn) => [turn.key, turn.items.map((item) => item.id)])).toEqual([
    [ASKED, ['step-1-0']],
    [A, ['step-2-0']],
  ])
})

test('a mensagem enviada durante o trabalho fica embaixo, pendente, e a leitura que a traz a mostra uma vez só', () => {
  const state = told(
    { type: 'sent', asked: ASKED },
    opening,
    { type: 'steer', id: A, text: 'No meio.' },
    start(STEP_1, [text('Primeiro.')]),
  )
  const pending = turns(state)
  expect(pending.map((turn) => [turn.key, turn.pending])).toEqual([
    [ASKED, undefined],
    [A, { text: 'No meio.', delivery: 'pending' }],
  ])
  const read = [personSaid(ASKED, 'pergunta'), personSaid(A, 'No meio.'), message(TURN)]
  expect(turns(state, read).map((turn) => [turn.key, turn.pending, turn.person?.id])).toEqual([
    [ASKED, undefined, ASKED],
    [A, undefined, A],
  ])
})

test('a pergunta enviada que falha sai da linha do tempo', () => {
  expect(told({ type: 'sent', asked: ASKED }, { type: 'unsent' })).toEqual(IDLE)
})

test('a resposta que chega na volta seguinte fecha o cartão no lugar dele, com a pergunta que ele fez', () => {
  const asked = { questions: [{ question: 'Quais preços?', options: [{ label: 'Os pães' }] }] }
  function call(state: 'call' | 'result'): Message['parts'][number] {
    const result = state === 'result' ? { content: 'ok', answers: ['Pão R$ 1'] } : undefined
    const args = state === 'call' ? asked : {}
    const toolInvocation = { state, toolCallId: 'toolu_q', toolName: 'ask_user', args, result }
    return { type: 'tool-invocation', toolInvocation }
  }
  const suspended = {
    toolu_q: { toolCallId: 'toolu_q', toolName: 'ask_user', args: asked, suspendPayload: asked },
  }
  const read = [personSaid(ASKED, 'pergunta'), { ...message(STEP_1, [call('call')]), suspended }]
  const resumed = told(
    { type: 'turnEnd', reason: 'complete' },
    { type: 'turn', messages: [message(MessageId.parse('run-2'))], startedAt: STARTED },
    start(STEP_2, [call('result')]),
  )
  expect(turns(resumed, read)).toMatchObject([
    {
      key: ASKED,
      items: [{ kind: 'card', state: 'answered', questions: [{ question: 'Quais preços?' }] }],
    },
  ])
})
