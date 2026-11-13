import { z } from 'zod'
import type { Connector } from './definition.ts'
import { inProbeOrder } from './definition.ts'
import type { Operation } from './operation.ts'

export const InventoryKind = z.enum(['TABLE', 'FIELD', 'CODE', 'OPERATION'])

/** One thing a system declares about itself: names, types and labels, never a row of the company's data. */
export const InventoryEntrySchema = z.object({
  kind: InventoryKind,
  name: z.string().min(1).max(200), // TABELA, TABELA.CAMPO, TABELA.CAMPO=valor, or the operation's id
  type: z.string().max(20).nullable(),
  label: z.string().max(200).nullable(),
  custom: z.boolean(),
})
export type InventoryEntry = Readonly<z.infer<typeof InventoryEntrySchema>>

export const InventoryPageSchema = z.object({
  entries: z.array(InventoryEntrySchema),
  next: z.string().nullable(),
})
export type InventoryPage = Readonly<{ entries: readonly InventoryEntry[]; next: string | null }>

/** The input of one page: the cursor an earlier page gave, null for the first. */
export const InventoryInput = z.object({
  cursor: z.string().max(500).nullable(),
  limit: z.number().int().min(1).max(500),
})

/** One read of a system's dictionary, paged; outside `operations`, so no role, tool or probe sees it (as `copy`). */
export type ConnectorInventory = Readonly<{
  read: Operation<{ cursor: string | null; limit: number }, InventoryPage, 'read'>
}>

/** The entries of a connector with no dictionary: its declared operations, no call. */
export function declaredInventory(connector: Connector): InventoryEntry[] {
  return [...inProbeOrder(connector), ...(connector.writes ?? [])].map((operation) => ({
    kind: 'OPERATION',
    name: operation.id,
    type: operation.class,
    label: operation.label.slice(0, 200),
    custom: false,
  }))
}
