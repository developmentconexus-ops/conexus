import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Room } from './room.ts'
import { ASSISTANT_ROOM, agentRoom, BUILDER_ROOM, savedRoom } from './test-rooms.ts'

test('cada sala tem só os campos do seu agente', () => {
  // @ts-expect-error a sala do Construtor de apps não desenha propostas
  const inAppBuilder = BUILDER_ROOM.proposals
  // @ts-expect-error a sala do Construtor de agentes não desenha propostas
  const inAgentBuilder = agentRoom().proposals
  // @ts-expect-error a sala do Assistente não abre rascunho de agente
  const inAssistant = ASSISTANT_ROOM.openAgent
  // @ts-expect-error a sala do agente salvo não abre rascunho de agente
  const inSavedAgent = savedRoom('Compras').openAgent
  assert.deepEqual(
    [inAppBuilder, inAgentBuilder, inAssistant, inSavedAgent],
    [undefined, undefined, undefined, undefined],
  )
})

test('estreitada pelo tipo, a sala do Assistente desenha as propostas sem ?.', () => {
  const room: Room = ASSISTANT_ROOM
  assert.equal(room.kind, 'ASSISTANT')
  if (room.kind === 'ASSISTANT') assert.equal(typeof room.proposals.app, 'function')
})
