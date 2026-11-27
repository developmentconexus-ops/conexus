import { randomUUID } from 'node:crypto'
import type { CompanyId, ConnectionId, ConnectorId, SetLakeCopy } from '@conexus/hub-api'
import { eq, inArray, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import type { CopyColumn, CopyTable } from '../connectors/public.ts'
import { forgetFullPass, runningPass } from './lake-schedule.ts'
import { lakeCopy, lakeTable } from './tables.ts'

export type Row = Readonly<{ id: string; source: string; name: string }>
export type Added = Readonly<{ declaration: CopyTable; source: string; name: string }>
export type Plan = Readonly<{
  add: readonly Added[]
  remove: readonly Row[]
  interval: SetLakeCopy['interval']
  startDate: string | null
  fullPass: SetLakeCopy['fullPass']
}>
type Written = Readonly<{
  at: Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>
  plan: Plan
  existing: Pick<Plan, 'interval' | 'startDate' | 'fullPass'> | undefined
  connector: ConnectorId
}>

export async function dropCopy(tx: CommandTx, connectionId: ConnectionId, existing: unknown) {
  if (existing !== undefined)
    await tx.delete(lakeCopy).where(eq(lakeCopy.connectionId, connectionId))
}

async function removeRows(tx: CommandTx, remove: readonly Row[]) {
  if (remove.length > 0)
    await tx.delete(lakeTable).where(
      inArray(
        lakeTable.id,
        remove.map((row) => row.id),
      ),
    )
}

async function writeCopyRow(tx: CommandTx, { at, plan, existing, connector }: Written) {
  const { interval, startDate, fullPass } = plan
  const values = { interval, startDate, fullPass }
  if (existing === undefined) {
    await tx.insert(lakeCopy).values({
      ...values,
      companyId: at.companyId,
      connectorId: connector,
      connectionId: at.connectionId,
      createdAt: sql`statement_timestamp()`,
    })
  } else if (
    existing.interval !== interval ||
    existing.startDate !== startDate ||
    existing.fullPass !== fullPass
  ) {
    await tx.update(lakeCopy).set(values).where(eq(lakeCopy.connectionId, at.connectionId))
  }
}

async function addRows(
  tx: CommandTx,
  at: Written['at'],
  add: readonly Added[],
  columns: ReadonlyMap<string, readonly CopyColumn[]>,
) {
  for (const table of add)
    await tx.insert(lakeTable).values({
      id: randomUUID(),
      companyId: at.companyId,
      connectionId: at.connectionId,
      sourceTable: table.source,
      name: table.name,
      label: table.declaration.label,
      columns: columns.get(table.source) ?? [],
    })
}

export async function writePlan(
  tx: CommandTx,
  written: Written,
  columns: ReadonlyMap<string, readonly CopyColumn[]>,
) {
  await removeRows(tx, written.plan.remove)
  await writeCopyRow(tx, written)
  await addRows(tx, written.at, written.plan.add, columns)
  if (runningPass(written.plan) === null) await forgetFullPass(tx, written.at.connectionId)
  const [copy] = await tx
    .select({ createdAt: lakeCopy.createdAt })
    .from(lakeCopy)
    .where(eq(lakeCopy.connectionId, written.at.connectionId))
  return copy
}
