import type { CompanyId, ConnectionId, CopyId, CopyRunId } from '@conexus/hub-api'
import { ConnectionId as ConnectionIdSchema } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { AccountRef, CopyPosition } from '../connectors/public.ts'
import type { CopiesDeps } from './store.ts'
import { companyScope } from './store.ts'
import { copy, copyRun, copySource } from './tables.ts'

/** One connection a copy reads, where its pass stands and until when it waits (C27: parsed where read). */
export type StoredSource = Readonly<{
  connectionId: ConnectionId
  accountRef: AccountRef | null
  pass: number
  passStartedAt: Date | null
  watermark: Date | null
  waitUntil: Date | null
  /** The provider's wait is not over by the Hub database's clock: no call this run. */
  waits: boolean
  position: CopyPosition | null
}>

function parsedSource(row: typeof copySource.$inferSelect, waits: boolean): StoredSource {
  return {
    connectionId: ConnectionIdSchema.parse(row.connectionId),
    accountRef: row.accountRef === null ? null : AccountRef.parse(row.accountRef),
    pass: row.pass,
    passStartedAt: row.passStartedAt,
    watermark: row.watermark,
    waitUntil: row.waitUntil,
    waits,
    position: row.position === null ? null : CopyPosition.parse(row.position),
  }
}

type Ids = { companyId: CompanyId; copyId: CopyId }

function ofCopy(ids: Ids) {
  return and(eq(copySource.copyId, ids.copyId), eq(copySource.companyId, ids.companyId))
}

/** The copy's sources, in the order they were made. */
export async function sourcesOf(tx: ReadTx, ids: Ids): Promise<StoredSource[]> {
  const rows = await tx
    .select({
      row: copySource,
      waits: sql<boolean>`coalesce(${copySource.waitUntil} > statement_timestamp(), false)`,
    })
    .from(copySource)
    .where(ofCopy(ids))
    .orderBy(asc(copySource.createdAt), asc(copySource.connectionId))
  return rows.map(({ row, waits }) => parsedSource(row, waits))
}

/** The pass of each source dated when a run claims the copy and the source has none open: changes from then on are read again. */
export function datedPasses(tx: CommandTx, ids: Ids) {
  return tx
    .update(copySource)
    .set({ passStartedAt: sql`statement_timestamp()` })
    .where(and(ofCopy(ids), sql`${copySource.passStartedAt} IS NULL`))
}

/** A run that holds the copy's lease: what it writes of a source goes in only while it holds it. */
export type Holder = Readonly<{
  companyId: CompanyId
  copyId: CopyId
  token: string
  runId: CopyRunId
}>

function held(holder: Holder) {
  return and(eq(copy.id, holder.copyId), eq(copy.claimToken, holder.token))
}

function leaseFrom(deps: CopiesDeps) {
  return sql`statement_timestamp() + ${deps.tuning.leaseMs} * interval '1 millisecond'`
}

/**
 * One source's write while the lease is the run's: the lease renewed in the same transaction, which
 * holds the copy's row until the source is written. False when the lease went to another run.
 */
function whileHeld(
  deps: CopiesDeps,
  holder: Holder,
  write: (tx: CommandTx) => Promise<unknown>,
  copyRows?: number,
): Promise<boolean> {
  return deps.database.command(companyScope(holder.companyId), async (tx) => {
    const [row] = await tx
      .update(copy)
      .set({ claimedUntil: leaseFrom(deps), ...(copyRows === undefined ? {} : { rows: copyRows }) })
      .where(held(holder))
      .returning({ id: copy.id })
    if (row === undefined) return false
    await write(tx)
    return true
  })
}

function source(holder: Holder, connectionId: ConnectionId) {
  return and(ofCopy(holder), eq(copySource.connectionId, connectionId))
}

/** A page written: the source's next position, its wait over, and the run's counts. */
export function saved(
  deps: CopiesDeps,
  holder: Holder,
  input: { connectionId: ConnectionId; position: CopyPosition | null; rows: number },
): Promise<boolean> {
  return whileHeld(deps, holder, async (tx) => {
    await tx
      .update(copySource)
      .set({ position: input.position, waitUntil: null })
      .where(source(holder, input.connectionId))
    await tx
      .update(copyRun)
      .set({
        pages: sql`${copyRun.pages} + 1`,
        read: sql`${copyRun.read} + ${input.rows}`,
        written: sql`${copyRun.written} + ${input.rows}`,
      })
      .where(eq(copyRun.id, holder.runId))
  })
}

/** The source's pass done: its watermark moves to when the pass began, the next starts from nothing, and the copy counts the table. */
export function passed(
  deps: CopiesDeps,
  holder: Holder,
  input: { connectionId: ConnectionId; rows: number },
): Promise<boolean> {
  return whileHeld(
    deps,
    holder,
    (tx) =>
      tx
        .update(copySource)
        .set({
          watermark: sql`${copySource.passStartedAt}`,
          pass: sql`${copySource.pass} + 1`,
          passStartedAt: null,
          position: null,
          waitUntil: null,
        })
        .where(source(holder, input.connectionId)),
    input.rows,
  )
}

/** The provider asked to wait: no call before `waitMs` from now; none said, the next run may call. */
export function waiting(
  deps: CopiesDeps,
  holder: Holder,
  input: { connectionId: ConnectionId; waitMs: number | null },
): Promise<boolean> {
  const until =
    input.waitMs === null
      ? null
      : sql`statement_timestamp() + ${input.waitMs} * interval '1 millisecond'`
  return whileHeld(deps, holder, (tx) =>
    tx.update(copySource).set({ waitUntil: until }).where(source(holder, input.connectionId)),
  )
}

/** The source's cursor outlived its validity: the pass starts again from nothing, with the same number. */
export function restarted(
  deps: CopiesDeps,
  holder: Holder,
  input: { connectionId: ConnectionId },
): Promise<boolean> {
  return whileHeld(deps, holder, (tx) =>
    tx.update(copySource).set({ position: null }).where(source(holder, input.connectionId)),
  )
}
