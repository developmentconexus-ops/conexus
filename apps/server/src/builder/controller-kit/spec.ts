import type { AgentConfig, AgentInstructions, ToolsInput } from '@mastra/core/agent'
import type { MastraMemory } from '@mastra/core/memory'
import type { RequestContext } from '@mastra/core/request-context'
import type { Turn } from '../model-accounts/public.ts'
import type { controllerOf } from './factories.ts'
import type { ControllerKind } from './kinds.ts'
import type { routedModel } from './model.ts'
import type { Taken } from './turns.ts'

/** One system message of an agent's instructions, in the order its ficha lists (C21 on `kind`). */
export type PromptPart =
  | Readonly<{ kind: 'FIXED'; text: string }>
  | Readonly<{ kind: 'TEXT'; text: string }>
  | Readonly<{
      kind: 'OF_RUN'
      of: (requestContext: RequestContext) => Promise<string | undefined>
    }>

/**
 * An agent's instructions (row 5): system messages in order, or, for the agent of a conversation
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
  take: (requestContext: RequestContext) => Promise<Turn | undefined>
}>

/**
 * ...or by the run alone, with no session to hold it: an agent that runs on its own (the version
 * the Construtor tests) takes its turn at the input and ends it with the call.
 */
type RunTurn = Readonly<{
  kind: 'RUN'
  id: string
  none: string
  resumes: boolean
  take: (requestContext: RequestContext) => Promise<Taken>
}>

export type TurnSource = SessionTurn | RunTurn

/** What an agent is made of: Mastra's `Agent` fields, filled by its ficha. */
export type AgentSpec = Readonly<{
  id: string
  name: string
  description?: string
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
export type ConversationSpec = Omit<AgentSpec, 'id' | 'memory' | 'turn'> &
  Readonly<{
    kind: ControllerKind
    turn: SessionTurn
    /** The controller's memory, where its threads live, and the agent's unless `memory` says another. */
    threads: MastraMemory
    /** The agent's own memory, when it is not the threads': the one a run's version keeps. */
    memory?: AgentConfig['memory']
    mode: ControllerInput['mode']
    /** The controller's own tools under native ids (`ask_user`, `submit_plan`). */
    own?: NonNullable<ControllerInput['tools']>
    workspace?: ControllerInput['workspace']
  }>
