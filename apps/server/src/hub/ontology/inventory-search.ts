import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm'
import type { Database, ReadTx } from '../../platform/database.ts'
import type { InventoryEntry } from '../connectors/public.ts'
import { companyScope } from './inventory.ts'
import { inventoryEnd, inventoryEntry, inventoryRun } from './tables.ts'

export type InventorySearchInput = Readonly<{
  companyId: CompanyId
  connectionId: ConnectionId
  text: string
  kind?: InventoryEntry['kind'] | undefined
  limit: number
}>

/** The entries that match, one more than `limit` read to know there are more; `EMPTY` when the connection has no finished run. */
export type InventorySearch =
  | Readonly<{ kind: 'OK'; readAt: string; entries: InventoryEntry[]; more: boolean }>
  | Readonly<{ kind: 'EMPTY' }>

/** The text as a `LIKE` pattern that means it literally: `%`, `_` and the escape itself escaped. */
function containing(text: string): string {
  return `%${text.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
}

/** The run the inventory is read from: the newest COMPLETE, else the newest PARTIAL; none before one finished. */
export async function shownRunOf(
  tx: ReadTx,
  ids: Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>,
) {
  const [run] = await tx
    .select({ id: inventoryRun.id, endedAt: inventoryEnd.endedAt })
    .from(inventoryRun)
    .innerJoin(inventoryEnd, eq(inventoryEnd.runId, inventoryRun.id))
    .where(
      and(
        eq(inventoryRun.companyId, ids.companyId),
        eq(inventoryRun.connectionId, ids.connectionId),
        sql`${inventoryEnd.outcome} IN ('COMPLETE', 'PARTIAL')`,
      ),
    )
    .orderBy(sql`(${inventoryEnd.outcome} = 'COMPLETE') DESC`, sql`${inventoryEnd.endedAt} DESC`)
    .limit(1)
  return run
}

/**
 * The entries of the connection's inventory (the newest COMPLETE run, else the newest PARTIAL) whose
 * name or label holds the text. No call to the system: the agents read what the run already kept.
 */
export async function searchInventory(
  database: Database,
  input: InventorySearchInput,
): Promise<InventorySearch> {
  return database.read(companyScope(input.companyId), async (tx) => {
    const run = await shownRunOf(tx, input)
    if (run === undefined) return { kind: 'EMPTY' } as const
    const pattern = containing(input.text)
    const found = await tx
      .select({
        kind: inventoryEntry.kind,
        name: inventoryEntry.name,
        type: inventoryEntry.type,
        label: inventoryEntry.label,
        custom: inventoryEntry.custom,
      })
      .from(inventoryEntry)
      .where(
        and(
          eq(inventoryEntry.companyId, input.companyId),
          eq(inventoryEntry.runId, run.id),
          input.kind === undefined ? undefined : eq(inventoryEntry.kind, input.kind),
          or(ilike(inventoryEntry.name, pattern), ilike(inventoryEntry.label, pattern)),
        ),
      )
      .orderBy(asc(inventoryEntry.kind), asc(inventoryEntry.name))
      .limit(input.limit + 1)
    return {
      kind: 'OK',
      readAt: run.endedAt.toISOString(),
      entries: found.slice(0, input.limit),
      more: found.length > input.limit,
    } as const
  })
}
