import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConversationId, questionIdOf, runningEffort } from './conversations.ts'
import type { MastraPart, MessageUpdate } from './mastra-parts.ts'
import { applyUpdate } from './mastra-parts.ts'

test('o nível em que o modelo roda: o mesmo, o mais perto abaixo, ou o mais baixo dele; Desligado só onde ele aceita', () => {
  assert.equal(runningEffort(['off', 'low', 'high'], 'high'), 'high')
  assert.equal(runningEffort(['off', 'low', 'high'], 'medium'), 'low')
  assert.equal(runningEffort(['low', 'medium', 'high'], 'off'), 'low')
  assert.equal(runningEffort(['low', 'medium', 'high'], 'max'), 'high')
  // A model whose lowest level is above the one kept from before runs at its lowest, never off.
  assert.equal(runningEffort(['off', 'medium', 'high'], 'low'), 'medium')
  assert.equal(runningEffort(['off'], 'high'), 'off')
})

test('a dobra de Mastra: o texto soma ao último texto, o raciocínio ao seu índice, e uma parte toma o seu lugar', () => {
  function tool(state: 'call' | 'result') {
    return {
      type: 'tool-invocation',
      toolInvocation: { state, toolCallId: 'toolu_1', toolName: 'view', args: { path: 'a.ts' } },
    } as const
  }
  const updates: MessageUpdate[] = [
    { type: 'reasoning-delta', index: 0, delta: 'Vou ' },
    { type: 'reasoning-delta', index: 0, delta: 'ler.' },
    { type: 'part', index: 1, part: tool('call') },
    { type: 'part', index: 1, part: tool('result') },
    { type: 'text-delta', delta: 'Li ' },
    { type: 'text-delta', delta: 'o arquivo.' },
  ]
  const before: MastraPart[] = []
  assert.deepEqual(updates.reduce(applyUpdate, before), [
    { type: 'reasoning', reasoning: 'Vou ler.', details: [] },
    tool('result'),
    { type: 'text', text: 'Li o arquivo.' },
  ])
  assert.deepEqual(before, [], 'the parts given stay as they were')
})

test('o id da mensagem da pessoa é a conversa e a chave do envio, a mesma que o servidor dá', () => {
  const conversation = ConversationId.parse('11111111-1111-4111-8111-111111111111')
  assert.equal(questionIdOf(conversation, 'a1b2'), '11111111-1111-4111-8111-111111111111:a1b2')
})
