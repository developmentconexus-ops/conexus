import { z } from 'zod'
import { ConnectorId } from './company-roles.ts'
import { ConnectionId } from './connectors.ts'

/** One connection a copy reads, by the name the company gave it and its connector. */
export const CopySource = z.object({
  connection: z.object({ id: ConnectionId, name: z.string(), connector: ConnectorId }),
})
export type CopySource = z.infer<typeof CopySource>

/** What a copy reads, as the list shows it: version 1's query, or version 2's list read with its label and fixed input. */
export const CopyOrigin = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('QUERY'), query: z.string() }),
  z.object({
    kind: z.literal('OPERATION'),
    operation: z.string(),
    label: z.string(),
    input: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  }),
])
export type CopyOrigin = z.infer<typeof CopyOrigin>

/** What the list shows of a definition, from the stored definition alone. */
export const CopyShown = z.object({
  source: CopyOrigin,
  key: z.array(z.string()),
  // What a pass rereads: the rows changed since the last one, and the window; both none reads the whole source.
  changedSince: z.object({ column: z.string() }).nullable(),
  window: z.object({ column: z.string(), days: z.int() }).nullable(),
  // The table's description and each column's, written by whoever wrote the definition; version 1 has none.
  description: z.string().nullable(),
  columns: z.array(
    z.object({ name: z.string(), type: z.string(), description: z.string().nullable() }),
  ),
})
export type CopyShown = z.infer<typeof CopyShown>
