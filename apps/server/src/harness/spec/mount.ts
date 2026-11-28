import type { AgentConfig, AgentInstructions, ToolsInput } from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import type { AgentController } from '@mastra/core/agent-controller'
import type { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { QueueDeps } from '../model-accounts/public.ts'
import { fixedSystem } from '../prompt/public.ts'
import { agentDefaults, controllerOf } from './factories.ts'
import { CONTROLLER_KINDS } from './kinds.ts'
import { sessionModel } from './model.ts'
import { refuseUnaskedResume } from './resume.ts'
import type {
  AgentSpec,
  Approval,
  ConversationSpec,
  ModelSource,
  Prompt,
  PromptPart,
  TurnSource,
} from './spec.ts'
import { sessionTurns, turnProcessor } from './turns.ts'

/** The parts as system messages, in order: each `OF_RUN` read first, all together; one that gives nothing is left out. */
async function messagesOf(
  parts: readonly PromptPart[],
  requestContext: RequestContext,
): Promise<AgentInstructions> {
  const ofRun = await Promise.all(
    parts.map((part) => (part.kind === 'OF_RUN' ? part.of(requestContext) : undefined)),
  )
  return parts.flatMap((part, at) => {
    switch (part.kind) {
      case 'FIXED':
        return [fixedSystem(part.text)]
      case 'TEXT':
        return [{ role: 'system', content: part.text } as const]
      case 'BY_MODEL': {
        const content = part.blocks[sessionModel(requestContext)]
        return content === undefined ? [] : [{ role: 'system', content } as const]
      }
      case 'OF_RUN': {
        const content = ofRun[at]
        return content === undefined ? [] : [{ role: 'system', content } as const]
      }
      default:
        return part satisfies never
    }
  })
}

function instructionsOf(prompt: Prompt): AgentConfig['instructions'] {
  switch (prompt.kind) {
    case 'MESSAGES':
      return ({ requestContext }) => messagesOf(prompt.parts, requestContext)
    case 'DELEGATED':
      return ({ requestContext }) => prompt.of(requestContext)
    default:
      return prompt satisfies never
  }
}

function modelOf(model: ModelSource): AgentConfig['model'] {
  switch (model.kind) {
    case 'SESSION':
      return ({ requestContext }) => sessionModel(requestContext)
    case 'OF_RUN':
      return ({ requestContext }) => model.of(requestContext)
    default:
      return model satisfies never
  }
}

/** The turn's processor, and for a session's turn the end it owns: `deletedRun` and `watch`. */
function turnsOf(turn: TurnSource) {
  switch (turn.kind) {
    case 'SESSION':
      return sessionTurns({ id: turn.id, take: turn.take })
    case 'RUN':
      return { processor: turnProcessor(turn) }
    default:
      return turn satisfies never
  }
}

/** A tool's own rule beats the session's (row 10): the rule of every tool that `THE_WRITE_ASKS` leaves alone. */
export function NEVER_ASKS() {
  return false
}

/**
 * The tools of a ficha whose write asks: each tool whose `requireApproval` is not a function
 * (`createTool` sets `false` when none is given, `@mastra/core` 1.86.0 `tool-Z3bykc1m.js:1048`) as a copy with
 * `NEVER_ASKS`; a tool whose rule is a function as it is (only a function beats the session,
 * `C/loop/workflows/agentic-execution/tool-approval-verdict.ts:85-93`); the given objects unchanged.
 * The copy keeps the tool's prototype, so it stays the same kind of tool; the given object is not touched,
 * so the ones the Builder shares (`web_fetch`) keep their rule.
 */
function askingOnlyByOwnRule(tools: ToolsInput): ToolsInput {
  return Object.fromEntries(
    Object.entries(tools).map(([id, tool]) => [
      id,
      'requireApproval' in tool && typeof tool.requireApproval === 'function'
        ? tool
        : Object.assign(Object.create(Object.getPrototypeOf(tool)), tool, {
            requireApproval: NEVER_ASKS,
          }),
    ]),
  )
}

async function toolsOfSpec(
  spec: Pick<AgentSpec, 'tools' | 'approval'>,
  requestContext: RequestContext,
): Promise<ToolsInput> {
  const tools = await spec.tools(requestContext)
  switch (spec.approval.kind) {
    case 'NOTHING_ASKS':
      return tools
    case 'THE_WRITE_ASKS':
      return askingOnlyByOwnRule(tools)
    default:
      return spec.approval satisfies never
  }
}

/** The session's starting state of a regime: `NOTHING_ASKS` is `{ yolo: true }`, `THE_WRITE_ASKS` `{ yolo: false }`; one owner of the `yolo` (C26). */
export function initialStateOf(approval: Approval): Readonly<{ yolo: boolean }> {
  switch (approval.kind) {
    case 'NOTHING_ASKS':
      return { yolo: true }
    case 'THE_WRITE_ASKS':
      return { yolo: false }
    default:
      return approval satisfies never
  }
}

/**
 * The one place that calls Mastra's agent constructor for the agents on a ficha, with the turn's
 * processor made from `spec.turn`, the tools under the ficha's regime, `refuseUnaskedResume` before
 * each tool call, the judge as the default `isTaskComplete`, and only the optional fields the ficha
 * fills. `watch` comes with a `SESSION` turn (`sessionTurns`): `mountAgent` calls it with the
 * controller; a `RUN` turn has none.
 */
export function agentOfSpec(
  spec: AgentSpec,
  deps: { queue: QueueDeps },
): Readonly<{ agent: Agent; watch?: (controller: AgentController) => void }> {
  const { prompt, model, tools, approval, memory, turn, processors, judge, ...native } = spec
  const turns = turnsOf(turn)
  const defaults = agentDefaults(deps.queue, turns, processors)
  const config: AgentConfig = {
    ...native,
    instructions: instructionsOf(prompt),
    model: modelOf(model),
    tools: ({ requestContext }) => toolsOfSpec({ tools, approval }, requestContext),
    ...defaults,
    hooks: { beforeToolCall: refuseUnaskedResume },
    ...(judge === undefined
      ? {}
      : { defaultOptions: { ...defaults.defaultOptions, isTaskComplete: judge } }),
    memory,
  }
  return {
    agent: new Agent(config),
    ...('watch' in turns ? { watch: turns.watch } : {}),
  }
}

/** A conversation's agent and controller on the kit: `agentOfSpec`, `controllerOf` with the approval's `yolo`, and the session's turns watched. */
export function mountAgent(
  spec: ConversationSpec,
  deps: { queue: QueueDeps; storage: MastraCompositeStore },
): Readonly<{ agent: Agent; controller: AgentController }> {
  const { kind, threads, memory, mode, own, workspace, subagents, ...fields } = spec
  const { agent, watch } = agentOfSpec(
    { ...fields, id: CONTROLLER_KINDS[kind].id, memory: memory ?? threads },
    deps,
  )
  const controller = controllerOf({
    ...{
      kind,
      storage: deps.storage,
      memory: threads,
      agent,
      mode,
      workspace,
      tools: own,
      subagents,
    },
    initialState: initialStateOf(spec.approval),
  })
  watch?.(controller)
  return { agent, controller }
}
