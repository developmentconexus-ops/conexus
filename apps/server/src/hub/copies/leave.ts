import type { CompanyId, ConnectionId, CopyId, CopyOfConnection } from '@conexus/hub-api'
import { CopyId as CopyIdSchema, ProjectId as ProjectIdSchema } from '@conexus/hub-api'
import type { SQL } from 'drizzle-orm'
import { and, asc, eq, inArray, notExists, sql } from 'drizzle-orm'
import type { CommandTx, DatabaseUrl, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { AccountRef, CopyName } from '../connectors/public.ts'
import { revokeCopy } from './grants.ts'
import { copyModeOf } from './mode.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { parsedCopy, personScope, syncOf } from './store.ts'
import { copy, copySource, copyTableLeft, projectCopy } from './tables.ts'

type OfConnection = InCompany & { connectionId: ConnectionId }

/** The ids of the copies the connection is a source of. */
function readingFrom(tx: ReadTx, input: Omit<OfConnection, 'personId'>) {
  return tx
    .select({ copyId: copySource.copyId })
    .from(copySource)
    .where(
      and(
        eq(copySource.companyId, input.companyId),
        eq(copySource.connectionId, input.connectionId),
      ),
    )
}

/** The copies that read the connection, each with its sources' accounts, as Desligar weighs them. */
async function readersOf(tx: ReadTx, input: Omit<OfConnection, 'personId'>) {
  const ids = (await readingFrom(tx, input)).map((row) => row.copyId)
  if (ids.length === 0) return []
  const copies = await tx
    .select()
    .from(copy)
    .where(and(eq(copy.companyId, input.companyId), inArray(copy.id, ids)))
    .orderBy(asc(copy.name))
  const sources = await tx
    .select({
      copyId: copySource.copyId,
      connectionId: copySource.connectionId,
      accountRef: copySource.accountRef,
    })
    .from(copySource)
    .where(and(eq(copySource.companyId, input.companyId), inArray(copySource.copyId, ids)))
  return copies.map((row) => {
    const stored = parsedCopy(row)
    const own = sources.filter((each) => each.copyId === row.id)
    const mine = own.find((each) => each.connectionId === input.connectionId)
    const ref = mine?.accountRef ?? null
    return { stored, ref: ref === null ? null : AccountRef.parse(ref), last: own.length === 1 }
  })
}

/** Each copy that has the connection as a source, as Desligar shows it before the click. */
export async function copiesOfConnection(
  deps: CopiesDeps,
  input: OfConnection,
): Promise<CopyOfConnection[]> {
  const readers = await deps.database.read(personScope(input), (tx) => readersOf(tx, input))
  const counts = readers.some(({ last, ref }) => !last && ref !== null)
  const sync = counts ? await syncIn(deps, input) : undefined
  return Promise.all(
    readers.map(async ({ stored, ref, last }) => {
      const of = { copyId: stored.id, name: stored.name, mode: copyModeOf(stored.definition), last }
      if (last) return { ...of, rows: stored.rows }
      const counted =
        sync === undefined || ref === null
          ? undefined
          : await deps.companyPostgres.accountRows(sync, { copy: stored.name, ref })
      return { ...of, rows: counted?.kind === 'DONE' ? counted.rows : null }
    }),
  )
}

/** Where the Hub reaches the sync login, asked only when there is work in the company's database. */
function syncIn(deps: CopiesDeps, input: InCompany) {
  return deps.database.read(personScope(input), (tx) => syncOf(deps, tx, input.companyId))
}

/**
 * Before the provider's revoke and the Hub's DELETE in `unlink`, outside any transaction (data D22):
 * the account's rows out of every copy of the connection that has `_account`. It drops no table:
 * which copies end is known only in the DELETE. A silent company database refuses Desligar with
 * nothing changed in the Hub; Desligar again finds nothing left to do there.
 */
export async function leaveCopies(deps: CopiesDeps, input: OfConnection): Promise<void> {
  const readers = await deps.database.read(personScope(input), (tx) => readersOf(tx, input))
  const accounts = readers.flatMap(({ stored, ref }) =>
    ref === null ? [] : [{ copy: stored.name, ref }],
  )
  if (accounts.length === 0) return
  const sync = await syncIn(deps, input)
  for (const account of accounts) {
    const dropped =
      sync === undefined ? undefined : await deps.companyPostgres.dropAccountRows(sync, account)
    if (dropped?.kind === 'DONE') continue
    const code =
      dropped === undefined
        ? 'NO_COMPANY_DATABASE'
        : dropped.kind === 'REFUSED'
          ? dropped.code
          : dropped.kind
    const { companyId, connectionId } = input
    deps.log.error({ companyId, connectionId, code }, 'COPY_DATABASE_FAILED')
    throw new Failure('COPY_DATABASE_UNAVAILABLE')
  }
}

/**
 * In the transaction of Desligar's DELETE, before it: the rows of the copies the connection is a
 * source of, locked (SELECT … FOR UPDATE), so of two connections of one copy deleted together the
 * second waits and sees the copy with no source.
 */
export async function lockedCopiesOf(
  tx: CommandTx,
  input: Omit<OfConnection, 'personId'>,
): Promise<CopyId[]> {
  const rows = await tx
    .select({ id: copy.id })
    .from(copy)
    .where(and(eq(copy.companyId, input.companyId), inArray(copy.id, readingFrom(tx, input))))
    .for('update')
  return rows.map((row) => CopyIdSchema.parse(row.id))
}

/**
 * The one end of a copy, in the caller's transaction: the company's copies matching `where` deleted
 * (their sources, runs and releases go in cascade, the proposal keeps no copy) and each one's table
 * noted in `copy_table_left` for `dropEndedCopies`.
 */
async function endCopies(tx: CommandTx, companyId: CompanyId, where: SQL | undefined) {
  const ended = await tx
    .delete(copy)
    .where(and(eq(copy.companyId, companyId), where))
    .returning({ id: copy.id, name: copy.name })
  if (ended.length > 0)
    await tx
      .insert(copyTableLeft)
      .values(ended.map((row) => ({ companyId, copyId: row.id, name: row.name })))
      .onConflictDoNothing()
  return ended.map((row) => CopyIdSchema.parse(row.id))
}

/**
 * In the same transaction, after the DELETE took the sources in cascade: each locked copy left with
 * no source ends (`endCopies`).
 */
export async function endedSourceless(
  tx: CommandTx,
  input: { companyId: CompanyId; copyIds: readonly CopyId[] },
): Promise<CopyId[]> {
  if (input.copyIds.length === 0) return []
  return endCopies(
    tx,
    input.companyId,
    and(
      inArray(copy.id, [...input.copyIds]),
      notExists(
        tx
          .select({ one: sql`1` })
          .from(copySource)
          .where(and(eq(copySource.companyId, copy.companyId), eq(copySource.copyId, copy.id))),
      ),
    ),
  )
}

/**
 * Apagar: the copy ends alone, the connection and the other copies as they were. First, outside any
 * transaction (data D22), the apps' read is taken back by Tirar's own command, once per Projeto it
 * is released to: a silent company database answers 503 with nothing changed. Then one transaction
 * ends the copy (`endCopies`) and `dropEndedCopies` drops its table and its schedule; a table the
 * database did not drop is answered, the copy gone all the same. Doing it again, or for another
 * company's copy, finds nothing (S10) and answers the same.
 */
export async function deleteCopy(
  deps: CopiesDeps,
  input: InCompany & { copyId: CopyId },
): Promise<{ tablesLeft: string[] }> {
  const { companyId, copyId } = input
  const released = await deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    return tx
      .select({ projectId: projectCopy.projectId })
      .from(projectCopy)
      .where(and(eq(projectCopy.companyId, companyId), eq(projectCopy.copyId, copyId)))
  })
  for (const { projectId } of released)
    await revokeCopy(deps, { ...input, projectId: ProjectIdSchema.parse(projectId) })
  const ended = await deps.database.command(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'manageCopies' })
    return endCopies(tx, companyId, eq(copy.id, copyId))
  })
  const { tablesLeft } = await dropEndedCopies(deps, input)
  deps.log.info({ companyId, copyId, ended: ended.length > 0 }, 'COPY_DELETED')
  return { tablesLeft }
}

/**
 * One left table dropped under its row's lock: the row taken out (DELETE … RETURNING holds it to the
 * end of the transaction, the Hub's role having no UPDATE to lock it otherwise), the table dropped,
 * and the row put back when the company's database did not drop it. A drain that waited on the lock
 * finds the row gone.
 */
function droppedTable(
  deps: CopiesDeps,
  input: InCompany & { copyId: CopyId; sync: DatabaseUrl },
): Promise<{ name: string; dropped: boolean } | undefined> {
  return deps.database.command(personScope(input), async (tx) => {
    const [row] = await tx
      .delete(copyTableLeft)
      .where(
        and(eq(copyTableLeft.companyId, input.companyId), eq(copyTableLeft.copyId, input.copyId)),
      )
      .returning()
    if (row === undefined) return undefined
    const name = CopyName.parse(row.name)
    const answer = await deps.companyPostgres.dropCopyTable(input.sync, { copy: name })
    if (answer.kind === 'DONE') return { name, dropped: true }
    await tx.insert(copyTableLeft).values(row)
    return { name, dropped: false }
  })
}

/**
 * The schedule of each ended copy taken out of the clock, paused or not: a paused one never fires, so
 * it never finds the copy gone and deletes itself. Doing it again changes nothing; a clock that does
 * not answer is logged and the schedule stays for the fire that finds the copy gone.
 */
async function removeSchedules(deps: CopiesDeps, companyId: CompanyId, copyIds: readonly CopyId[]) {
  for (const copyId of copyIds) {
    try {
      await deps.clock().remove(copyId)
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UNKNOWN'
      deps.log.error({ companyId, copyId, reason }, 'COPY_SCHEDULE_LEFT')
    }
  }
}

/**
 * Drains the company's rows of `copy_table_left`, written in the transaction that ended each copy:
 * each copy's schedule taken out, each table dropped under its row's lock, then the row deleted. No
 * REVOKE: the privileges go with the table. Called after every Desligar's and Apagar's end of copies
 * and before `ensureCopyTable` in every Ligar; a silent company database leaves the rows for the next
 * call and answers their names.
 */
export async function dropEndedCopies(
  deps: CopiesDeps,
  input: InCompany,
): Promise<{ tablesLeft: string[] }> {
  const left = await deps.database.read(personScope(input), (tx) =>
    tx
      .select()
      .from(copyTableLeft)
      .where(eq(copyTableLeft.companyId, input.companyId))
      .orderBy(asc(copyTableLeft.name)),
  )
  if (left.length === 0) return { tablesLeft: [] }
  await removeSchedules(
    deps,
    input.companyId,
    left.map((row) => CopyIdSchema.parse(row.copyId)),
  )
  const sync = await syncIn(deps, input)
  const stayed: { copyId: CopyId; name: string }[] = []
  for (const row of left) {
    const copyId = CopyIdSchema.parse(row.copyId)
    const done =
      sync === undefined ? undefined : await droppedTable(deps, { ...input, copyId, sync })
    if (sync === undefined || done?.dropped === false) stayed.push({ copyId, name: row.name })
  }
  for (const each of stayed)
    deps.log.error({ companyId: input.companyId, copyId: each.copyId }, 'COPY_TABLES_LEFT')
  return { tablesLeft: stayed.map((each) => each.name) }
}
