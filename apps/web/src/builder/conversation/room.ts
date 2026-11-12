import type {
  AgentId,
  FailureCode,
  ProposedApp,
  ProposedAutomation,
  ProposedCompanyMemory,
  ShownFile,
} from '@conexus/hub-api'
import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { WritesRead } from './approval-item.ts'
import { ASSISTANT_OVERRIDES } from './assistant-specs.ts'
import type { FilesGo } from './attachments.ts'
import { PLAIN_WORDS } from './connector-specs.ts'
import type { BuilderSession } from './session.ts'
import { START_NO_ACCOUNT } from './text.ts'
import type { ConnectorWords, RowTool, ToolSpec } from './tool-spec.ts'

/** A file the Assistant shows beside the chat: the text to read, or the file to download. */
export type OpenedFile = Extract<ShownFile, { kind: 'TEXT' | 'FILE' }>

/** A write of an agent's tool, as the card that asks about it names it: its connection and its operation. */
export type WriteTool = {
  connectionId: string
  /** The connector's id ("sankhya"), whose name the room's words say. */
  connector: string
  /** The connection's own name ("Matriz"). */
  connection: string
  operation: string
  /** The operation's name ("Lançar pedido"). */
  label: string
  /** What the version fixes in the write, which the model never chooses: the card lists it with what the model filled. */
  bound: Readonly<Record<string, unknown>>
}

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
  /** Draws the card of what the call `toolCallId` proposed to save in the company's memory; none in the Builder's conversation. */
  companyMemoryCard?: (proposal: {
    proposed: ProposedCompanyMemory
    toolCallId: string
  }) => ReactNode
  /** Shows the draft `agent_draft` or `agent_set` saved beside the chat: by a call of the answer, or by a tap of its line; none outside the Construtor's conversation. */
  openAgent?: (agentId: AgentId, by: 'CALL' | 'TAP') => void
  /** The agent now open, for its row to say so; `undefined` until one is. */
  openedAgent?: AgentId
  /** What the agent's own tool `slug` does, in the words its row reads; none where the room does not know the tools. */
  toolDescription?: (slug: string) => string | undefined
  /** The write a tool `tool_<slug>` is, with its connection, for the card that asks about it; none where the room has no writes. */
  writeOf?: (toolName: string) => WriteTool | undefined
  /** The connector ("sankhya") of the connection a tool `tool_<slug>` of the agent reads or writes; none where the room does not know the tools. */
  connectorOf?: (toolName: string) => string | undefined
  /** The agent's writes of this conversation as the record keeps them (step 24.5): the card's warning and its end, read again when a card opens. */
  writes?: WritesRead
  refreshWrites?: () => void
  /** The rows this room draws differently from the table. */
  overrides: Partial<Record<RowTool, ToolSpec>>
  /** A turn's failures this room says in its own sentence: the Assistant has no model to choose. */
  failures: Partial<Record<FailureCode, string>>
  /** Where the files the person sends go, which decides the types the box accepts. */
  files: FilesGo
}

export const BUILDER_ROOM: Room = {
  agent: 'Builder',
  connectors: PLAIN_WORDS,
  overrides: {},
  failures: {},
  files: 'MODEL',
}

/** The Assistant's conversation before a connector catalog is read: its box and its rows say "Assistente". */
export const ASSISTANT_ROOM: Room = {
  agent: 'Assistente',
  connectors: PLAIN_WORDS,
  overrides: ASSISTANT_OVERRIDES,
  failures: { MODEL_NO_ACCOUNT: START_NO_ACCOUNT },
  files: 'MACHINE',
}

/** The room of a conversation with the Construtor or with an agent of the Projeto: the rows are the Assistant's, the name is the one the person talks to and the connectors are named by the catalog the screen read. */
export function agentRoom(agent: string, connectors: ConnectorWords = PLAIN_WORDS): Room {
  return { ...ASSISTANT_ROOM, agent, connectors, files: 'MODEL' }
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

/** Where the answer to a write's card goes: the session of the conversation the card is drawn in. */
const ApproveContext = createContext<BuilderSession['approve'] | null>(null)

export const ApproveProvider = ApproveContext.Provider

export function useApprove(): BuilderSession['approve'] {
  const approve = useContext(ApproveContext)
  if (approve === null) throw new Error('a card drawn outside a conversation')
  return approve
}
