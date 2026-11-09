import type { Mastra } from '@mastra/core/mastra'
import type { DynamicWorkflowGraph } from '@mastra/core/workflows'
import { z } from 'zod'

/** What `validateDynamicWorkflow` knows about its surroundings. */
export type RegistryIndex = NonNullable<
  Parameters<typeof import('@mastra/core/workflows').validateDynamicWorkflow>[1]
>

type Schemas = NonNullable<RegistryIndex['tools']>[string]

function isZod(schema: unknown): schema is z.ZodType {
  return typeof schema === 'object' && schema !== null && '_zod' in schema
}

/** A tool's schema as JSON Schema, or nothing when it has none: the validator then reads it as unknown, never as incompatible. */
function jsonOf(schema: unknown): Schemas['inputSchema'] {
  return isZod(schema) ? z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) : undefined
}

/**
 * The index the validation of a version's definitions reads: the tools this Mastra holds, and the
 * definitions of the same version (each path is a workflow its parent names). No `agents` key: the
 * workflow runs an agent through `conexus-agente`, never a Mastra agent, so the validator skips that check.
 */
export function registryIndexOf(
  mastra: Mastra,
  bundle: readonly DynamicWorkflowGraph[],
): RegistryIndex {
  const tools: Record<string, Schemas> = {}
  for (const [key, tool] of Object.entries(mastra.listTools() ?? {})) {
    tools[key] = {
      inputSchema: jsonOf(tool.inputSchema),
      outputSchema: jsonOf(tool.outputSchema),
    }
  }
  const workflows: Record<string, Schemas> = {}
  for (const def of bundle) {
    workflows[def.id] = { inputSchema: def.inputSchema, outputSchema: def.outputSchema }
  }
  return { tools, workflows }
}
