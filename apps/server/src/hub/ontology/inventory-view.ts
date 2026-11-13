import type { InventoryView } from '@conexus/hub-api'
import { InventoryRunId } from '@conexus/hub-api'
import type { SQL } from 'drizzle-orm'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import type { Ids } from './inventory.ts'
import { INVENTORY_LEASE_MS } from './inventory.ts'
import { inventoryEnd, inventoryEntry, inventoryRun } from './tables.ts'

/** The newest ended run of the connection that matches `where`, with how and when it ended. */
async function newestEnded(tx: ReadTx, mine: SQL | undefined, where?: SQL) {
  const [row] = await tx
    .select({
      id: inventoryRun.id,
      outcome: inventoryEnd.outcome,
      reason: inventoryEnd.reason,
      endedAt: inventoryEnd.endedAt,
    })
    .from(inventoryRun)
    .innerJoin(inventoryEnd, eq(inventoryEnd.runId, inventoryRun.id))
    .where(and(mine, where))
    .orderBy(desc(inventoryEnd.endedAt))
    .limit(1)
  return row
}

async function isRunning(tx: ReadTx, mine: SQL | undefined): Promise<boolean> {
  const [open] = await tx
    .select({ id: inventoryRun.id })
    .from(inventoryRun)
    .leftJoin(inventoryEnd, eq(inventoryEnd.runId, inventoryRun.id))
    .where(
      and(
        mine,
        isNull(inventoryEnd.runId),
        sql`${inventoryRun.startedAt} > statement_timestamp() - ${INVENTORY_LEASE_MS} * interval '1 millisecond'`,
      ),
    )
    .limit(1)
  return open !== undefined
}

async function countsOf(tx: ReadTx, ids: Ids, runId: InventoryRunId) {
  const counts = await tx
    .select({ kind: inventoryEntry.kind, n: sql<number>`count(*)::int` })
    .from(inventoryEntry)
    .where(and(eq(inventoryEntry.companyId, ids.companyId), eq(inventoryEntry.runId, runId)))
    .groupBy(inventoryEntry.kind)
  function of(kind: string) {
    return counts.find((count) => count.kind === kind)?.n ?? 0
  }
  return {
    tables: of('TABLE'),
    fields: of('FIELD'),
    codes: of('CODE'),
    operations: of('OPERATION'),
  }
}

/** What the connection's page shows: the newest COMPLETE run, else the newest PARTIAL, with its counts; the state of the last run; whether one is open. */
export async function inventoryViewIn(
  tx: ReadTx,
  ids: Ids,
): Promise<Omit<InventoryView, 'mayRun'>> {
  const mine = and(
    eq(inventoryRun.companyId, ids.companyId),
    eq(inventoryRun.connectionId, ids.connectionId),
  )
  const shown =
    (await newestEnded(tx, mine, eq(inventoryEnd.outcome, 'COMPLETE'))) ??
    (await newestEnded(tx, mine, eq(inventoryEnd.outcome, 'PARTIAL')))
  const last = await newestEnded(tx, mine)
  return {
    inventory:
      shown === undefined
        ? null
        : {
            readAt: shown.endedAt.toISOString(),
            outcome: shown.outcome === 'COMPLETE' ? 'COMPLETE' : 'PARTIAL',
            reason: shown.reason,
            ...(await countsOf(tx, ids, InventoryRunId.parse(shown.id))),
          },
    last: last === undefined ? null : { outcome: last.outcome, reason: last.reason },
    running: await isRunning(tx, mine),
  }
}
