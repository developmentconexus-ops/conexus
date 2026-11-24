import { AgentId } from '@conexus/hub-api'
import { expect, test } from 'vitest'
import type { Room, RoomKind } from './room.ts'
import { agentRoom, assistantRoomOf, BUILDER_ROOM, savedRoom } from './test-rooms.ts'
import { CARDS } from './tool-cards.tsx'

const ROOMS: Record<RoomKind, Room> = {
  APP_BUILDER: BUILDER_ROOM,
  ASSISTANT: assistantRoomOf({
    proposals: { app: () => 'app', automation: () => 'automation', companyMemory: () => 'memory' },
  }),
  AGENT_BUILDER: agentRoom(),
  SAVED_AGENT: savedRoom('Compras'),
}

const CALL = { toolCallId: 'call-1', toolName: 'agent_draft', live: true, closed: false }

const VALID = {
  shown: { kind: 'TEXT', path: 'a.md', name: 'a.md', media: 'text/markdown', content: 'oi' },
  proposal: { summary: 'Um app de encomendas' },
  automation: {
    name: 'Resumo',
    prompt: 'Resuma as vendas',
    cadence: { kind: 'DAILY', time: '07:00' },
    connections: [],
  },
  companyMemory: { kind: 'PAGE', name: 'Regras', body: 'Entrega em dois dias.' },
  agent: {
    kind: 'SAVED',
    agent: { id: AgentId.parse('11111111-1111-4111-8111-111111111111'), name: 'Compras' },
  },
} as const

const INVALID = {
  shown: { kind: 'SHOW_REFUSED', reason: 'OUTSIDE' },
  proposal: {},
  automation: { name: 'Resumo' },
  companyMemory: { kind: 'PAGE', name: 'Regras' },
  agent: { kind: 'SAVED' },
} as const

const DRAWN_IN = {
  shown: ['ASSISTANT', 'SAVED_AGENT'],
  proposal: ['ASSISTANT'],
  automation: ['ASSISTANT'],
  companyMemory: ['ASSISTANT'],
  agent: ['AGENT_BUILDER'],
} as const satisfies Record<keyof typeof VALID, readonly RoomKind[]>

const BODIES = ['shown', 'proposal', 'automation', 'companyMemory', 'agent'] as const
const KINDS = ['APP_BUILDER', 'ASSISTANT', 'AGENT_BUILDER', 'SAVED_AGENT'] as const

test('cada cartão é desenhado só nas salas da tabela; nas outras, a chamada cai na linha comum', () => {
  for (const body of BODIES) {
    for (const kind of KINDS) {
      const drawn = CARDS[body].draw(VALID[body], CALL, ROOMS[kind]) !== undefined
      const expected = DRAWN_IN[body].some((one) => one === kind)
      expect(drawn, `${body} na sala ${kind}`).toBe(expected)
    }
  }
})

test('um resultado que não passa no esquema do cartão desenha a linha comum, em toda sala', () => {
  for (const body of BODIES) {
    for (const kind of KINDS) {
      expect(
        CARDS[body].draw(INVALID[body], CALL, ROOMS[kind]),
        `${body} na sala ${kind}`,
      ).toBeUndefined()
    }
  }
})
