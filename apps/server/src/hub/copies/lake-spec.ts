import type { ConnectionId } from '@conexus/hub-api'
import { LakeTableName, SourceTableId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { Where } from '../../platform/aws.ts'
import type { AwsConfig } from '../../platform/config-aws.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { CopySource } from '../connectors/public.ts'
import type { CompanyScope } from './lake-close.ts'
import { lakeOf } from './lake-close.ts'
import { CopyTaskSpec } from './lake-task.ts'
import { lakeCopy, lakeTable } from './tables.ts'

type MarkedTable = Readonly<{
  source: SourceTableId
  name: LakeTableName
  /** No round carried it yet: it is read whole, on the bigger machine. */
  firstLoad: boolean
}>

/** A connection's copy as a start reads it: the start date, the marked tables and the company's lake. */
export type CopyRead = Readonly<{
  startDate: string | null
  tables: readonly MarkedTable[]
  lake: Awaited<ReturnType<typeof lakeOf>>
}>

/** A round being started: whose, which, and whether Ler de novo desde a data asked it. */
export type Started = Readonly<{
  at: CompanyScope
  connection: ConnectionId
  run: string
  whole: boolean
  copy: CopyRead
}>

export function isFirstLoad(table: Pick<typeof lakeTable.$inferSelect, 'lastRunId'>): boolean {
  return table.lastRunId === null
}

export async function readCopy(database: Database, at: CompanyScope, connection: ConnectionId) {
  return database.read(at, async (tx): Promise<CopyRead | null> => {
    const [copy] = await tx
      .select({ startDate: lakeCopy.startDate })
      .from(lakeCopy)
      .where(eq(lakeCopy.connectionId, connection))
    if (copy === undefined) return null
    const rows = await tx
      .select({
        source: lakeTable.sourceTable,
        name: lakeTable.name,
        lastRunId: lakeTable.lastRunId,
      })
      .from(lakeTable)
      .where(eq(lakeTable.connectionId, connection))
    const tables = rows.map((row) => ({
      source: SourceTableId.parse(row.source),
      name: LakeTableName.parse(row.name),
      firstLoad: isFirstLoad(row),
    }))
    return { startDate: copy.startDate, tables, lake: await lakeOf(tx, at.companyId) }
  })
}

/** The dictionary's columns of the marked tables, written for the screen; the kept ones stay when it does not answer. */
export async function writeColumns(
  deps: { database: Database; source: CopySource; log: FailureLog },
  started: Started,
) {
  const { at, connection, copy } = started
  const read = await deps.source.columns({ companyId: at.companyId, connectionId: connection })
  const answered = read.kind === 'READ' ? read.columns : new Map()
  const kept = copy.tables.filter((table) => !answered.has(table.source))
  await deps.database.command(at, async (tx) => {
    for (const table of copy.tables) {
      const found = answered.get(table.source)
      if (found === undefined) continue
      await tx
        .update(lakeTable)
        .set({ columns: found })
        .where(and(eq(lakeTable.connectionId, connection), eq(lakeTable.sourceTable, table.source)))
    }
  })
  if (kept.length > 0)
    deps.log.info(
      { companyId: at.companyId, connectionId: connection, tables: kept.length },
      'COPY_COLUMNS_KEPT',
    )
}

/**
 * The round's spec, the one value the task receives: the tables with the name and `whole` of
 * each (a first load, or Ler de novo where the start date limits it), the start date in every
 * round, and the connection's fields opened from their seal (S8). Null: the connection left.
 */
export async function specOf(
  deps: { source: CopySource; copy: AwsConfig['copy'] },
  started: Started,
  lake: Readonly<{ where: Where; bucket: string }>,
): Promise<Readonly<{ spec: string; reread: readonly LakeTableName[] }> | null> {
  const { at, connection, copy } = started
  const opened = await deps.source.open({ companyId: at.companyId, connectionId: connection })
  if (opened.kind === 'GONE') return null
  const { region, account } = lake.where
  const reread = started.whole
    ? copy.tables.filter((table) => opened.limited.get(table.source) === true)
    : []
  const spec = CopyTaskSpec.parse({
    version: 1,
    runId: started.run,
    attempt: 1,
    companyId: at.companyId,
    connector: opened.connector,
    connectionId: connection,
    account: opened.account,
    startDate: copy.startDate,
    credential: opened.credential,
    tables: copy.tables.map((table) => ({
      source: table.source,
      name: table.name,
      whole: table.firstLoad || reread.includes(table),
    })),
    lake: { bucketArn: `arn:aws:s3tables:${region}:${account}:bucket/${lake.bucket}`, region },
    queueUrl: deps.copy.queueUrl,
  })
  return { spec: JSON.stringify(spec), reread: reread.map((table) => table.name) }
}
