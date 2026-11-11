import type { ConnectionId } from '@conexus/hub-api'
import { BUILDER_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Connectors } from '../../hub/connectors/public.ts'

type ProposeAnswer = Awaited<ReturnType<Connectors['builder']['propose']>>

/** The proposal's call as the Builder's access sends it: the connection, the name, the label and the definition. */
export type ProposeCall = (
  call: {
    connectionId: ConnectionId
    name: string
    label: string
    definition: unknown
    signal: AbortSignal | undefined
  },
  requestContext: RequestContext,
) => Promise<ProposeAnswer>

type Copying = Readonly<{ connectionId: ConnectionId; connector: string; name: string }>

/**
 * What the model is told: investigate first, choose the mode by the rule of thumb and measure it,
 * say which mode and why; the proof keeps a count; the proposal is turned on by a person, in the
 * conversation's card or on the Cópias page. No system is named: the connection's skill says how.
 */
const COPY_PROPOSE_DESCRIPTION = [
  'Proposes a copy of company data the app needs and the Projeto has no copy of: a definition the company keeps, read from the connection into `sync.<name>`, which the app then reads.',
  "Investigate the connection's system with `connector_read` first: the source query, its columns and types, a bigint key, and a column with the date each row changed.",
  'Choose the mode by the rule of thumb: a whole copy (the definition without `changedSince`) when more than 10% of the rows change at each run; a window of days (`changedSince` and `window`) or only the changed rows (`changedSince` alone) otherwise.',
  'Measure the fraction with `connector_read`: count the rows whose change date falls within one interval of the copy against the total. With no column of the change date, the copy is whole. Say which mode you chose and why.',
  'Proposing runs one page of proof through the copy read and keeps only the count of its rows, never a row.',
  'The proposal appears in this conversation and on the Cópias page, and whoever may turn copies on turns it on there; you never turn it on. Tell the person the proposal is there and go on with what does not depend on it.',
].join('\n')

/** The connection a name says; the connector too when the call names one, since two systems may share a name. */
function named(connections: readonly Copying[], name: string, connector?: string) {
  const same = connections.filter((each) => each.name === name)
  if (connector === undefined && same.length > 1) return 'AMBIGUOUS' as const
  return same.find((each) => connector === undefined || each.connector === connector)
}

/**
 * `copy_propose` (Capacidade 3, U3), offered only when a granted connection's connector copies; {}
 * otherwise. The definition reaches the Hub as written, `z.unknown()`, so `CopyDefinition`'s own
 * paths and messages come back to the model.
 */
export function copyProposeTool(connections: readonly Copying[], propose: ProposeCall): ToolsInput {
  const [first, ...rest] = [...new Set(connections.map((each) => each.name))]
  if (first === undefined) return {}
  return {
    [BUILDER_TOOL.copyPropose]: createTool({
      id: BUILDER_TOOL.copyPropose,
      description: COPY_PROPOSE_DESCRIPTION,
      inputSchema: z.object({
        connection: z.enum([first, ...rest]).describe("The connection's name, exactly as listed"),
        connector: z
          .string()
          .optional()
          .describe('The connector, needed when two connections share the name'),
        name: z
          .string()
          .max(40)
          .describe('The table in `sync`: lowercase letters, digits and _, starting with a letter'),
        label: z.string().min(1).max(120).describe('What the copy holds, in the person’s words'),
        definition: z
          .unknown()
          .describe(
            'The copy definition: version 1, source { kind: "QUERY", sql }, columns, key, changedSince, window',
          ),
      }),
      execute: async (
        { connection, connector, name, label, definition },
        { requestContext, abortSignal },
      ) => {
        const found = named(connections, connection, connector)
        if (found === 'AMBIGUOUS') return { kind: 'AMBIGUOUS_CONNECTION' } as const
        if (found === undefined || requestContext === undefined)
          return { kind: 'NOT_GRANTED' } as const
        return propose(
          { connectionId: found.connectionId, name, label, definition, signal: abortSignal },
          requestContext,
        )
      },
    }),
  }
}
