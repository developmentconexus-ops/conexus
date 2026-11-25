import type { CompanyId } from '@conexus/hub-api'
import type { AwsAnswer, LakeId, LakeTables, Where } from '../../platform/aws.ts'

type Dropping = {
  tables: LakeTables
  /** The company's copies and clocks (hub/copies, injected: subjects do not import each other). */
  eraseCopies: (companyId: CompanyId) => Promise<void>
}

/**
 * The lake's tables dropped from AWS's own list, never the Hub's rows (a table AWS lacks counts as
 * dropped), then the company's copies and clocks (criterion 48): so a repeat ends what an
 * interrupted try began. Gives the answer AWS failed with, or null when the lake holds no table.
 */
export async function dropTables(
  deps: Dropping,
  lake: { at: Where; lakeId: LakeId },
  said: (call: 'ListTables' | 'DeleteTable', answer: AwsAnswer<unknown>) => void,
): Promise<AwsAnswer<unknown> | null> {
  const listed = await deps.tables.list(lake.at, lake.lakeId)
  said('ListTables', listed)
  if (listed.kind !== 'DONE') return listed
  for (const table of listed.value) {
    const dropped = await deps.tables.drop(lake.at, lake.lakeId, table)
    said('DeleteTable', dropped)
    if (dropped.kind !== 'DONE') return dropped
  }
  await deps.eraseCopies(lake.at.company)
  return null
}
