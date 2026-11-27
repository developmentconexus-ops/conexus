import { ConnectionId, LakeTableName, LakeTableSummary, SourceTableId } from '@conexus/hub-api'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { lakeTable } from './tables.ts'

const Marked = z.object({
  connectionId: ConnectionId,
  source: SourceTableId,
  name: LakeTableName,
  columns: LakeTableSummary.shape.columns,
})

function inLakeSpelling({ name, type, description }: z.infer<typeof Marked>['columns'][number]) {
  return { name: name.toLowerCase(), type, description }
}

export async function markedTablesOf(tx: ReadTx) {
  const rows = await tx
    .select({
      connectionId: lakeTable.connectionId,
      source: lakeTable.sourceTable,
      name: lakeTable.name,
      columns: lakeTable.columns,
      rows: lakeTable.rows,
    })
    .from(lakeTable)
  return rows.map((row) => {
    const marked = Marked.parse(row)
    const appliedToCurrent = row.rows !== null
    return { ...marked, columns: marked.columns.map(inLakeSpelling), appliedToCurrent }
  })
}
