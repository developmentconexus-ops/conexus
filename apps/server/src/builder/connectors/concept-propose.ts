import type { ConceptProposed, ConnectionId } from '@conexus/hub-api'
import { BUILDER_TOOL, Demand, ProposedItem } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'

/** What proposing answers the model: the proposal, the connection's refusal, or a database that did not answer (it proposed nothing). */
export type ConceptProposeAnswer =
  | ConceptProposed
  | Readonly<{ kind: 'NOT_GRANTED' }>
  | Readonly<{ kind: 'DATABASE_UNAVAILABLE' }>

/** The call as the agent's access sends it: the connection resolved, the demand and the items. */
export type ConceptProposeCall = (
  call: { connectionId: ConnectionId; demand: string; items: readonly ProposedItem[] },
  requestContext: RequestContext,
) => Promise<ConceptProposeAnswer>

/** The connection a call names, among the scope's; the connector when two share the name. */
type Resolve = (
  connection: string,
  connector: string | undefined,
) => { connectionId: ConnectionId } | { kind: string } | undefined

const DESCRIPTION = [
  "Proposes what you proved about a connection's system as the company's concepts: the things of the business, their fields, the meaning of each code, the named links between them and the query each one is read by. Nothing counts until a person approves it on the Conhecimento page; tell the person the proposal is there.",
  'Each item is proved now and refused on its own when the proof fails; the answer lists what was kept and what was refused, with why. A source (`SET_SOURCE`) runs its query to count the rows and see the columns, never a row; a field must be a column that proof saw; a new code must appear in the data; a code the inventory_search found keeps that entry in `dictionary`.',
  'Calls of one conversation add to its one open proposal. Search the inventory first, and ask the person only what the data cannot settle.',
  'A role is either a slice of a base concept (`base`: the same key, its own read, proved a subset of the base) or a concept with its own key, linked to the other. Choose by what the inventory and the proof show, never by a fixed rule; ask the person only what the data cannot settle.',
].join('\n')

/** `concept_propose` for the connections of a scope (A Ontologia da empresa, U3), the Builder's and the Assistant's. */
export function conceptProposeTool(a: {
  connection: z.ZodType<string>
  connector: z.ZodType<string | undefined>
  resolve: Resolve
  call: ConceptProposeCall
}) {
  return {
    [BUILDER_TOOL.conceptPropose]: createTool({
      id: BUILDER_TOOL.conceptPropose,
      description: DESCRIPTION,
      inputSchema: z.object({
        connection: a.connection,
        connector: a.connector,
        demand: Demand.describe('What the person asked for, in their words'),
        items: z.array(ProposedItem).min(1).max(40),
      }),
      execute: async ({ connection, connector, demand, items }, { requestContext }) => {
        const found = a.resolve(connection, connector)
        if (found === undefined || requestContext === undefined) return { kind: 'NOT_GRANTED' }
        if (!('connectionId' in found)) return found
        try {
          return await a.call({ connectionId: found.connectionId, demand, items }, requestContext)
        } catch (error) {
          if (error instanceof Failure && error.code === 'DATABASE_UNAVAILABLE')
            return { kind: 'DATABASE_UNAVAILABLE' }
          throw error
        }
      },
    }),
  }
}
