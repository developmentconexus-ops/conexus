import { CompanyId } from '@conexus/hub-api'
import { PLAIN_WORDS } from './connector-specs.ts'
import type { Room, RoomOf } from './room.ts'
import { agentBuilderRoom, appBuilderRoom, assistantRoom, savedAgentRoom } from './room.ts'
import type { ConnectorWords } from './tool-spec.ts'

export const ROOM_COMPANY = CompanyId.parse('a'.repeat(32))

export const BUILDER_ROOM: RoomOf<'APP_BUILDER'> = appBuilderRoom(
  PLAIN_WORDS,
  ROOM_COMPANY,
  () => undefined,
)

export function assistantRoomOf(
  held: Partial<Parameters<typeof assistantRoom>[0]> = {},
): RoomOf<'ASSISTANT'> {
  return assistantRoom({
    connectors: PLAIN_WORDS,
    notebook: { companyId: ROOM_COMPANY },
    network: { companyId: ROOM_COMPANY },
    openFile: () => undefined,
    openedPath: undefined,
    proposals: { app: () => null, automation: () => null, companyMemory: () => null },
    ...held,
  })
}

export const ASSISTANT_ROOM: RoomOf<'ASSISTANT'> = assistantRoomOf()

export function agentRoom(connectors: ConnectorWords = PLAIN_WORDS): RoomOf<'AGENT_BUILDER'> {
  return agentBuilderRoom({
    connectors,
    network: { companyId: ROOM_COMPANY },
    toolDescription: () => undefined,
    openAgent: () => undefined,
    openedAgent: undefined,
  })
}

export function savedRoom(
  agent: string,
  connectors: ConnectorWords = PLAIN_WORDS,
): RoomOf<'SAVED_AGENT'> {
  return savedAgentRoom(agent, {
    connectors,
    network: { companyId: ROOM_COMPANY },
    toolDescription: () => undefined,
    writeOf: () => undefined,
    connectorOf: () => undefined,
    writes: { kind: 'READ', writes: [] },
    refreshWrites: () => undefined,
    openFile: () => undefined,
    openedPath: undefined,
  })
}

export const ROOMS_OF_EVERY_KIND: readonly Room[] = [
  BUILDER_ROOM,
  ASSISTANT_ROOM,
  agentRoom(),
  savedRoom('Compras'),
]
