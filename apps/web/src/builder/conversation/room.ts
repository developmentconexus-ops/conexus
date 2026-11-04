import type {
  AgentId,
  FailureCode,
  ProposedApp,
  ProposedAutomation,
  ShownFile,
} from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { ASSISTANT_OVERRIDES } from './assistant-specs.ts'
import { PLAIN_WORDS } from './connector-specs.ts'
import type { BuilderSession } from './session.ts'
import { START_NO_ACCOUNT } from './text.ts'
import type { ConnectorWords, RowTool, ToolSpec } from './tool-spec.ts'

/** A file the Assistant shows beside the chat: the text to read, or the file to download. */
export type OpenedFile = Extract<ShownFile, { kind: 'TEXT' | 'FILE' }>

/**
 * Whose conversation the rows are drawn in (step 24.1, U4): the Builder's, which every row was
 * written for, or the Assistant's, whose rows name the connection read and open the file shown or
 * the app proposed in the screen that holds them. Whose session it is, is the chat's `Place`.
 */
export type Room = {
  /** Who answers, as the screen's words name it. */
  agent: string
  /** The connector's name as the person knows it ("Sankhya"), and its refusals, from its id. */
  connectors: ConnectorWords
  /** Opens a file beside the chat; none in the Builder's conversation. */
  openFile?: (file: OpenedFile) => void
  /** The path of the file now open, for its row to say so. */
  openedPath?: string
  /** Draws the card of the app the call `toolCallId` proposed, with no button once `closed`; none in the Builder's conversation. */
  appCard?: (proposal: { proposed: ProposedApp; toolCallId: string; closed: boolean }) => ReactNode
  /** Draws **Criar automação** for the proposal of the call `toolCallId`; none in the Builder's conversation. */
  automationCard?: (proposal: { proposed: ProposedAutomation; toolCallId: string }) => ReactNode
  /** Shows the draft `agent_draft` or `agent_set` saved beside the chat: by a call of the answer, or by a tap of its line; none outside the Construtor's conversation. */
  openAgent?: (agentId: AgentId, by: 'CALL' | 'TAP') => void
  /** The agent now open, for its row to say so; `undefined` until one is. */
  openedAgent?: AgentId
  /** What the agent's own tool `slug` does, in the words its row reads; none where the room does not know the tools. */
  toolDescription?: (slug: string) => string | undefined
  /** The rows this room draws differently from the table. */
  overrides: Partial<Record<RowTool, ToolSpec>>
  /** A turn's failures this room says in its own sentence: the Assistant has no model to choose. */
  failures: Partial<Record<FailureCode, string>>
}

export const BUILDER_ROOM: Room = {
  agent: 'Builder',
  connectors: PLAIN_WORDS,
  overrides: {},
  failures: {},
}

/** The Assistant's conversation before a connector catalog is read: its box and its rows say "Assistente". */
export const ASSISTANT_ROOM: Room = {
  agent: 'Assistente',
  connectors: PLAIN_WORDS,
  overrides: ASSISTANT_OVERRIDES,
  failures: { MODEL_NO_ACCOUNT: START_NO_ACCOUNT },
}

/** The room of a conversation with the Construtor or with an agent of the Projeto: the rows are the Assistant's, the name is the one the person talks to and the connectors are named by the catalog the screen read. */
export function agentRoom(agent: string, connectors: ConnectorWords = PLAIN_WORDS): Room {
  return { ...ASSISTANT_ROOM, agent, connectors }
}

export const RoomContext = createContext<Room>(BUILDER_ROOM)

export function useRoom(): Room {
  return useContext(RoomContext)
}

/** What the conversation's box sends as the person's own message; the card's **Continuar aqui** says it through this. */
const SayContext = createContext<(words: string) => Promise<boolean>>(() => Promise.resolve(false))

export const SayProvider = SayContext.Provider

export function useSay(): (words: string) => Promise<boolean> {
  return useContext(SayContext)
}

/** Where a card's answer goes: the session of the conversation the card is drawn in. */
const AnswerContext = createContext<BuilderSession['answer'] | null>(null)

export const AnswerProvider = AnswerContext.Provider

export function useAnswerTo(): BuilderSession['answer'] {
  const answer = useContext(AnswerContext)
  if (answer === null) throw new Error('a card drawn outside a conversation')
  return answer
}
