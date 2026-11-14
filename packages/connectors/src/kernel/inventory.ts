import { z } from 'zod'
import type { Operation } from './operation.ts'

const InventoryKind = z.enum(['TABLE', 'FIELD', 'CODE', 'OPERATION'])

/**
 * One thing a system declares about itself: names, types and labels, never a row of the company's data.
 * TABLE is what the source keeps (a table, an API object, a sheet), FIELD a column or property, CODE one
 * value a field allows, OPERATION the id of a declared operation.
 */
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

/** What the source says of itself (a dictionary, a database catalog or a metadata endpoint), read in pages; outside `operations`, so no role, tool or probe sees it (as `copy`). */
export type ConnectorInventory = Readonly<{
  read: Operation<{ cursor: string | null; limit: number }, InventoryPage, 'read'>
}>
