import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'

/** The ids the eight tools of a workflow have in `new Mastra({ tools })`, the one list the compilation and the registration share. */
export const WORKFLOW_TOOL = {
  check: 'conexus-conferir',
  read: 'conexus-ler',
  agent: 'conexus-agente',
  approval: 'conexus-aprovar',
  write: 'conexus-escrever',
  notify: 'conexus-avisar',
  count: 'conexus-contar',
  /** Only the READ `many` right before a FOREACH: it answers `resultado.linhas`, the raw list. */
  readMany: 'conexus-ler-lista',
} as const

/**
 * What the counter reads of the Hub: the `max` of the Repetir at an address of the version the
 * run runs, which the run's request context names. Inside a nested workflow Mastra gives a tool only
 * the step id of that workflow (`b1_0`), never the id it was registered under, so the address is the
 * one thing the mapping before the counter carries.
 */
export type LoopLimit = (address: string, requestContext: unknown) => Promise<number | null>

/** A balloon's input as the mapping before it builds it: its id, and one key for each value it uses. */
const BalloonInput = z.object({ balloon: z.string() }).catchall(z.unknown())
const Carried = z.object({ balloon: z.string(), volta: z.int().nonnegative() }).passthrough()

/** What a balloon's tool does with its input, under the run's request context; the output is read back by the tool's schema. */
export type Executor = (
  input: Readonly<Record<string, unknown>>,
  requestContext: unknown,
) => Promise<unknown>

export type Executors = Readonly<
  Record<
    | typeof WORKFLOW_TOOL.check
    | typeof WORKFLOW_TOOL.read
    | typeof WORKFLOW_TOOL.readMany
    | typeof WORKFLOW_TOOL.agent
    | typeof WORKFLOW_TOOL.approval
    | typeof WORKFLOW_TOOL.write
    | typeof WORKFLOW_TOOL.notify,
    Executor
  >
>

/** Until the executor of step 24.6 (U3) exists, a tool that runs fails loudly: it never answers as if it had worked. */
function notBuilt(): Promise<never> {
  return Promise.reject(
    new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'WORKFLOW_TOOL_NOT_BUILT' } }),
  )
}

export const NOT_BUILT: Executors = {
  [WORKFLOW_TOOL.check]: notBuilt,
  [WORKFLOW_TOOL.read]: notBuilt,
  [WORKFLOW_TOOL.readMany]: notBuilt,
  [WORKFLOW_TOOL.agent]: notBuilt,
  [WORKFLOW_TOOL.approval]: notBuilt,
  [WORKFLOW_TOOL.write]: notBuilt,
  [WORKFLOW_TOOL.notify]: notBuilt,
}

function balloonTool(
  id: string,
  input: z.ZodType<Record<string, unknown>>,
  output: z.ZodType,
  execute: Executor,
): ReturnType<typeof createTool> {
  return createTool({
    id,
    description: `Balão de workflow do Conexus (${id}).`,
    inputSchema: input,
    outputSchema: output,
    execute: async (data, context) => output.parse(await execute(data, context.requestContext)),
  })
}

function counter(limit: LoopLimit): ReturnType<typeof createTool> {
  return createTool({
    id: WORKFLOW_TOOL.count,
    description: 'Conta uma volta do Repetir e para na última que o balão deixa.',
    inputSchema: Carried,
    outputSchema: Carried,
    execute: async (input, context) => {
      const max = await limit(input.balloon, context.requestContext)
      if (max === null)
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'LOOP_BALLOON_MISSING' } })
      const volta = input.volta + 1
      if (volta > max) throw new Failure('WORKFLOW_LOOP_LIMIT')
      return { ...input, volta }
    },
  })
}

/** The eight tools a published workflow runs through, by their ids; the counter's body is here, the seven others come from the executor. */
export function workflowTools(deps: { limit: LoopLimit; executors: Executors }) {
  const { limit, executors } = deps
  return {
    [WORKFLOW_TOOL.check]: balloonTool(
      WORKFLOW_TOOL.check,
      z.object({}).passthrough(),
      z.object({ dia: z.string() }).passthrough(),
      executors[WORKFLOW_TOOL.check],
    ),
    [WORKFLOW_TOOL.read]: balloonTool(
      WORKFLOW_TOOL.read,
      BalloonInput,
      z.object({ resultado: z.unknown() }),
      executors[WORKFLOW_TOOL.read],
    ),
    [WORKFLOW_TOOL.readMany]: balloonTool(
      WORKFLOW_TOOL.readMany,
      BalloonInput,
      z.array(z.record(z.string(), z.unknown())),
      executors[WORKFLOW_TOOL.readMany],
    ),
    [WORKFLOW_TOOL.agent]: balloonTool(
      WORKFLOW_TOOL.agent,
      BalloonInput,
      z.object({ texto: z.string(), conversationId: z.string() }),
      executors[WORKFLOW_TOOL.agent],
    ),
    [WORKFLOW_TOOL.approval]: balloonTool(
      WORKFLOW_TOOL.approval,
      BalloonInput,
      z.object({ aprovado: z.boolean(), por: z.string() }),
      executors[WORKFLOW_TOOL.approval],
    ),
    [WORKFLOW_TOOL.write]: balloonTool(
      WORKFLOW_TOOL.write,
      BalloonInput,
      z.object({ resultado: z.unknown(), marca: z.string() }),
      executors[WORKFLOW_TOOL.write],
    ),
    [WORKFLOW_TOOL.notify]: balloonTool(
      WORKFLOW_TOOL.notify,
      BalloonInput,
      z.object({ avisados: z.array(z.string()) }),
      executors[WORKFLOW_TOOL.notify],
    ),
    [WORKFLOW_TOOL.count]: counter(limit),
  }
}
