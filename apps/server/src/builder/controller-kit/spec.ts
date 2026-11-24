import type {
  AgentConfig,
  AgentInstructions,
  StreamIsTaskCompleteConfig,
  ToolsInput,
} from '@mastra/core/agent'
import type { MastraMemory } from '@mastra/core/memory'
import type { InputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import type { AccountTurn } from '../../harness/model-accounts/public.ts'
import type { controllerOf } from './factories.ts'
import type { ControllerKind } from './kinds.ts'
import type { routedModel } from './model.ts'
import type { Taken } from './turns.ts'

/** One system message of an agent's instructions, in the order its ficha lists (C21 on `kind`). */
export type PromptPart =
  | Readonly<{ kind: 'FIXED'; text: string }>
  | Readonly<{ kind: 'TEXT'; text: string }>
  /** The block of the turn's model, by its id with its provider; a model without one adds no message. */
  | Readonly<{ kind: 'BY_MODEL'; blocks: Readonly<Record<string, string>> }>
  | Readonly<{
      kind: 'OF_RUN'
      of: (requestContext: RequestContext) => Promise<string | undefined>
    }>

/**
 * An agent's instructions (row 5): system messages in order; or, for the agent of a conversation
 * that delegates (row 21), the instructions of the agent the run names.
 */
export type Prompt =
  | Readonly<{ kind: 'MESSAGES'; parts: readonly PromptPart[] }>
  | Readonly<{
      kind: 'DELEGATED'
      of: (requestContext: RequestContext) => Promise<AgentInstructions>
    }>

/** Whose model a turn runs: the session's, or the one the run's own plan names. */
export type ModelSource =
  | Readonly<{ kind: 'SESSION' }>
  | Readonly<{
      kind: 'OF_RUN'
      of: (requestContext: RequestContext) => Promise<ReturnType<typeof routedModel>>
    }>

/**
 * Who waits for approval (row 10): nothing, `yolo`; or only the write by its own rule, `yolo` off
 * and every tool without a rule of its own function never asking.
 */
export type Approval = Readonly<{ kind: 'NOTHING_ASKS' }> | Readonly<{ kind: 'THE_WRITE_ASKS' }>

/** How a run takes its turn (row 8): by its session, held until `agent_end`. */
type SessionTurn = Readonly<{
  kind: 'SESSION'
  id: string
  take: (requestContext: RequestContext) => Promise<AccountTurn | undefined>
}>

/**
 * ...or by the run alone, with no session to hold it: the agent that runs on its own (the version
 * the Construtor tests) and the Builder, whose run frees the Projeto itself (`onEnd`), take their
 * turn at the input and do not end it by session.
 */
type RunTurn = Readonly<{
  kind: 'RUN'
  id: string
  none: string
  resumes: boolean
  take: (requestContext: RequestContext) => Promise<Taken>
}>

export type TurnSource = SessionTurn | RunTurn

/** The input processors an agent adds around the account's pick (C26): the turn's comes first, always. */
type Processors = Readonly<{
  beforePick: readonly InputProcessor[]
  afterPick: readonly InputProcessor[]
}>

/**
 * What an agent is made of: Mastra's `Agent` fields the ficha only passes on, as they are, and the
 * ones Conexus builds from its own kinds.
 */
export type AgentSpec = Readonly<
  Pick<AgentConfig, 'description' | 'skills' | 'signals' | 'scopes' | 'knowledge'> & {
    id: string
    name: string
    prompt: Prompt
    model: ModelSource
    tools: (requestContext: RequestContext) => Promise<ToolsInput>
    approval: Approval
    memory: AgentConfig['memory']
    turn: TurnSource
    processors?: Processors
    /** How a turn ends (row 11): Mastra's `isTaskComplete` scores it, and a score of 0 sends the reason back to the model. */
    judge?: StreamIsTaskCompleteConfig
  }
>

type ControllerInput = Parameters<typeof controllerOf>[0]

/** A conversation's agent and its controller: the id is `CONTROLLER_KINDS[kind].id`, never the ficha's. */
export type ConversationSpec = Omit<AgentSpec, 'id' | 'memory'> &
  Readonly<{
    kind: ControllerKind
    /** The controller's memory, where its threads live, and the agent's unless `memory` says another. */
    threads: MastraMemory
    /** The agent's own memory, when it is not the threads': the one a run's version keeps. */
    memory?: AgentConfig['memory']
    mode: ControllerInput['mode']
    /** The controller's own tools under native ids (`ask_user`, `submit_plan`). */
    own?: NonNullable<ControllerInput['tools']>
    /** The helpers the `subagent` tool may start (row 22), and the model of each one's calls. */
    subagents?: ControllerInput['subagents']
    workspace?: ControllerInput['workspace']
  }>
