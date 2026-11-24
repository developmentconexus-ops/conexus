import type { AgentControllerEvent, MastraMessagePart } from '@mastra/client-js'
import { isKnownAgentControllerEvent } from '@mastra/client-js'
import { expect, test } from 'vitest'
import type { SessionState } from './session-state.ts'
import { OPENED, session } from './session-state.ts'
import { AGENT_START, signalStarted, stepStarted } from './test-events.ts'
import { builderSaid, personSaid } from './test-stream.tsx'
import { shownOf } from './transcript.tsx'

function call(id: string, state: 'call' | 'result'): MastraMessagePart {
  return {
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: id,
      toolName: 'web_fetch',
      state,
      args: { url: `https://padaria.example.test/${id}` },
      result: state === 'result' ? { title: id } : undefined,
    },
  }
}

const SAID = 'Vou ler o arquivo.'

function told(events: readonly AgentControllerEvent[]) {
  let state = OPENED
  for (const event of events) {
    if (!isKnownAgentControllerEvent(event)) throw new Error('not an event of the stream')
    state = session(state, { type: 'event', event })
  }
  return state
}

function drawn(state: SessionState) {
  return shownOf(state).flatMap((turn) =>
    turn.items.flatMap((item) => (item.kind === 'text' ? [item.text] : [item.kind])),
  )
}

test('a leitura no meio do turno com só o passo 1 salvo não repete o texto do passo', () => {
  let state = told([
    signalStarted('person-1', 'Leia'),
    AGENT_START,
    stepStarted('run-1', [
      { type: 'text', text: SAID },
      call('t1', 'result'),
      { type: 'step-start' },
      call('t2', 'call'),
    ]),
  ])
  const step1 = builderSaid(SAID, 'step-1')
  step1.content = { ...step1.content, parts: [{ type: 'text', text: SAID }, call('t1', 'result')] }
  state = session(state, { type: 'loaded', messages: [personSaid('Leia', 'person-1'), step1] })
  expect(drawn(state).filter((item) => item === SAID)).toHaveLength(1)
})

test('o resultado que a leitura salvou de uma chamada que o stream não terminou chega à tela', () => {
  let state = told([
    signalStarted('person-1', 'Leia'),
    AGENT_START,
    stepStarted('run-1', [
      { type: 'text', text: SAID },
      call('t1', 'call'),
      { type: 'step-start' },
      call('t2', 'call'),
    ]),
  ])
  const step1 = builderSaid(SAID, 'step-1')
  step1.content = { ...step1.content, parts: [{ type: 'text', text: SAID }, call('t1', 'result')] }
  state = session(state, { type: 'loaded', messages: [personSaid('Leia', 'person-1'), step1] })
  const calls = state.messages.flatMap((message) =>
    message.content.parts.flatMap((part) =>
      part.type === 'tool-invocation' ? [part.toolInvocation.state] : [],
    ),
  )
  expect(calls).toEqual(['result', 'call'])
  expect(drawn(state).filter((item) => item === SAID)).toHaveLength(1)
})

test('a cópia salva que cobre a mensagem da execução toma o lugar das partes dela, com o texto que o stream não ouviu', () => {
  const version: MastraMessagePart = { type: 'data-conexus-version', data: { id: 'v1' } }
  let state = told([
    signalStarted('person-1', 'Leia'),
    AGENT_START,
    stepStarted('run-1', [{ type: 'text', text: 'Vou ler' }, call('t1', 'call'), version]),
  ])
  const step1 = builderSaid(SAID, 'step-1')
  step1.content = {
    ...step1.content,
    parts: [{ type: 'text', text: SAID }, call('t1', 'result'), version],
  }
  state = session(state, { type: 'loaded', messages: [personSaid('Leia', 'person-1'), step1] })
  const run = state.messages.find((message) => message.id === 'run-1')
  expect(run?.content.parts).toEqual(step1.content.parts)
  expect(state.messages.map((message) => message.id)).toEqual(['person-1', 'run-1'])
})
