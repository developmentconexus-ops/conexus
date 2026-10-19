import { PostgresStore } from '@mastra/pg'
import type { MastraPool } from '../../platform/database.ts'

/**
 * Mastra's tables in Mastra's database, schema `mastra`, on the pool `main.ts` owns (decision 0010,
 * data D27). Mastra creates them at start with `CREATE TABLE IF NOT EXISTS`; Conexus code never
 * writes them (data D1).
 */
export function createMastraStorage(pool: MastraPool): PostgresStore {
  return new PostgresStore({ id: 'conexus-mastra', pool, schemaName: 'mastra' })
}
