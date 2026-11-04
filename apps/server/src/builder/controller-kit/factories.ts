import type { Agent, AgentConfig } from '@mastra/core/agent'
import type { AgentControllerConfig, BuiltinToolId } from '@mastra/core/agent-controller'
import { AgentController } from '@mastra/core/agent-controller'
import type { MastraMemory } from '@mastra/core/memory'
import type { InputProcessor, OutputProcessor } from '@mastra/core/processors'
import { CyberRefusalHandler } from '@mastra/core/processors'
import type { PostgresStore } from '@mastra/pg'
import type { QueueDeps } from '../model-accounts/public.ts'
import {
  accountErrorProcessors,
  accountPick,
  MAX_PROCESSOR_RETRIES,
} from '../model-accounts/public.ts'
import type { ControllerKind } from './kinds.ts'
import { CONTROLLER_KINDS } from './kinds.ts'

/**
 * Each model call's budget (code C57): a provider that sends nothing for a minute, or holds one
 * call ten minutes, fails the call instead of holding the turn and the shutdown's drain.
 */
export const MODEL_TIMEOUT = { firstChunkMs: 60_000, stepMs: 600_000 }

/**
 * Mastra saves a workspace tool's `data-workspace-metadata` chunk under the run's first message id,
 * over the sealed row a task signal left behind (Mastra issue #21940), and the row loses its
 * reasoning, text and tool parts. Nothing reads the chunk, so it is only streamed.
 */
const workspaceMetadataLive: OutputProcessor = {
  id: 'conexus-workspace-metadata-live',
  processDataParts: true,
  async processOutputStream({ part }) {
    return part.type === 'data-workspace-metadata' ? { ...part, transient: true } : part
  },
}

/** Every tool of the controller's own (`BuiltinToolId`), by the type, so a new one is not missed. */
const BUILTIN: Record<BuiltinToolId, true> = {
  ask_user: true,
  submit_plan: true,
  task_write: true,
  task_update: true,
  task_complete: true,
  task_check: true,
  subagent: true,
}

/**
 * What every conversation agent shares: the turn, then the account's pick; the account's errors;
 * Mastra retries nothing itself, the account processors retry; and the model call's budget.
 */
export function agentDefaults(
  queue: QueueDeps,
  turns: { processor: InputProcessor; deletedRun?: OutputProcessor },
) {
  return {
    inputProcessors: [turns.processor, accountPick(queue)],
    outputProcessors: [
      new CyberRefusalHandler(),
      workspaceMetadataLive,
      ...(turns.deletedRun === undefined ? [] : [turns.deletedRun]),
    ],
    errorProcessors: accountErrorProcessors(queue),
    maxRetries: 0,
    maxProcessorRetries: MAX_PROCESSOR_RETRIES,
    defaultOptions: { modelSettings: { timeout: MODEL_TIMEOUT } },
  } satisfies Pick<
    AgentConfig,
    | 'inputProcessors'
    | 'outputProcessors'
    | 'errorProcessors'
    | 'maxRetries'
    | 'maxProcessorRetries'
    | 'defaultOptions'
  >
}

/**
 * The controller of a conversation kind, under its key, on the Hub's store, with one mode. A tool
 * of the controller's own is off unless the mode offers it and the conversation brings none of the
 * same id: the conversation's own `tools` replace the native ones under their ids.
 */
export function controllerOf(input: {
  kind: ControllerKind
  storage: PostgresStore
  memory: MastraMemory
  agent: Agent
  /** A mode without `availableTools` filters nothing: its agent's tools are the closed set. */
  mode: { id: string; availableTools?: readonly string[] }
  workspace?: AgentControllerConfig['workspace']
  tools?: AgentControllerConfig['tools']
  initialState: Record<string, unknown>
}): AgentController {
  const { availableTools } = input.mode
  const offered = new Set(availableTools)
  const own = new Set(Object.keys(input.tools ?? {}))
  const off = Object.keys(BUILTIN).filter(
    (id): id is BuiltinToolId => Object.hasOwn(BUILTIN, id) && (!offered.has(id) || own.has(id)),
  )
  return new AgentController({
    id: CONTROLLER_KINDS[input.kind].id,
    storage: input.storage,
    memory: input.memory,
    agent: input.agent,
    modes: [
      availableTools === undefined
        ? { id: input.mode.id }
        : { id: input.mode.id, availableTools: [...availableTools] },
    ],
    ...(input.workspace === undefined ? {} : { workspace: input.workspace }),
    disableBuiltinTools: off,
    ...(input.tools === undefined ? {} : { tools: input.tools }),
    initialState: input.initialState,
  })
}
