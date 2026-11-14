import type { ConnectionId } from '@conexus/hub-api'
import { BUILDER_TOOL } from '@conexus/hub-api'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { SearchText } from '../../hub/connectors/public.ts'
import type { InventorySearch } from '../../hub/ontology/public.ts'

/** What a search of the inventory is asked: the connection and the words; the company is the caller's. */
export type InventoryCall = {
  connectionId: ConnectionId
  text: string
  kind?: 'TABLE' | 'FIELD' | 'CODE' | 'OPERATION' | undefined
  limit: number
}

/** A search of what a connection's system declares about itself, bound to a company by who builds it. */
export type InventoryAsk = (call: InventoryCall) => Promise<InventorySearch>

/** The connection the call names, none, or the answer that says it is ambiguous. */
type Resolve = (
  connection: string,
  connector: string | undefined,
) => { connectionId: ConnectionId } | { kind: string } | undefined

/**
 * `inventory_search`: the entries of a connection's inventory (tables, fields, codes and
 * operations) whose name or label holds the text, with the type, the label and whether the
 * company's own. Nothing is asked of the system.
 */
export function inventorySearchTool(a: {
  connection: z.ZodType<string>
  connector: z.ZodType<string | undefined>
  resolve: Resolve
  notGranted: { kind: 'NOT_GRANTED' }
  ask: InventoryAsk
}) {
  return {
    [BUILDER_TOOL.inventorySearch]: createTool({
      id: BUILDER_TOOL.inventorySearch,
      description:
        "Searches what a connection's system declares about itself: its tables, fields, the meaning of each coded value and its operations, read when the connection was linked. Read it before you ask the person what a field or a code means; it holds names, types and labels, never a value of the company's data. `EMPTY` means it was not read yet.",
      inputSchema: z.object({
        connection: a.connection,
        connector: a.connector,
        text: SearchText.describe(
          'A word of the name or of the label, such as "tipo" or "CODVEND"',
        ),
        kind: z.enum(['TABLE', 'FIELD', 'CODE', 'OPERATION']).optional(),
        limit: z.int().min(1).max(50).default(20),
      }),
      execute: async ({ connection, connector, text, kind, limit }) => {
        const found = a.resolve(connection, connector)
        if (found === undefined) return a.notGranted
        if (!('connectionId' in found)) return found
        return a.ask({ connectionId: found.connectionId, text, kind, limit })
      },
    }),
  }
}
