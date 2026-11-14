import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import {
  ConnectionId as ConnectionIdSchema,
  InventoryReason,
  InventoryRunId,
} from '@conexus/hub-api'
import { and, eq, exists, isNull, ne, not, sql } from 'drizzle-orm'
import type { CommandTx, Database, Scope } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { InventoryEntry, InventoryRead, InventorySource } from '../connectors/public.ts'
import { PAGE_ROWS } from '../connectors/public.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { inventoryEnd, inventoryEntry, inventoryRun } from './tables.ts'

/** Production's ceilings of one run, the copies' (`hub/copies/run.ts`): 500 rows a page, 200 pages or 10 minutes. */
export const INVENTORY_DEFAULTS = {
  pageRows: PAGE_ROWS,
  runPages: 200,
  runMs: 10 * 60_000,
} as const
/** A run with no end is open for 15 minutes: the ceiling of the run plus slack, with no renewal (the run stops by itself at the ceiling). */
export const INVENTORY_LEASE_MS = 15 * 60_000

export type InventoryTuning = { pageRows?: number; runPages?: number; runMs?: number }
export type Ids = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>
type RunIds = Readonly<{ companyId: CompanyId; runId: InventoryRunId }>

/** Starts the workflow of a run already opened; a failure to start is logged, and the run's lease ends it. */
export type InventoryClock = {
  start(input: Ids & { runId: InventoryRunId }): Promise<void>
}

export type Opened =
  | Readonly<{ kind: 'OPENED'; runId: InventoryRunId }>
  | Readonly<{ kind: 'RUNNING' }>

export type InventoryEnd =
  | Readonly<{ kind: 'COMPLETE' | 'PARTIAL'; entries: number }>
  | Readonly<{ kind: 'FAILED'; reason: InventoryReason }>
  /** The connection or the run left. */
  | Readonly<{ kind: 'GONE' }>

/** What the Ontology asks of the connectors: the connection's source and one page of its dictionary. */
export type InventoryConnectors = {
  sourceOf(input: Ids): Promise<InventorySource | undefined>
  page(
    input: Ids & {
      enabledBy: InventorySource['linkedBy']
      cursor: string | null
      limit: number
      signal: AbortSignal
    },
  ): Promise<InventoryRead>
}

export type InventoryDeps = {
  database: Database
  identity: IdentityPorts
  connectors: () => InventoryConnectors
  clock: () => InventoryClock
  log: FailureLog
  tuning?: InventoryTuning
}

export function companyScope(companyId: CompanyId): Scope {
  return { kind: 'COMPANY', companyId, personId: null }
}

function ofRun(ids: Ids) {
  return and(
    eq(inventoryRun.companyId, ids.companyId),
    eq(inventoryRun.connectionId, ids.connectionId),
  )
}

function lockKey(connectionId: ConnectionId): string {
  return `inventory:${connectionId}`
}

type Final = Readonly<{
  outcome: 'COMPLETE' | 'PARTIAL' | 'FAILED'
  reason: InventoryReason | null
  pages: number
}>

/** The run's end and what it takes from older runs, in one transaction under the connection's lock (data D25). */
async function close(tx: CommandTx, ids: Ids & { runId: InventoryRunId }, final: Final) {
  await transactionLock(tx, lockKey(ids.connectionId))
  await tx.insert(inventoryEnd).values({
    runId: ids.runId,
    companyId: ids.companyId,
    endedAt: sql`statement_timestamp()`,
    ...final,
  })
  if (final.outcome === 'FAILED') return
  const older = and(ofRun(ids), ne(inventoryRun.id, ids.runId))
  const complete = tx
    .select({ one: sql`1` })
    .from(inventoryEnd)
    .where(and(eq(inventoryEnd.runId, inventoryRun.id), eq(inventoryEnd.outcome, 'COMPLETE')))
  // The older runs go, with their ends and entries by cascade: all of them after a COMPLETE, the ones that are not COMPLETE after a PARTIAL.
  await tx
    .delete(inventoryRun)
    .where(final.outcome === 'COMPLETE' ? older : and(older, not(exists(complete))))
}

/** The entries of one page, written as they come; a name the dictionary repeats is kept once. */
async function writeEntries(
  database: Database,
  ids: RunIds,
  entries: readonly InventoryEntry[],
): Promise<void> {
  if (entries.length === 0) return
  await database.command(companyScope(ids.companyId), (tx) =>
    tx
      .insert(inventoryEntry)
      .values(entries.map((entry) => ({ ...entry, runId: ids.runId, companyId: ids.companyId })))
      .onConflictDoNothing(),
  )
}

/** The run's row while it has no end: its connection, none when it left or already ended. */
async function openRunOf(database: Database, ids: RunIds) {
  const [row] = await database.read(companyScope(ids.companyId), (tx) =>
    tx
      .select({ connectionId: inventoryRun.connectionId })
      .from(inventoryRun)
      .leftJoin(inventoryEnd, eq(inventoryEnd.runId, inventoryRun.id))
      .where(
        and(
          eq(inventoryRun.companyId, ids.companyId),
          eq(inventoryRun.id, ids.runId),
          isNull(inventoryEnd.runId),
        ),
      ),
  )
  return row
}

/** What a refused read says about the run: the type of the answer, `UNREADABLE` for one the table does not know. */
function reasonOf(read: Exclude<InventoryRead, { kind: 'PAGE' }>): InventoryReason {
  if (read.kind === 'IN_LINE') return 'BUSY'
  if (read.kind === 'NO_CONNECTION') return 'REFUSED'
  const parsed = InventoryReason.safeParse(read.refusal.kind)
  return parsed.success ? parsed.data : 'UNREADABLE'
}

/** Opens a run in one transaction under the connection's lock: RUNNING when one is open inside its lease, else the old ones end `INTERRUPTED` and a new row begins. */
async function openRun(database: Database, ids: Ids): Promise<Opened> {
  return database.command(companyScope(ids.companyId), async (tx) => {
    await transactionLock(tx, lockKey(ids.connectionId))
    const unended = await tx
      .select({
        id: inventoryRun.id,
        fresh: sql<boolean>`${inventoryRun.startedAt} > statement_timestamp() - ${INVENTORY_LEASE_MS} * interval '1 millisecond'`,
      })
      .from(inventoryRun)
      .leftJoin(inventoryEnd, eq(inventoryEnd.runId, inventoryRun.id))
      .where(and(ofRun(ids), isNull(inventoryEnd.runId)))
    if (unended.some((run) => run.fresh)) return { kind: 'RUNNING' } as const
    // A run past its lease with no end is one the process dropped: it ends here, before the new one begins.
    for (const { id } of unended)
      await tx.insert(inventoryEnd).values({
        runId: id,
        companyId: ids.companyId,
        endedAt: sql`statement_timestamp()`,
        outcome: 'INTERRUPTED',
        pages: 0,
      })
    const runId = InventoryRunId.parse(crypto.randomUUID())
    await tx.insert(inventoryRun).values({
      id: runId,
      companyId: ids.companyId,
      connectionId: ids.connectionId,
      startedAt: sql`statement_timestamp()`,
    })
    return { kind: 'OPENED', runId } as const
  })
}

async function finish(deps: InventoryDeps, ids: Ids & { runId: InventoryRunId }, final: Final) {
  await deps.database.command(companyScope(ids.companyId), (tx) => close(tx, ids, final))
  deps.log.info({ ...ids, ...final, reason: final.reason ?? '-' }, 'ONTOLOGY_INVENTORY_ENDED')
}

type Ceilings = Required<InventoryTuning>

/** The dictionary read page by page until it ends or the ceiling of the run stops it (`PARTIAL`, `CAP`). */
async function readDictionary(
  deps: InventoryDeps,
  tuning: Ceilings,
  at: { ids: Ids & { runId: InventoryRunId }; source: InventorySource; signal: AbortSignal },
): Promise<InventoryEnd> {
  const { ids, source } = at
  const started = Date.now()
  let cursor: string | null = null
  let pages = 0
  let entries = source.declared.length
  while (true) {
    const read = await deps.connectors().page({
      ...{ ...ids, enabledBy: source.linkedBy, cursor, signal: at.signal },
      limit: tuning.pageRows,
    })
    if (read.kind !== 'PAGE') {
      const reason = reasonOf(read)
      await finish(deps, ids, { outcome: 'FAILED', reason, pages })
      return { kind: 'FAILED', reason }
    }
    pages += 1
    entries += read.page.entries.length
    await writeEntries(deps.database, ids, read.page.entries)
    cursor = read.page.next
    if (cursor === null) {
      await finish(deps, ids, { outcome: 'COMPLETE', reason: null, pages })
      return { kind: 'COMPLETE', entries }
    }
    if (pages >= tuning.runPages || Date.now() - started >= tuning.runMs) {
      await finish(deps, ids, { outcome: 'PARTIAL', reason: 'CAP', pages })
      return { kind: 'PARTIAL', entries }
    }
  }
}

export function createInventory(deps: InventoryDeps) {
  const tuning = { ...INVENTORY_DEFAULTS, ...deps.tuning }

  async function run(input: RunIds, signal: AbortSignal): Promise<InventoryEnd> {
    const found = await openRunOf(deps.database, input)
    if (found === undefined) return { kind: 'GONE' }
    const ids = { ...input, connectionId: ConnectionIdSchema.parse(found.connectionId) }
    const source = await deps.connectors().sourceOf(ids)
    if (source === undefined) return { kind: 'GONE' }
    await writeEntries(deps.database, ids, source.declared)
    if (source.dictionary) return readDictionary(deps, tuning, { ids, source, signal })
    await finish(deps, ids, { outcome: 'COMPLETE', reason: null, pages: 1 })
    return { kind: 'COMPLETE', entries: source.declared.length }
  }

  /** Opens a run and starts its workflow; a failure to start is logged, and the run's lease ends it. */
  async function launch(ids: Ids): Promise<Opened> {
    const opened = await openRun(deps.database, ids)
    if (opened.kind === 'OPENED')
      try {
        await deps.clock().start({ ...ids, runId: opened.runId })
        deps.log.info({ ...ids, runId: opened.runId }, 'ONTOLOGY_INVENTORY_STARTED')
      } catch (error) {
        const failure = new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'INVENTORY_START' },
          cause: error,
        })
        logFailure(deps.log, failure, { connectionId: ids.connectionId })
      }
    return opened
  }

  return { open: (ids: Ids) => openRun(deps.database, ids), run, launch }
}
