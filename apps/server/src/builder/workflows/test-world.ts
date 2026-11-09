import { ConnectorId, OperationId, PersonId, Role } from '@conexus/hub-api'
import { registryIndexOf } from './index.ts'
import { CONNECTION, testMastra } from './test-workflows.ts'
import type { PersonSpeaker, World } from './world.ts'

export const PUBLISHER = PersonId.parse('p-publisher')
export const PEDIDOS = OperationId.parse('pedidos')
export const LANCAR = OperationId.parse('lancar')

const SPEAKER: PersonSpeaker = { kind: 'PERSON', personId: PUBLISHER, role: Role.parse('member') }

/** A world with one connection offering a read, a list read and a write; each test changes only what it is about. */
export function testWorld(over: Partial<World> = {}): World {
  const mastra = testMastra()
  return {
    place: { kind: 'COMPANY' },
    offered: async () => [
      {
        connectionId: CONNECTION,
        connectorId: ConnectorId.parse('sankhya'),
        reads: [
          { id: PEDIDOS, many: false, input: null },
          { id: OperationId.parse('itens'), many: true, input: null },
        ],
        writes: [{ id: LANCAR, many: false, input: null }],
      },
    ],
    agents: async () => [],
    workflows: async () => [],
    people: async () => new Set([PUBLISHER]),
    speakerOf: async () => SPEAKER,
    mayUse: async () => true,
    mayLeaveAlone: async () => true,
    registryOf: (bundle) => registryIndexOf(mastra, bundle),
    ...over,
  }
}
