import type { AgentConfig, ToolsInput } from '@mastra/core/agent'
import type { MastraMemory } from '@mastra/core/memory'
import type { RequestContext } from '@mastra/core/request-context'
import type { Turn } from '../model-accounts/public.ts'
import type { controllerOf } from './factories.ts'
import type { ControllerKind } from './kinds.ts'

/** One system message of an agent's instructions, in the order its ficha lists (C21 on `kind`). */
export type PromptPart =
  | Readonly<{ kind: 'FIXED'; text: string }>
  | Readonly<{ kind: 'TEXT'; text: string }>
  | Readonly<{
      kind: 'OF_RUN'
      of: (requestContext: RequestContext) => Promise<string | undefined>
    }>

/** An agent's instructions (row 5): system messages in order. */
export type Prompt = Readonly<{ kind: 'MESSAGES'; parts: readonly PromptPart[] }>

/** Whose model a turn runs: the session's. */
export type ModelSource = Readonly<{ kind: 'SESSION' }>

/** Who waits for approval (row 10): nothing, `yolo`. */
export type Approval = Readonly<{ kind: 'NOTHING_ASKS' }>

/** How a run takes its turn (row 8): by its session, held until `agent_end`. */
export type TurnSource = Readonly<{
  kind: 'SESSION'
  id: string
  take: (requestContext: RequestContext) => Promise<Turn | undefined>
}>

/** What an agent is made of: Mastra's `Agent` fields, filled by its ficha. */
export type AgentSpec = Readonly<{
  id: string
  name: string
  base: 'AGENT'
  prompt: Prompt
  model: ModelSource
  tools: (requestContext: RequestContext) => Promise<ToolsInput>
  approval: Approval
  memory: AgentConfig['memory']
  turn: TurnSource
  skills?: AgentConfig['skills']
  signals?: AgentConfig['signals']
  scopes?: AgentConfig['scopes']
  knowledge?: AgentConfig['knowledge']
}>

type ControllerInput = Parameters<typeof controllerOf>[0]

/** A conversation's agent and its controller: the id is `CONTROLLER_KINDS[kind].id`, never the ficha's. */
export type ConversationSpec = Omit<AgentSpec, 'id' | 'memory'> &
  Readonly<{
    kind: ControllerKind
    /** The controller's memory, where its threads live, and the agent's. */
    threads: MastraMemory
    mode: ControllerInput['mode']
    /** The controller's own tools under native ids (`ask_user`, `submit_plan`). */
    own?: NonNullable<ControllerInput['tools']>
    workspace?: ControllerInput['workspace']
  }>
