import type { CompanyId, ConnectionId, CopyId, CopyOfConnection } from '@conexus/hub-api'
import { CopyId as CopyIdSchema } from '@conexus/hub-api'
import { and, asc, eq, inArray, notExists, sql } from 'drizzle-orm'
import type { CommandTx, DatabaseUrl, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { AccountRef, CopyName } from '../connectors/public.ts'
import { copyModeOf } from './mode.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { parsedCopy, personScope, syncOf } from './store.ts'
import { copy, copySource, copyTableLeft } from './tables.ts'

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
 * In the same transaction, after the DELETE took the sources in cascade: each locked copy left with
 * no source ends, with its runs and releases (the cascade), and its table is noted in
 * `copy_table_left` for `dropEndedCopies`.
 */
export async function endedSourceless(
  tx: CommandTx,
  input: { companyId: CompanyId; copyIds: readonly CopyId[] },
): Promise<CopyId[]> {
  if (input.copyIds.length === 0) return []
  const ended = await tx
    .delete(copy)
    .where(
      and(
        eq(copy.companyId, input.companyId),
        inArray(copy.id, [...input.copyIds]),
        notExists(
          tx
            .select({ one: sql`1` })
            .from(copySource)
            .where(and(eq(copySource.companyId, copy.companyId), eq(copySource.copyId, copy.id))),
        ),
      ),
    )
    .returning({ id: copy.id, name: copy.name })
  if (ended.length > 0)
    await tx
      .insert(copyTableLeft)
      .values(ended.map((row) => ({ companyId: input.companyId, copyId: row.id, name: row.name })))
      .onConflictDoNothing()
  return ended.map((row) => CopyIdSchema.parse(row.id))
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
 * Drains the company's rows of `copy_table_left`, written in the transaction that ended each copy:
 * each table dropped under its row's lock, then the row deleted. No REVOKE: the privileges go with
 * the table. Called after every Desligar's DELETE and before `ensureCopyTable` in every Ligar; a
 * silent company database leaves the rows for the next call and answers their names.
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
