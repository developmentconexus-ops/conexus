import { z } from 'zod'

/**
 * The ids of an agent, a tool of the company's library and one version of it (step 24.3, U1), in a
 * file of their own so that `agents.ts` and `tools.ts` share them without a cycle.
 */
export const AgentId = z.uuid().brand('AgentId')
export type AgentId = z.infer<typeof AgentId>

export const ToolId = z.uuid().brand('ToolId')
export type ToolId = z.infer<typeof ToolId>

export const ToolVersionId = z.uuid().brand('ToolVersionId')
export type ToolVersionId = z.infer<typeof ToolVersionId>
