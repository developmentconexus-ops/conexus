import { randomUUID } from 'node:crypto'
import type { CompanyId, ConnectionId, ConnectorId, SetLakeCopy } from '@conexus/hub-api'
import { eq, inArray, sql } from 'drizzle-orm'
import type { CommandTx } from '../../platform/database.ts'
import type { CopyColumn, CopyTable } from '../connectors/public.ts'
import { lakeCopy, lakeTable } from './tables.ts'

export type Row = Readonly<{ id: string; source: string; name: string }>
export type Added = Readonly<{ declaration: CopyTable; source: string; name: string }>
export type Plan = Readonly<{
  add: readonly Added[]
  remove: readonly Row[]
  interval: SetLakeCopy['interval']
  startDate: string | null
}>
type Written = Readonly<{
  at: Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>
  plan: Plan
  existing: Readonly<{ interval: string; startDate: string | null }> | undefined
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
  const values = { interval: plan.interval, startDate: plan.startDate }
  if (existing === undefined) {
    await tx.insert(lakeCopy).values({
      ...values,
      companyId: at.companyId,
      connectorId: connector,
      connectionId: at.connectionId,
      createdAt: sql`statement_timestamp()`,
    })
  } else if (existing.interval !== values.interval || existing.startDate !== values.startDate) {
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
  const [copy] = await tx
    .select({ createdAt: lakeCopy.createdAt })
    .from(lakeCopy)
    .where(eq(lakeCopy.connectionId, written.at.connectionId))
  return copy
}
