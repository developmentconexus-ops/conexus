import type { ConnectionId } from '@conexus/hub-api'
import { BUILDER_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Connectors } from '../../hub/connectors/public.ts'

type ProposeAnswer = Awaited<ReturnType<Connectors['builder']['propose']>>

/** The proposal's call as the Builder's access sends it: the connections, the name, the label and the definition. */
export type ProposeCall = (
  call: {
    connections: readonly ConnectionId[]
    name: string
    label: string
    definition: unknown
    signal: AbortSignal | undefined
  },
  requestContext: RequestContext,
) => Promise<ProposeAnswer>

type Granted = Awaited<ReturnType<Connectors['builder']['granted']>>[number]
type Copying = Pick<Granted, 'connectionId' | 'connector' | 'name' | 'reads'>

/**
 * The six questions the Builder answers before it proposes (Nango's "For agents": paging, the
 * incremental filter, what is deleted, how often), in order, then how a definition is written. No
 * system is named: the reads below and the connection's skill say how each one lists.
 */
const COPY_PROPOSE_DESCRIPTION = [
  'Proposes a copy of company data the app needs: a definition the company keeps, read from the connections into `sync.<name>`, which the app then reads through `db`. Answer six questions first, in this order.',
  '1. Keep it or read it live? A list, a history, a sum or a cross of rows is a copy; a write, or a query whose parameter is not data the copy keeps, is read live.',
  '2. Does it exist? Look in the "## Data" block: a copy released here, use it; one not released here, ask the owner to release it; never propose a copy that exists.',
  '3. From which read, with which filter? The narrowest read that lists rows and covers the app (below); a fixed input only when the app will never want the rest.',
  '4. Which key? The id the system gives the row; the proof refuses a key that is null or repeated.',
  "5. Which mode? A read with no change filter is a whole copy (the definition without `changedSince`); with one, only the changed rows (`changedSince` on the column whose `path` is the read's change field), unless more than 10% of the rows change at each run, which asks for a whole copy. Measure the fraction with `connector_read`: count the rows whose change date falls within one interval of the copy against the total. A window of days is only a query's. Say which mode you chose and why.",
  '6. How often? The longest interval the screen bears: the proof answers the calls a whole pass spends, and an expensive copy asks for a longer interval.',
  'The fields the app uses become columns; the obvious neighbours (dates, status, linking ids) may come along; a nested part enters as `json` only when the app reads it. Write the description of the table and of each column. Name it after the system and the data (`<system>_<data>`). The accounts of one connector go in one copy, each connection in `connections`, unless the app asks for them apart.',
  'A read that lists rows takes version 2: { version: 2, source: { kind: "OPERATION", operation, input }, description, columns: [{ name, type, path, description }], key, changedSince }. A connector that copies by query takes version 1: { version: 1, source: { kind: "QUERY", sql }, columns, key, changedSince, window }, on one connection.',
  'Proposing proves each connection with a page or two of the read and keeps only counts, never a row. The proposal appears in this conversation and on the Cópias page, and whoever may turn copies on turns it on there; you never turn it on. Tell the person the proposal is there and go on with what does not depend on it.',
].join('\n')

function pagingText(list: NonNullable<Copying['reads'][number]['list']>): string {
  const ceiling = list.ceiling === null ? '' : `, at most ${list.ceiling} rows`
  const changed = list.changed === null ? 'no change filter' : `changes by \`${list.changed}\``
  return `pages by ${list.paging.toLowerCase()}${ceiling}, ${changed}`
}

/** The reads that list rows, by connection, as the model writes `source.operation` from them. */
function listReads(connections: readonly Copying[]): string {
  const lines = connections.flatMap((each) => {
    const listed = each.reads.flatMap((read) =>
      read.list === null ? [] : [`  - ${read.operation} (${read.label}): ${pagingText(read.list)}`],
    )
    return listed.length === 0
      ? []
      : [`- Connection "${each.name}" (${each.connector}):`, ...listed]
  })
  return lines.length === 0 ? '' : ['Reads that list rows:', ...lines].join('\n')
}

/** The connections the names say, of one connector; the connector named when two systems share a name. */
function named(connections: readonly Copying[], names: readonly string[], connector?: string) {
  const found: Copying[] = []
  for (const name of names) {
    const same = connections.filter(
      (each) => each.name === name && (connector === undefined || each.connector === connector),
    )
    if (same.length > 1) return 'AMBIGUOUS' as const
    const [one] = same
    if (one === undefined) return undefined
    found.push(one)
  }
  return found
}

/**
 * `copy_propose` (Capacidade 3, U3; O Sync de qualquer conector, U4), offered only when a granted
 * connection's connector copies or declares a read that lists rows; {} otherwise. The definition
 * reaches the Hub as written, `z.unknown()`, so `CopyDefinition`'s own paths and messages come back
 * to the model.
 */
export function copyProposeTool(connections: readonly Copying[], propose: ProposeCall): ToolsInput {
  const [first, ...rest] = [...new Set(connections.map((each) => each.name))]
  if (first === undefined) return {}
  const reads = listReads(connections)
  return {
    [BUILDER_TOOL.copyPropose]: createTool({
      id: BUILDER_TOOL.copyPropose,
      description:
        reads === '' ? COPY_PROPOSE_DESCRIPTION : `${COPY_PROPOSE_DESCRIPTION}\n${reads}`,
      inputSchema: z.object({
        connections: z
          .array(z.enum([first, ...rest]))
          .min(1)
          .describe("The connections' names, exactly as listed, all of one connector"),
        connector: z
          .string()
          .optional()
          .describe('The connector, needed when two connections share the name'),
        name: z
          .string()
          .max(40)
          .describe('The table in `sync`: lowercase letters, digits and _, starting with a letter'),
        label: z.string().min(1).max(120).describe('What the copy holds, in the person’s words'),
        definition: z.unknown().describe('The copy definition, version 2 or version 1 as above'),
      }),
      execute: async (
        { connections: names, connector, name, label, definition },
        { requestContext, abortSignal },
      ) => {
        const found = named(connections, names, connector)
        if (found === 'AMBIGUOUS') return { kind: 'AMBIGUOUS_CONNECTION' } as const
        if (found === undefined || requestContext === undefined)
          return { kind: 'NOT_GRANTED' } as const
        const ids = found.map((each) => each.connectionId)
        return propose(
          { connections: ids, name, label, definition, signal: abortSignal },
          requestContext,
        )
      },
    }),
  }
}
