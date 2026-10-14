import { sql } from 'drizzle-orm'
import { bigint, check, pgSchema, text, timestamp } from 'drizzle-orm/pg-core'

export const hub = pgSchema('hub')

export const starts = hub.table(
  'starts',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
    version: text('version').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('starts_version_format', sql`${table.version} ~ '^v[0-9]+\\.[0-9]+\\.[0-9]+$'`),
  ],
)
