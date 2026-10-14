import { Version } from '@conexus/hub-api'
import { desc } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import type { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { starts } from './tables.ts'

const StartRow = createSelectSchema(starts).extend({ version: Version })
export type StartRow = z.infer<typeof StartRow>

export async function insertStart(tx: CommandTx, version: Version): Promise<void> {
  await tx.insert(starts).values({ version })
}

export async function lastStarts(tx: ReadTx): Promise<StartRow[]> {
  const rows = await tx.select().from(starts).orderBy(desc(starts.id)).limit(2)
  return rows.map((row) => StartRow.parse(row))
}
