import { MastraCompositeStore } from '@mastra/core/storage'
import { ObservabilityStoragePostgresVNext, PostgresStore } from '@mastra/pg'
import type { MastraPool } from '../../platform/database.ts'

/** The age of the Mastra rows the daily prune drops (decision 0068). */
export const RETENTION_DAYS = 14
const MAX_AGE = `${RETENTION_DAYS}d`

/**
 * Mastra's tables in Mastra's database, schema `mastra`, on the pool `main.ts` owns (decision 0010,
 * data D27). Mastra creates them at start with `CREATE TABLE IF NOT EXISTS`; Conexus code never
 * writes them (data D1). The traces, logs and metrics are Mastra's v-next observability domain on
 * the same pool, in day tables that `prune()` drops past `MAX_AGE` (decision 0068), routed by the
 * composite store as Mastra's observability guide does; `PostgresStoreVNext` would do the same but
 * prints a raw warning on a shared pool (`@mastra/pg` 1.38.0 `dist/index.js:29911`). The
 * clock's fire history is the `schedules` domain's `triggers` policy (`dist/index.js:23906`); the
 * `workflowSnapshot` policy stays off, since it keeps no workflow apart and would drop the
 * Assistant's automation runs that the Hub reads: `retention.ts` drops the copy's runs by name.
 */
export function createMastraStorage(pool: MastraPool): MastraCompositeStore {
  return new MastraCompositeStore({
    id: 'conexus-mastra',
    default: new PostgresStore({ id: 'conexus-mastra-default', pool, schemaName: 'mastra' }),
    domains: {
      observability: new ObservabilityStoragePostgresVNext({ pool, schemaName: 'mastra' }),
    },
    retention: {
      observability: {
        spans: { maxAge: MAX_AGE },
        metrics: { maxAge: MAX_AGE },
        logs: { maxAge: MAX_AGE },
      },
      schedules: { triggers: { maxAge: MAX_AGE } },
    },
  })
}
