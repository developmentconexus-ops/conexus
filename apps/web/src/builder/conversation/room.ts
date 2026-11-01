import type { ProposedAutomation, ShownFile } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER, BUILDER_CONTROLLER } from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { ASSISTANT_OVERRIDES } from './assistant-specs.ts'
import type { Controller } from './session.ts'
import type { RowTool, ToolSpec } from './tool-spec.ts'

/** A file the Assistant shows beside the chat: the text to read, or the file to download. */
export type OpenedFile = Extract<ShownFile, { kind: 'TEXT' | 'FILE' }>

/**
 * Whose conversation the rows are drawn in (step 24.1, U4): the Builder's, which every row was
 * written for, or the Assistant's, whose rows name the connection read and open the file shown or
 * the app proposed in the screen that holds them. The Builder's is the default.
 */
export type Room = {
  controller: Controller
  /** Who answers, as the screen's words name it. */
  agent: 'Builder' | 'Assistente'
  /** The connector's name as the person knows it ("Sankhya"), from its id. */
  connectorName: (connector: string) => string
  /** Opens a file beside the chat; none in the Builder's conversation. */
  openFile?: (file: OpenedFile) => void
  /** The path of the file now open, for its row to say so. */
  openedPath?: string
  /** Opens **Criar app** with the proposed summary; none in the Builder's conversation. */
  createApp?: (summary: string) => void
  /** Draws **Criar automação** for the proposal of the call `toolCallId`; none in the Builder's conversation. */
  automationCard?: (proposal: { proposed: ProposedAutomation; toolCallId: string }) => ReactNode
  /** The rows this room draws differently from the table. */
  overrides: Partial<Record<RowTool, ToolSpec>>
}

export const BUILDER_ROOM: Room = {
  controller: BUILDER_CONTROLLER,
  agent: 'Builder',
  connectorName: (id) => id,
  overrides: {},
}

/** The Assistant's conversation before a connector catalog is read: its box and its rows say "Assistente". */
export const ASSISTANT_ROOM: Room = {
  controller: ASSISTANT_CONTROLLER,
  agent: 'Assistente',
  connectorName: (id) => id,
  overrides: ASSISTANT_OVERRIDES,
}

export const RoomContext = createContext<Room>(BUILDER_ROOM)

export function useRoom(): Room {
  return useContext(RoomContext)
}
