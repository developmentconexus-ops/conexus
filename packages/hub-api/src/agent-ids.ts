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

/** The published version that spoke in a write, kept in the record of the send; a draft has none (card 24.5, U1). */
export const VersionId = z.uuid().brand('VersionId')
export type VersionId = z.infer<typeof VersionId>
