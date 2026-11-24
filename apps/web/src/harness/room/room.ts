import type {
  AgentId,
  CompanyId,
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

/** What a box that begins a conversation needs to know: whom it asks and where its files go, which decides the types it accepts. */
export type BoxWords = {
  /** Who answers, as the screen's words name it. */
  agent: string
  files: FilesGo
}

type RoomBase = BoxWords & {
  /** The connector's name as the person knows it ("Sankhya"), and its refusals, from its id. */
  connectors: ConnectorWords
  /** The rows this room draws differently from the table. */
  overrides: Partial<Record<RowTool, ToolSpec>>
  /** A turn's failures this room says in its own sentence: the Assistant has no model to choose. */
  failures: Partial<Record<FailureCode, string>>
}

/** A file opened beside the chat, and the path of the one now open, for its row to say so. */
type Opened = { openFile: (file: OpenedFile) => void; openedPath: string | undefined }

/** What the agent's own tool `slug` does, in the words its row reads. */
type AgentTools = { toolDescription: (slug: string) => string | undefined }

/** The company whose connections the notebook's card asks about: whether the person manages them. */
type Notebook = { notebook: { companyId: CompanyId } }

/** The cards the Assistant draws from what its tools proposed, each with no button once `closed`. */
type AssistantProposals = {
  app: (proposal: { proposed: ProposedApp; toolCallId: string; closed: boolean }) => ReactNode
  automation: (proposal: { proposed: ProposedAutomation; toolCallId: string }) => ReactNode
  companyMemory: (proposal: { proposed: ProposedCompanyMemory; toolCallId: string }) => ReactNode
}

export type RunChange = 'VERSION_SAVED' | 'PREVIEW_READY'

/**
 * Whose conversation the rows are drawn in, one variant per agent: each has only the fields its own
 * agent has, so a card of one agent cannot be drawn by the code of another. Whose session it is, is
 * the chat's `Place`.
 */
export type Room =
  | (RoomBase &
      Notebook & {
        kind: 'APP_BUILDER'
        changed: (change: RunChange) => void
      })
  | (RoomBase & Opened & Notebook & { kind: 'ASSISTANT'; proposals: AssistantProposals })
  | (RoomBase &
      AgentTools & {
        kind: 'AGENT_BUILDER'
        /** Shows the draft `agent_draft` or `agent_set` saved beside the chat: by a call of the answer, or by a tap of its line. */
        openAgent: (agentId: AgentId, by: 'CALL' | 'TAP') => void
        /** The agent now open, for its row to say so; `undefined` until one is. */
        openedAgent: AgentId | undefined
      })
  | (RoomBase &
      Opened &
      AgentTools & {
        kind: 'SAVED_AGENT'
        /** The write a tool `tool_<slug>` is, with its connection, for the card that asks about it. */
        writeOf: (toolName: string) => WriteTool | undefined
        /** The connector ("sankhya") of the connection a tool `tool_<slug>` of the agent reads or writes. */
        connectorOf: (toolName: string) => string | undefined
        /** The agent's writes of this conversation as the record keeps them (step 24.5): the card's warning and its end, read again when a card opens. */
        writes: WritesRead
        refreshWrites: () => void
      })

export type RoomKind = Room['kind']

export type RoomOf<K extends RoomKind> = Extract<Room, { kind: K }>

export function isRoom<K extends RoomKind>(room: Room, kinds: readonly K[]): room is RoomOf<K> {
  return kinds.some((kind) => kind === room.kind)
}

export const APP_BUILDER_WORDS: BoxWords = { agent: 'Builder', files: 'MODEL' }
export const ASSISTANT_WORDS: BoxWords = { agent: 'Assistente', files: 'MACHINE' }

/** What the Assistant, the Construtor de agentes and a saved agent draw alike: the Assistant's rows, and no model to choose when there is no account. */
const ASSISTANT_STYLE: Pick<RoomBase, 'overrides' | 'failures'> = {
  overrides: ASSISTANT_OVERRIDES,
  failures: { MODEL_NO_ACCOUNT: START_NO_ACCOUNT },
}

export function agentWords(agent: string): BoxWords {
  return { agent, files: 'MODEL' }
}

/** The room of the Builder's conversation once the catalog is read: the connectors' names, logos and way of linking, and the Builder's own refusals. */
export function appBuilderRoom(
  words: ConnectorWords,
  companyId: CompanyId,
  changed: RoomOf<'APP_BUILDER'>['changed'],
): RoomOf<'APP_BUILDER'> {
  return {
    kind: 'APP_BUILDER',
    ...APP_BUILDER_WORDS,
    connectors: { ...words, refusal: PLAIN_WORDS.refusal },
    overrides: {},
    failures: {},
    notebook: { companyId },
    changed,
  }
}

export function assistantRoom(
  held: Pick<
    RoomOf<'ASSISTANT'>,
    'connectors' | 'notebook' | 'openFile' | 'openedPath' | 'proposals'
  >,
): RoomOf<'ASSISTANT'> {
  return {
    kind: 'ASSISTANT',
    ...ASSISTANT_WORDS,
    ...ASSISTANT_STYLE,
    ...held,
  }
}

export function agentBuilderRoom(
  agent: string,
  held: Pick<
    RoomOf<'AGENT_BUILDER'>,
    'connectors' | 'toolDescription' | 'openAgent' | 'openedAgent'
  >,
): RoomOf<'AGENT_BUILDER'> {
  return {
    kind: 'AGENT_BUILDER',
    ...agentWords(agent),
    ...ASSISTANT_STYLE,
    ...held,
  }
}

export function savedAgentRoom(
  agent: string,
  held: Pick<
    RoomOf<'SAVED_AGENT'>,
    | 'connectors'
    | 'toolDescription'
    | 'writeOf'
    | 'connectorOf'
    | 'writes'
    | 'refreshWrites'
    | 'openFile'
    | 'openedPath'
  >,
): RoomOf<'SAVED_AGENT'> {
  return {
    kind: 'SAVED_AGENT',
    ...agentWords(agent),
    ...ASSISTANT_STYLE,
    ...held,
  }
}

export const RoomContext = createContext<Room | null>(null)

export function useRoom(): Room {
  const room = useContext(RoomContext)
  if (room === null) throw new Error('a row drawn outside a conversation')
  return room
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
