import type { SkillTable } from '@conexus/connectors'
import { connectorOf, sourceOf, startDateLimits } from '@conexus/connectors'
import type { CompanyId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'

const Row = z.object({
  connection_id: z.uuid(),
  name: z.string(),
  label: z.string(),
  source_table: z.string(),
  start_date: z.string().nullable(),
})

/**
 * The tables each connection copies to the lake, as the connection's skill tells them (criterion
 * 85): the company's name, the label and source, the kit's description, and "since" only where the
 * start date limits. The rows are read in the company's own login by their columns alone (data D17).
 */
export async function skillTablesOf(
  tx: ReadTx,
  companyId: CompanyId,
  connections: readonly Readonly<{ id: string; connector: string }>[],
): Promise<ReadonlyMap<string, readonly SkillTable[]>> {
  const tables = new Map<string, SkillTable[]>()
  if (connections.length === 0) return tables
  const ids = sql.join(
    connections.map(({ id }) => sql`${id}`),
    sql`, `,
  )
  const found = await tx.execute(
    sql`select t.connection_id, t.name, t.label, t.source_table, c.start_date::text as start_date
      from copies.lake_table t
      join copies.lake_copy c on c.company_id = t.company_id and c.connection_id = t.connection_id
      where t.company_id = ${companyId} and t.connection_id in (${ids})
      order by t.name`,
  )
  const connectorOfId = new Map(connections.map(({ id, connector }) => [id, connector]))
  for (const raw of found.rows) {
    const row = Row.parse(raw)
    const connector = connectorOf(connectorOfId.get(row.connection_id) ?? '')
    const declared = connector?.tables?.declared.find(
      (table) => sourceOf(table) === row.source_table,
    )
    if (declared === undefined) continue
    const own = tables.get(row.connection_id) ?? []
    own.push({
      name: row.name,
      label: row.label,
      description: declared.description,
      source: row.source_table,
      since: startDateLimits(declared.mode) ? row.start_date : null,
    })
    tables.set(row.connection_id, own)
  }
  return tables
}
