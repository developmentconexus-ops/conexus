import type { ShownFile } from '@conexus/hub-api'
import { BUILDER_CONTROLLER } from '@conexus/hub-api'
import { createContext, useContext } from 'react'
import type { Controller } from './session.ts'

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
}

export const BUILDER_ROOM: Room = {
  controller: BUILDER_CONTROLLER,
  agent: 'Builder',
  connectorName: (id) => id,
}

export const RoomContext = createContext<Room>(BUILDER_ROOM)

export function useRoom(): Room {
  return useContext(RoomContext)
}
