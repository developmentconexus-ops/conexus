import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MessagePart, PartEvent } from './conversations.ts'
import { applyEvent, runningEffort } from './conversations.ts'

test('o nível em que o modelo roda: o mesmo, o mais perto abaixo, ou o mais baixo dele; Desligado só onde ele aceita', () => {
  assert.equal(runningEffort(['off', 'low', 'high'], 'high'), 'high')
  assert.equal(runningEffort(['off', 'low', 'high'], 'medium'), 'low')
  assert.equal(runningEffort(['low', 'medium', 'high'], 'off'), 'low')
  assert.equal(runningEffort(['low', 'medium', 'high'], 'max'), 'high')
  // A model whose lowest level is above the one kept from before runs at its lowest, never off.
  assert.equal(runningEffort(['off', 'medium', 'high'], 'low'), 'medium')
  assert.equal(runningEffort(['off'], 'high'), 'off')
})

test('a dobra: texto depois de texto é um texto; parte com `id` troca a de mesmo `id`; as outras vão ao fim', () => {
  const thinking = { type: 'reasoning', id: 'm.0', state: 'running', seconds: null } as const
  const thought = { ...thinking, state: 'completed', seconds: 2 } as const
  const reading = {
    type: 'tool',
    id: 'toolu_1',
    kind: 'read_page',
    state: 'running',
    subject: { url: 'https://padaria.example.test/', title: null },
  } as const
  const events: PartEvent[] = [
    { type: 'part', part: thinking },
    { type: 'text', delta: 'A primeira' },
    { type: 'text', delta: ', diz a fonte' },
    { type: 'part', part: thought },
    { type: 'part', part: reading },
    { type: 'notice', text: 'Trocamos de conta.' },
    { type: 'part', part: { ...reading, state: 'error' } },
    { type: 'text', delta: 'Depois.' },
    { type: 'part', part: { type: 'failure', code: 'MODEL_CALL_FAILED' } },
  ]
  const before: MessagePart[] = []
  assert.deepEqual(events.reduce(applyEvent, before), [
    thought,
    { type: 'text', text: 'A primeira, diz a fonte' },
    { ...reading, state: 'error' },
    { type: 'notice', text: 'Trocamos de conta.' },
    { type: 'text', text: 'Depois.' },
    { type: 'failure', code: 'MODEL_CALL_FAILED' },
  ])
  assert.deepEqual(before, [], 'the parts given stay as they were')
})
