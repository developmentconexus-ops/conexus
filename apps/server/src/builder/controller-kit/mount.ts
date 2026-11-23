import type { AgentConfig, AgentInstructions } from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import type { AgentController } from '@mastra/core/agent-controller'
import type { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { QueueDeps } from '../model-accounts/public.ts'
import { agentDefaults, controllerOf } from './factories.ts'
import { fixedSystem } from './instructions.ts'
import { CONTROLLER_KINDS } from './kinds.ts'
import { sessionModel } from './model.ts'
import type {
  AgentSpec,
  Approval,
  ConversationSpec,
  ModelSource,
  Prompt,
  PromptPart,
  TurnSource,
} from './spec.ts'
import { sessionTurns } from './turns.ts'

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
    default:
      return prompt.kind satisfies never
  }
}

function modelOf(model: ModelSource): AgentConfig['model'] {
  switch (model.kind) {
    case 'SESSION':
      return ({ requestContext }) => sessionModel(requestContext)
    default:
      return model.kind satisfies never
  }
}

function turnsOf(turn: TurnSource) {
  switch (turn.kind) {
    case 'SESSION':
      return sessionTurns({ id: turn.id, take: turn.take })
    default:
      return turn.kind satisfies never
  }
}

/** The session's starting state of a regime: `NOTHING_ASKS` is `{ yolo: true }`; one owner of the `yolo` (C26). */
function initialStateOf(approval: Approval): Readonly<{ yolo: boolean }> {
  switch (approval.kind) {
    case 'NOTHING_ASKS':
      return { yolo: true }
    default:
      return approval.kind satisfies never
  }
}

/**
 * The one place that calls Mastra's agent constructor for the agents on a ficha, with the turn's
 * processor made from `spec.turn`, and only the optional fields the ficha fills. `watch` comes with
 * a `SESSION` turn (`sessionTurns`): `mountAgent` calls it with the controller.
 */
function agentOfSpec(
  spec: AgentSpec,
  deps: { queue: QueueDeps },
): Readonly<{ agent: Agent; watch?: (controller: AgentController) => void }> {
  const turns = turnsOf(spec.turn)
  const config: AgentConfig = {
    id: spec.id,
    name: spec.name,
    instructions: instructionsOf(spec.prompt),
    model: modelOf(spec.model),
    tools: ({ requestContext }) => spec.tools(requestContext),
    ...agentDefaults(deps.queue, turns),
    memory: spec.memory,
    ...(spec.skills === undefined ? {} : { skills: spec.skills }),
    ...(spec.signals === undefined ? {} : { signals: spec.signals }),
    ...(spec.scopes === undefined ? {} : { scopes: spec.scopes }),
    ...(spec.knowledge === undefined ? {} : { knowledge: spec.knowledge }),
  }
  switch (spec.base) {
    case 'AGENT':
      return { agent: new Agent(config), watch: turns.watch }
    default:
      return spec.base satisfies never
  }
}

/** A conversation's agent and controller on the kit: `agentOfSpec`, `controllerOf` with the approval's `yolo`, and the session's turns watched. */
export function mountAgent(
  spec: ConversationSpec,
  deps: { queue: QueueDeps; storage: MastraCompositeStore },
): Readonly<{ agent: Agent; controller: AgentController }> {
  const { kind, threads, mode, own, workspace, ...fields } = spec
  const { agent, watch } = agentOfSpec(
    { ...fields, id: CONTROLLER_KINDS[kind].id, memory: threads },
    deps,
  )
  const controller = controllerOf({
    ...{ kind, storage: deps.storage, memory: threads, agent, mode, workspace, tools: own },
    initialState: initialStateOf(spec.approval),
  })
  watch?.(controller)
  return { agent, controller }
}
