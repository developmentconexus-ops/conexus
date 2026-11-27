import type { CompanyId, ConnectionId, LakeFullPass, LakeInterval } from '@conexus/hub-api'
import { ConnectionId as ConnectionIdSchema } from '@conexus/hub-api'
import { eq, sql } from 'drizzle-orm'
import type { CommandTx, Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { CompanyScope } from './lake-close.ts'
import { companyScope } from './lake-close.ts'
import { lakeCopy, lakeTable } from './tables.ts'

/** A connection's copy as the clock reads it: when it was born, how often it runs and its full pass. */
export type ScheduledCopy = Readonly<{
  companyId: CompanyId
  connectionId: ConnectionId
  interval: LakeInterval
  fullPass: LakeFullPass
  anchor: Date
}>

export type FullPassFire = 'DUE' | 'PASS_OFF' | 'NO_COPY'

/** The full pass the clock runs for a copy; null: off, or Só manual, under which nothing runs on its own. */
export function runningPass(
  copy: Pick<ScheduledCopy, 'interval' | 'fullPass'>,
): Exclude<LakeFullPass, 'OFF'> | null {
  return copy.interval === 'MANUAL' || copy.fullPass === 'OFF' ? null : copy.fullPass
}

/** Every copy of every company with a connection, for the clocks at the Hub's start. */
export async function scheduledCopies(
  deps: Readonly<{ database: Database; companies: () => Promise<readonly CompanyId[]> }>,
): Promise<ScheduledCopy[]> {
  const copies: ScheduledCopy[] = []
  for (const companyId of await deps.companies()) {
    const rows = await deps.database.read(companyScope(companyId), (tx) =>
      tx
        .select({
          connectionId: lakeCopy.connectionId,
          interval: lakeCopy.interval,
          fullPass: lakeCopy.fullPass,
          anchor: lakeCopy.createdAt,
        })
        .from(lakeCopy),
    )
    for (const row of rows)
      copies.push({ ...row, companyId, connectionId: ConnectionIdSchema.parse(row.connectionId) })
  }
  return copies
}

/**
 * A full pass fired: each marked table owes one until a whole read of it reaches its current table,
 * or the copy stops running a full pass. `PASS_OFF`: the copy runs none, so the row that fired is
 * one the clock failed to take away, and it marks nothing.
 */
export async function markFullPass(
  deps: Readonly<{ database: Database; log: FailureLog }>,
  at: CompanyScope,
  connection: ConnectionId,
): Promise<FullPassFire> {
  const fire = await deps.database.command(at, async (tx): Promise<FullPassFire> => {
    const [copy] = await tx
      .select({ interval: lakeCopy.interval, fullPass: lakeCopy.fullPass })
      .from(lakeCopy)
      .where(eq(lakeCopy.connectionId, connection))
    if (copy === undefined) return 'NO_COPY'
    if (runningPass(copy) === null) return 'PASS_OFF'
    await tx
      .update(lakeTable)
      .set({ fullDueAt: sql`statement_timestamp()` })
      .where(eq(lakeTable.connectionId, connection))
    return 'DUE'
  })
  if (fire === 'DUE')
    deps.log.info({ companyId: at.companyId, connectionId: connection }, 'LAKE_FULL_PASS_DUE')
  return fire
}

export async function forgetFullPass(tx: CommandTx, connection: ConnectionId): Promise<void> {
  await tx.update(lakeTable).set({ fullDueAt: null }).where(eq(lakeTable.connectionId, connection))
}
